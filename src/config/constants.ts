import { serverEnv } from './env';

const env =
  typeof import.meta !== 'undefined' && (import.meta as any).env
    ? (import.meta as any).env
    : (process.env as any);

export const MODEL = {
  FLASH: 'gemini-3-flash-preview',
  IMAGE_PREVIEW: 'gemini-2.5-image-flash',
};

export const EMBED_MODEL_ID = serverEnv.AI_EMBED_MODEL_ID;

export const PRICING = {
  FLASH: {
    input: 0.3 / 1000000,
    output: 0.3 / 1000000,
  },
  IMAGE_PREVIEW: {
    input: 0.3 / 1000000,
    output: 30.0 / 1000000,
  },
  IMAGE_GEN: {
    input: 0.3 / 1000000,
    output: 30.0 / 1000000,
  },
};

export const AI_DEFAULTS = {
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY_MS: 300,
  // Longer timeout to accommodate heavy multimodal/long-context calls
  TIMEOUT_MS: 120000,
};

// Magic number tuned to balance keyword coverage with AI speed/cost
export const SEMANTIC_KEYWORD_LIMIT = 30;
export const KEYWORD_CHAR_DIVISOR = 200;
export const MIN_KEYWORDS = 10;
