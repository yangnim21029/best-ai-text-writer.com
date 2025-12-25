import { StateStorage } from 'zustand/middleware';

const getSessionId = () => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('session');
};

export const scopedStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    const sessionId = getSessionId();
    const key = sessionId ? `${sessionId}_${name}` : name;
    return localStorage.getItem(key);
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    const sessionId = getSessionId();
    const key = sessionId ? `${sessionId}_${name}` : name;
    localStorage.setItem(key, value);
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    const sessionId = getSessionId();
    const key = sessionId ? `${sessionId}_${name}` : name;
    localStorage.removeItem(key);
  },
};

export const getScopedKey = (baseKey: string, overrideSessionId?: string) => {
    if (typeof window === 'undefined') return baseKey;
    const sessionId = overrideSessionId || getSessionId();
    return sessionId ? `${sessionId}_${baseKey}` : baseKey;
};
