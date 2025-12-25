import { StateStorage } from 'zustand/middleware';
import { db } from './db';

const getSessionId = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('session');
};


export const scopedStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === 'undefined') return null;
    const sessionId = getSessionId();
    const key = sessionId ? `${sessionId}_${name}` : name;

    try {
      const item = await db.kv.get(key);
      return item ? item.value : null;
    } catch (e) {
      console.error('Failed to get item from IndexedDB', e);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    const sessionId = getSessionId();
    const key = sessionId ? `${sessionId}_${name}` : name;

    try {
      await db.kv.put({ key, value });
    } catch (e) {
      console.error('Failed to set item in IndexedDB', e);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    const sessionId = getSessionId();
    const key = sessionId ? `${sessionId}_${name}` : name;

    try {
      await db.kv.delete(key);
    } catch (e) {
      console.error('Failed to remove item from IndexedDB', e);
    }
  },
};

export const getScopedKey = (baseKey: string, overrideSessionId?: string) => {
  if (typeof window === 'undefined') return baseKey;
  const sessionId = overrideSessionId || getSessionId();
  return sessionId ? `${sessionId}_${baseKey}` : baseKey;
};
