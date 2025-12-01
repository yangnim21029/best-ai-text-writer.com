export const MODEL = {
    FLASH: 'gemini-2.5-flash',
    IMAGE_PREVIEW: 'google/gemini-2.5-flash-image',
};

export const EMBED_MODEL_ID =
    import.meta.env.VITE_EMBED_MODEL_ID ||
    import.meta.env.AI_EMBED_MODEL_ID ||
    'gemini-embedding-001';

export const PRICING = {
    FLASH: {
        input: 0.30 / 1000000,
        output: 0.30 / 1000000,
    },
    IMAGE_PREVIEW: {
        input: 0.30 / 1000000,
        output: 30.00 / 1000000,
    },
    IMAGE_GEN: {
        input: 0.30 / 1000000,
        output: 30.00 / 1000000,
    },
};

export const AI_DEFAULTS = {
    RETRY_ATTEMPTS: 2,
    RETRY_DELAY_MS: 300,
    // Longer timeout to accommodate heavy multimodal/long-context calls
    TIMEOUT_MS: 120000,
};
