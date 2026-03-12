import { useEffect } from 'react';
import { useTeamStore } from '../../stores/useTeamStore';
import { useDataStore } from '../../stores/useDataStore';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useIndicatorDiff } from '../../hooks/useIndicatorDiff';
import { useNotifications } from './NotificationProvider';

export function AppInitializer() {
  const teams = useTeamStore((s) => s.teams);
  const sheets = useDataStore((s) => s.sheets);
  const { processEvents } = useNotifications();

  // Auto-refresh loop
  useAutoRefresh();

  // Indicator diff tracking
  const teamIds = teams.map((t) => t.id);
  useIndicatorDiff(sheets, teamIds, processEvents);

  return null;
}
