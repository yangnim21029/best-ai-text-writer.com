import { useEffect, useState } from 'react';

const ACCESS_KEY = 'app_access_granted';
const ACCESS_TS_KEY = 'app_access_granted_at';
const ACCESS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function useAppAccess() {
  const [isUnlocked, setIsUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(ACCESS_KEY);
    const tsRaw = localStorage.getItem(ACCESS_TS_KEY);

    if (stored === '1' && tsRaw) {
      const ts = Number(tsRaw);
      if (!Number.isNaN(ts) && Date.now() - ts < ACCESS_TTL_MS) {
        setIsUnlocked(true);
        return;
      }
    }
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(ACCESS_TS_KEY);
  }, []);

  const unlock = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_KEY, '1');
      localStorage.setItem(ACCESS_TS_KEY, Date.now().toString());
    }
    setIsUnlocked(true);
  };

  const lock = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(ACCESS_TS_KEY);
    }
    setIsUnlocked(false);
  };

  return { isUnlocked, unlock, lock };
}
