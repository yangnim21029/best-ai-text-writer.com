export const STORAGE_KEYS = {
  ACCESS_KEY: 'pro_content_writer_access_v1',
  ACCESS_TS_KEY: 'pro_content_writer_access_ts',
  FORM_INPUTS: 'pro_content_writer_inputs_simple_v4',
  SAVED_PROFILES: 'pro_content_writer_profiles_v1',
  ANALYSIS_STATE: 'pro_content_writer_analysis_state',
  GENERATION_STATE: 'pro_content_writer_generation_state',
  METRICS_STATE: 'pro_content_writer_metrics_state',
} as const;

export const TTL = {
  ACCESS_TOKEN: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

export const storage = {
  hasValidAccess: (): boolean => {
    const storedKey = localStorage.getItem(STORAGE_KEYS.ACCESS_KEY);
    const storedTs = localStorage.getItem(STORAGE_KEYS.ACCESS_TS_KEY);

    if (!storedKey || !storedTs) return false;

    const now = Date.now();
    const timestamp = parseInt(storedTs, 10);

    if (isNaN(timestamp)) return false;
    return now - timestamp < TTL.ACCESS_TOKEN;
  },

  setAccessGranted: (accessKey: string) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_KEY, accessKey);
    localStorage.setItem(STORAGE_KEYS.ACCESS_TS_KEY, Date.now().toString());
  },

  clearAccess: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_KEY);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TS_KEY);
  },

  clearAllData: (includeForm = false) => {
    localStorage.removeItem(STORAGE_KEYS.ANALYSIS_STATE);
    localStorage.removeItem(STORAGE_KEYS.GENERATION_STATE);
    localStorage.removeItem(STORAGE_KEYS.METRICS_STATE);
    if (includeForm) {
      localStorage.removeItem(STORAGE_KEYS.FORM_INPUTS);
    }
  },
};
