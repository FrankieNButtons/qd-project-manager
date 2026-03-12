import { create } from 'zustand';
import { mmkvStorage } from './storage';

export type RefreshRate = 1000 | 3000 | 5000;
export type WeightMethod = 'fixed';

interface SettingsState {
  refreshRate: RefreshRate;
  weights: Record<string, number>;
  weightMethod: WeightMethod;
  showRefreshBubble: boolean;
  setRefreshRate: (rate: RefreshRate) => void;
  setWeight: (indicator: string, weight: number) => void;
  resetEqualWeights: (indicators: string[]) => void;
  setWeights: (weights: Record<string, number>) => void;
  setShowRefreshBubble: (show: boolean) => void;
}

const STORAGE_KEY = 'settings-store';

type PersistedSettings = Pick<SettingsState, 'refreshRate' | 'weights' | 'weightMethod' | 'showRefreshBubble'>;

function loadSettings(): PersistedSettings {
  const raw = mmkvStorage.getItem(STORAGE_KEY);
  if (!raw) return { refreshRate: 3000, weights: {}, weightMethod: 'fixed', showRefreshBubble: true };
  try {
    const parsed = JSON.parse(raw);
    return {
      refreshRate: parsed.refreshRate ?? 3000,
      weights: parsed.weights ?? {},
      weightMethod: parsed.weightMethod ?? 'fixed',
      showRefreshBubble: parsed.showRefreshBubble ?? true,
    };
  } catch {
    return { refreshRate: 3000, weights: {}, weightMethod: 'fixed', showRefreshBubble: true };
  }
}

function persist(data: PersistedSettings) {
  mmkvStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getPersisted(state: SettingsState): PersistedSettings {
  return {
    refreshRate: state.refreshRate,
    weights: state.weights,
    weightMethod: state.weightMethod,
    showRefreshBubble: state.showRefreshBubble,
  };
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...loadSettings(),

  setRefreshRate: (rate: RefreshRate) => {
    set({ refreshRate: rate });
    persist(getPersisted({ ...get(), refreshRate: rate }));
  },

  setWeight: (indicator: string, weight: number) => {
    set((state) => {
      const weights = { ...state.weights, [indicator]: weight };
      persist(getPersisted({ ...state, weights }));
      return { weights };
    });
  },

  resetEqualWeights: (indicators: string[]) => {
    const equalWeight = indicators.length > 0 ? 1 / indicators.length : 0;
    const weights: Record<string, number> = {};
    for (const ind of indicators) {
      weights[ind] = equalWeight;
    }
    set((state) => {
      persist(getPersisted({ ...state, weights }));
      return { weights };
    });
  },

  setWeights: (weights: Record<string, number>) => {
    set((state) => {
      persist(getPersisted({ ...state, weights }));
      return { weights };
    });
  },

  setShowRefreshBubble: (show: boolean) => {
    set({ showRefreshBubble: show });
    persist(getPersisted({ ...get(), showRefreshBubble: show }));
  },
}));
