import { z } from 'zod';

const envSchema = z.object({
  // AI Configuration
  AI_BASE_URL: z.string().default('https://ai.seo-kim.com/ai'),
  AI_TOKEN: z.string().optional(),
  AI_EMBED_MODEL_ID: z.string().default('gemini-embedding-001'),
  
  // Security
  APP_GUARD_HASH: z.string().optional(),
  AI_PROXY_SECRET: z.string().optional(),
  SECRET: z.string().optional(), // Fallback for proxy secret

  // Client-side exposed (validated as string, though technically enforced by Next.js build)
  NEXT_PUBLIC_AI_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_APP_GUARD_HASH: z.string().optional(),
});

// Safe parsing to allow build to proceed even if envs are missing (fail at runtime if critical)
const processEnv = {
  ...process.env,
  // Ensure defaults are applied if undefined
};

const parsed = envSchema.safeParse(processEnv);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  // We don't throw here to prevent build crashes, but services might fail later
}

export const serverEnv = parsed.success ? parsed.data : (processEnv as any);

export const clientEnv = {
  // Only explicitly expose what is safe and prefixed with NEXT_PUBLIC_
  NEXT_PUBLIC_AI_BASE_URL: process.env.NEXT_PUBLIC_AI_BASE_URL,
  NEXT_PUBLIC_APP_GUARD_HASH: process.env.NEXT_PUBLIC_APP_GUARD_HASH,
};

// Helper to get the effective AI Base URL (Server preference, fallback to client)
export const getAiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return serverEnv.AI_BASE_URL || clientEnv.NEXT_PUBLIC_AI_BASE_URL || '';
  }
  return clientEnv.NEXT_PUBLIC_AI_BASE_URL || '';
};

// Helper to get the effective Proxy Secret (Server side only)
export const getProxySecret = () => {
  if (typeof window !== 'undefined') return undefined; // Never return secret to client
  return serverEnv.AI_PROXY_SECRET || serverEnv.SECRET;
};
