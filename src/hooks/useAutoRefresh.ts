import { useEffect, useRef, useState, useCallback } from 'react';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useTeamStore } from '../stores/useTeamStore';
import { useDataStore } from '../stores/useDataStore';

export function useAutoRefresh() {
  const refreshRate = useSettingsStore((s) => s.refreshRate);
  const teams = useTeamStore((s) => s.teams);
  const fetchAllTeams = useDataStore((s) => s.fetchAllTeams);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const teamsRef = useRef(teams);
  teamsRef.current = teams;
  const isRefreshingRef = useRef(false);

  const doRefresh = useCallback(async () => {
    const currentTeams = teamsRef.current;
    if (currentTeams.length === 0) return;

    // Guard: skip if a previous refresh is still in-flight
    if (isRefreshingRef.current) return;

    isRefreshingRef.current = true;
    setIsRefreshing(true);
    try {
      await fetchAllTeams(currentTeams);
      setLastRefreshAt(Date.now());
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [fetchAllTeams]);

  useEffect(() => {
    if (paused || teams.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    doRefresh();

    intervalRef.current = setInterval(doRefresh, refreshRate);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refreshRate, paused, teams.length, doRefresh]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  return { isRefreshing, lastRefreshAt, paused, pause, resume };
}
