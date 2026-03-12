import { create } from 'zustand';
import type { LogMessage, LogLevel, MessageStatus } from '../types/message';
import type { IndicatorChangeEvent } from '../types/indicator';
import { mmkvStorage } from './storage';

interface MessageState {
  messages: LogMessage[];
  lastViewedAt: number;
  addMessage: (msg: Omit<LogMessage, 'id' | 'timestamp' | 'status'>) => void;
  markAllRead: () => void;
  acknowledgeAlert: (id: string) => void;
  markShared: (id: string) => void;
  deleteMessage: (id: string) => void;
  getUnreadCount: () => number;
  getPendingAlertCount: () => number;
}

const STORAGE_KEY = 'message-store';

function loadMessages(): { messages: LogMessage[]; lastViewedAt: number } {
  const raw = mmkvStorage.getItem(STORAGE_KEY);
  if (!raw) return { messages: [], lastViewedAt: 0 };
  try {
    const parsed = JSON.parse(raw);
    return {
      messages: parsed.messages ?? [],
      lastViewedAt: parsed.lastViewedAt ?? 0,
    };
  } catch {
    return { messages: [], lastViewedAt: 0 };
  }
}

function persistMessages(messages: LogMessage[], lastViewedAt: number) {
  mmkvStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, lastViewedAt }));
}

let messageCounter = 0;

export const useMessageStore = create<MessageState>()((set, get) => ({
  ...loadMessages(),

  addMessage: (msg) => {
    const message: LogMessage = {
      ...msg,
      id: `msg_${Date.now()}_${messageCounter++}`,
      timestamp: Date.now(),
      status: 'unread',
    };
    set((state) => {
      const messages = [message, ...state.messages].slice(0, 200);
      persistMessages(messages, state.lastViewedAt);
      return { messages };
    });
  },

  markAllRead: () => {
    const now = Date.now();
    set((state) => {
      const messages = state.messages.map((m) =>
        m.status === 'unread' ? { ...m, status: 'read' as MessageStatus } : m,
      );
      persistMessages(messages, now);
      return { messages, lastViewedAt: now };
    });
  },

  acknowledgeAlert: (id: string) => {
    set((state) => {
      const messages = state.messages.map((m) =>
        m.id === id ? { ...m, status: 'acknowledged' as MessageStatus } : m,
      );
      persistMessages(messages, state.lastViewedAt);
      return { messages };
    });
  },

  markShared: (id: string) => {
    set((state) => {
      const messages = state.messages.map((m) =>
        m.id === id ? { ...m, status: 'shared' as MessageStatus } : m,
      );
      persistMessages(messages, state.lastViewedAt);
      return { messages };
    });
  },

  deleteMessage: (id: string) => {
    set((state) => {
      const messages = state.messages.filter((m) => m.id !== id);
      persistMessages(messages, state.lastViewedAt);
      return { messages };
    });
  },

  getUnreadCount: () => {
    const state = get();
    return state.messages.filter(
      (m) => m.status === 'unread' && (m.level === 'INFO' || m.level === 'ALERT'),
    ).length;
  },

  getPendingAlertCount: () => {
    const state = get();
    return state.messages.filter(
      (m) =>
        m.level === 'ALERT' && m.status !== 'acknowledged' && m.status !== 'shared',
    ).length;
  },
}));
