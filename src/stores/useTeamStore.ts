/**
 * Team configuration store — CRUD for team doc links + nicknames.
 * Persisted via MMKV.
 */

import { create } from 'zustand';
import type { TeamConfig } from '../types/team';
import { mmkvStorage } from './storage';
import { parseTencentDocUrl } from '../utils/urlParser';

interface TeamState {
  teams: TeamConfig[];
  addTeam: (nickname: string, url: string) => TeamConfig | null;
  removeTeam: (id: string) => void;
  updateTeam: (id: string, updates: Partial<Pick<TeamConfig, 'nickname' | 'url'>>) => void;
}

const STORAGE_KEY = 'team-store';

function loadTeams(): TeamConfig[] {
  const raw = mmkvStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as { state?: { teams?: TeamConfig[] } };
    return parsed.state?.teams ?? [];
  } catch {
    return [];
  }
}

function persistTeams(teams: TeamConfig[]) {
  mmkvStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { teams } }));
}

export const useTeamStore = create<TeamState>()((set) => ({
  teams: loadTeams(),

  addTeam: (nickname: string, url: string) => {
    const parsed = parseTencentDocUrl(url);
    if (!parsed) return null;

    const team: TeamConfig = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      nickname,
      docId: parsed.docId,
      tabId: parsed.tabId,
      url,
      createdAt: Date.now(),
    };

    set((state) => {
      const teams = [...state.teams, team];
      persistTeams(teams);
      return { teams };
    });

    return team;
  },

  removeTeam: (id: string) => {
    set((state) => {
      const teams = state.teams.filter((team) => team.id !== id);
      persistTeams(teams);
      return { teams };
    });
  },

  updateTeam: (id: string, updates: Partial<Pick<TeamConfig, 'nickname' | 'url'>>) => {
    set((state) => {
      const teams = state.teams.map((team) => {
        if (team.id !== id) return team;

        const nextTeam = { ...team };
        if (updates.nickname !== undefined) {
          nextTeam.nickname = updates.nickname;
        }
        if (updates.url !== undefined) {
          const parsed = parseTencentDocUrl(updates.url);
          if (parsed) {
            nextTeam.url = updates.url;
            nextTeam.docId = parsed.docId;
            nextTeam.tabId = parsed.tabId;
          }
        }

        return nextTeam;
      });

      persistTeams(teams);
      return { teams };
    });
  },
}));
