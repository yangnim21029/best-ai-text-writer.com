import { z } from 'zod';

const envSchema = z.object({
  // AI Configuration
  GOOGLE_VERTEX_PROJECT: z.string().optional(),
  GOOGLE_VERTEX_LOCATION: z.string().optional(),
  GOOGLE_VERTEX_CREDENTIALS: z.string().optional(),
  AI_EMBED_MODEL_ID: z.string().default('gemini-embedding-001'),
  
  // Security
  APP_GUARD_HASH: z.string().optional(),

  // Client-side exposed
  NEXT_PUBLIC_AI_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_APP_GUARD_HASH: z.string().optional(),
});

// Use a direct mapping to ensure variables are picked up even if spread is not supported
const rawEnv = {
  GOOGLE_VERTEX_PROJECT: process.env.GOOGLE_VERTEX_PROJECT,
  GOOGLE_VERTEX_LOCATION: process.env.GOOGLE_VERTEX_LOCATION,
  GOOGLE_VERTEX_CREDENTIALS: process.env.GOOGLE_VERTEX_CREDENTIALS,
  AI_EMBED_MODEL_ID: process.env.AI_EMBED_MODEL_ID,
  APP_GUARD_HASH: process.env.APP_GUARD_HASH,
  NEXT_PUBLIC_AI_BASE_URL: process.env.NEXT_PUBLIC_AI_BASE_URL,
  NEXT_PUBLIC_APP_GUARD_HASH: process.env.NEXT_PUBLIC_APP_GUARD_HASH,
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
}

export const serverEnv = {
  ...parsed.success ? parsed.data : (rawEnv as any),
  // Direct access fallbacks for critical values
  GOOGLE_VERTEX_PROJECT: process.env.GOOGLE_VERTEX_PROJECT,
  GOOGLE_VERTEX_LOCATION: process.env.GOOGLE_VERTEX_LOCATION,
  GOOGLE_VERTEX_CREDENTIALS: process.env.GOOGLE_VERTEX_CREDENTIALS,
};

export const clientEnv = {
  NEXT_PUBLIC_AI_BASE_URL: process.env.NEXT_PUBLIC_AI_BASE_URL,
  NEXT_PUBLIC_APP_GUARD_HASH: process.env.NEXT_PUBLIC_APP_GUARD_HASH,
};

// Helper to get the effective AI Base URL (Server preference, fallback to client)
export const getAiBaseUrl = () => {
  return clientEnv.NEXT_PUBLIC_AI_BASE_URL || '';
};

// Helper to get the effective Proxy Secret (Server side only)
export const getProxySecret = () => {
  return undefined; 
};
