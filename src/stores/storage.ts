/**
 * Storage adapter — uses MMKV on native, localStorage on web.
 */

import { Platform } from 'react-native';

export interface StorageAdapter {
  getItem: (name: string) => string | null;
  setItem: (name: string, value: string) => void;
  removeItem: (name: string) => void;
}

function createStorage(): StorageAdapter {
  if (Platform.OS === 'web') {
    return {
      getItem: (name) => {
        try { return localStorage.getItem(name); } catch { return null; }
      },
      setItem: (name, value) => {
        try { localStorage.setItem(name, value); } catch { /* quota exceeded */ }
      },
      removeItem: (name) => {
        try { localStorage.removeItem(name); } catch { /* ignore */ }
      },
    };
  }

  // Native: use MMKV
  const { MMKV } = require('react-native-mmkv');
  const mmkv = new MMKV({ id: 'qd-tracker-storage' });
  return {
    getItem: (name) => {
      const value = mmkv.getString(name);
      return value ?? null;
    },
    setItem: (name, value) => {
      mmkv.set(name, value);
    },
    removeItem: (name) => {
      mmkv.delete(name);
    },
  };
}

export const mmkvStorage: StorageAdapter = createStorage();
