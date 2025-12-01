import 'dotenv/config';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');
const normalizePath = (value = 'ai') => `/${value.replace(/^\/+/, '').replace(/\/+$/, '')}`;

export const AI_BASE_URL = trimTrailingSlash(process.env.AI_BASE_URL || process.env.VITE_AI_BASE_URL || '');
export const AI_PATH = normalizePath(process.env.AI_PATH || process.env.VITE_AI_PATH || 'ai');
export const EMBED_MODEL_ID = process.env.AI_EMBED_MODEL_ID || process.env.VITE_AI_EMBED_MODEL_ID || 'gemini-embedding-001';
export const AI_TOKEN = process.env.AI_TOKEN || '';
export const EMBED_ENDPOINT = `${AI_PATH}/embed`;

const headers: Record<string, string> = { 'Content-Type': 'application/json' };
if (AI_TOKEN) headers.Authorization = `Bearer ${AI_TOKEN}`;

const ensureBaseUrl = () => {
  if (!AI_BASE_URL) {
    throw new Error('Please set AI_BASE_URL (or VITE_AI_BASE_URL) in your .env');
  }
};

export const postJson = async <T>(path: string, body: unknown): Promise<T> => {
  ensureBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${AI_BASE_URL}${normalizedPath}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    const detail = isJson ? await res.json().catch(() => undefined) : await res.text();
    const message = typeof detail === 'string' ? detail : (detail as any)?.error || JSON.stringify(detail || '');
    throw new Error(`Request failed (${res.status}): ${message}`);
  }

  return (isJson ? await res.json() : (await res.text())) as T;
};
