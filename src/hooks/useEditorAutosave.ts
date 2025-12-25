import { useCallback, useEffect, useRef } from 'react';
import { getScopedKey } from '../utils/scopedStorage';

type MetaState = {
  metaTitle?: string;
  metaDescription?: string;
  urlSlug?: string;
  articleTitle?: string;
};

interface UseEditorAutosaveParams {
  storageKey?: string;
  debounceMs?: number;
}

export const useEditorAutosave = ({
  storageKey = 'ai_writer_editor_autosave_v1',
  debounceMs = 3000,
}: UseEditorAutosaveParams) => {
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestHtmlRef = useRef<string>('');
  const latestMetaRef = useRef<MetaState>({});
  const pendingRestoreRef = useRef<any | null>(null);
  const lastSavedRef = useRef<string>(''); // cache serialized payload to avoid redundant writes

  // Load saved draft on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const key = getScopedKey(storageKey);
      const savedRaw = localStorage.getItem(key);
      if (!savedRaw) return;
      const saved = JSON.parse(savedRaw);
      if (saved && saved.html) {
        pendingRestoreRef.current = saved;
      }
    } catch (e) {
      console.warn('Failed to read autosave', e);
    }
  }, [storageKey]);

  const queueAutosave = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      const payload = {
        html: latestHtmlRef.current || '',
        ...latestMetaRef.current,
        ts: Date.now(),
      };
      if (!payload.html.trim()) return;
      const serialized = JSON.stringify(payload);
      if (serialized === lastSavedRef.current) return;
      try {
        const key = getScopedKey(storageKey);
        localStorage.setItem(key, serialized);
        lastSavedRef.current = serialized;
      } catch (e) {
        console.warn('Autosave failed', e);
      }
    }, debounceMs);
  }, [debounceMs, storageKey]);

  const recordHtml = useCallback(
    (html: string) => {
      latestHtmlRef.current = html || '';
      queueAutosave();
    },
    [queueAutosave]
  );

  const recordMeta = useCallback(
    (meta: MetaState) => {
      latestMetaRef.current = { ...latestMetaRef.current, ...meta };
      queueAutosave();
    },
    [queueAutosave]
  );

  const consumeDraft = useCallback(() => {
    const saved = pendingRestoreRef.current;
    pendingRestoreRef.current = null;
    return saved as (MetaState & { html: string }) | null;
  }, []);

  return { recordHtml, recordMeta, consumeDraft };
};
