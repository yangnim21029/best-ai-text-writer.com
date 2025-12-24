import { z } from 'zod';

const envSchema = z.object({
  // AI Configuration (Vertex AI)
  GOOGLE_VERTEX_PROJECT: z.string().optional(),
  GOOGLE_VERTEX_LOCATION: z.string().default('global'),
  GOOGLE_VERTEX_CREDENTIALS: z.string().optional(),
  AI_EMBED_MODEL_ID: z.string().default('gemini-embedding-001'),
  
  // Security
  APP_GUARD_HASH: z.string().optional(),

  // Client-side exposed
  NEXT_PUBLIC_AI_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_APP_GUARD_HASH: z.string().optional(),
});

// Use a direct mapping to ensure variables are picked up reliably
const rawEnv = {
  GOOGLE_VERTEX_PROJECT: process.env.GOOGLE_VERTEX_PROJECT,
  GOOGLE_VERTEX_LOCATION: process.env.GOOGLE_VERTEX_LOCATION || 'global',
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

// Helper to safely extract project_id from credentials JSON
const getProjectIdFromCredentials = (creds?: string) => {
  if (!creds) return undefined;
  try {
    const cleaned = creds.trim().replace(/^'|'$/g, '');
    const parsed = JSON.parse(cleaned);
    return parsed.project_id;
  } catch (e) {
    return undefined;
  }
};

const vertexProject = process.env.GOOGLE_VERTEX_PROJECT || getProjectIdFromCredentials(process.env.GOOGLE_VERTEX_CREDENTIALS);

export const serverEnv = {
  ...parsed.success ? parsed.data : (rawEnv as any),
  GOOGLE_VERTEX_PROJECT: vertexProject,
  GOOGLE_VERTEX_LOCATION: process.env.GOOGLE_VERTEX_LOCATION || 'global',
  GOOGLE_VERTEX_CREDENTIALS: process.env.GOOGLE_VERTEX_CREDENTIALS,
};

export const clientEnv = {
  NEXT_PUBLIC_AI_BASE_URL: process.env.NEXT_PUBLIC_AI_BASE_URL,
  NEXT_PUBLIC_APP_GUARD_HASH: process.env.NEXT_PUBLIC_APP_GUARD_HASH,
};

// Helper to get the effective AI Base URL
export const getAiBaseUrl = () => {
  return clientEnv.NEXT_PUBLIC_AI_BASE_URL || '';
};

// Helper to get the effective Proxy Secret (Deprecated)
export const getProxySecret = () => {
  return undefined; 
};