/**
 * Live sheet data store — holds fetched sheet data per team.
 */

import { create } from 'zustand';
import type { SheetData } from '../types/sheet';
import type { TeamConfig } from '../types/team';
import { resolveSheetData } from '../services/dataResolver';

interface DataState {
  /** Map of teamId → SheetData */
  sheets: Record<string, SheetData>;
  /** Map of teamId → loading state */
  loading: Record<string, boolean>;
  /** Map of teamId → error message */
  errors: Record<string, string | null>;
  /** Fetch sheet data for a single team */
  fetchTeam: (teamId: string, docId: string, tabId: string) => Promise<void>;
  /** Fetch data for all teams concurrently */
  fetchAllTeams: (teams: TeamConfig[]) => Promise<void>;
  /** Clear data for a team */
  clearTeam: (teamId: string) => void;
}

export const useDataStore = create<DataState>()((set, get) => ({
  sheets: {},
  loading: {},
  errors: {},

  fetchTeam: async (teamId: string, docId: string, tabId: string) => {
    set((state) => ({
      loading: { ...state.loading, [teamId]: true },
      errors: { ...state.errors, [teamId]: null },
    }));

    try {
      const data = await resolveSheetData(docId, tabId);
      set((state) => ({
        sheets: { ...state.sheets, [teamId]: data },
        loading: { ...state.loading, [teamId]: false },
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      set((state) => ({
        loading: { ...state.loading, [teamId]: false },
        errors: { ...state.errors, [teamId]: message },
      }));
    }
  },

  fetchAllTeams: async (teams: TeamConfig[]) => {
    // Mark all as loading, but do NOT clear errors yet
    const loadingUpdate: Record<string, boolean> = {};
    for (const team of teams) {
      loadingUpdate[team.id] = true;
    }
    set((state) => ({
      loading: { ...state.loading, ...loadingUpdate },
    }));

    const results = await Promise.allSettled(
      teams.map(async (team) => {
        const data = await resolveSheetData(team.docId, team.tabId);
        return { teamId: team.id, data };
      }),
    );

    const sheetsUpdate: Record<string, SheetData> = {};
    const loadingDone: Record<string, boolean> = {};
    const errorsDone: Record<string, string | null> = {};

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const teamId = teams[i].id;
      loadingDone[teamId] = false;

      if (result.status === 'fulfilled') {
        sheetsUpdate[teamId] = result.value.data;
        errorsDone[teamId] = null; // clear error on success
      } else {
        const message =
          result.reason instanceof Error ? result.reason.message : String(result.reason);
        errorsDone[teamId] = message;
        // Keep existing sheet data on error (don't wipe it)
      }
    }

    set((state) => ({
      sheets: { ...state.sheets, ...sheetsUpdate },
      loading: { ...state.loading, ...loadingDone },
      errors: { ...state.errors, ...errorsDone },
    }));
  },

  clearTeam: (teamId: string) => {
    set((state) => {
      const { [teamId]: _s, ...sheets } = state.sheets;
      const { [teamId]: _l, ...loading } = state.loading;
      const { [teamId]: _e, ...errors } = state.errors;
      return { sheets, loading, errors };
    });
  },
}));
