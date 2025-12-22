interface ClearOptions {
  reload?: boolean;
  includeForm?: boolean;
}

const CLEAR_KEYS = [
  'pro_content_writer_analysis',
  'pro_content_writer_generation',
  'ai_writer_editor_autosave_v1',
];

export const useStorageReset = () => {
  const clearAll = ({ reload = true, includeForm = true }: ClearOptions = {}) => {
    if (typeof window === 'undefined') return;
    try {
      const keys = [...CLEAR_KEYS];
      if (includeForm) keys.push('pro_content_writer_inputs_simple_v4');
      keys.forEach((k) => localStorage.removeItem(k));
      sessionStorage.removeItem('autosave_restore_decision');
    } catch (e) {
      console.warn('Failed to clear storage', e);
    }
    if (reload) window.location.reload();
  };

  return { clearAll };
};
