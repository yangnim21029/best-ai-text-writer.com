import 'dotenv/config';

type Mode = 'generate' | 'schema' | 'image';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');
const normalizePath = (value = 'ai') => `/${value.replace(/^\/+/, '').replace(/\/+$/, '')}`;

const mode = (process.argv[2] as Mode) || 'generate';

const baseUrl = trimTrailingSlash(process.env.AI_BASE_URL || process.env.VITE_AI_BASE_URL || '');
const aiPath = normalizePath(process.env.AI_PATH || process.env.VITE_AI_PATH || 'ai');
const token = process.env.AI_TOKEN;

if (!baseUrl) {
  console.error('Please set AI_BASE_URL (or VITE_AI_BASE_URL) in your .env');
  process.exit(1);
}

const endpoint =
  mode === 'image'
    ? `${baseUrl}${aiPath}/image`
    : `${baseUrl}${aiPath}/generate`;

const bodyByMode: Record<Mode, Record<string, unknown>> = {
  generate: {
    prompt: 'Hello from the TypeScript quickstart!',
    model: 'gemini-2.5-flash',
  },
  schema: {
    prompt: 'Generate article metadata for SEO',
    model: 'gemini-2.5-flash',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        keywords: { type: 'array', items: { type: 'string' } },
      },
      required: ['title', 'description', 'keywords'],
    },
  },
  image: {
    prompt: 'A scenic mountain lake at sunrise',
    model: 'google/gemini-2.5-flash-image',
    aspectRatio: '16:9',
  },
};

const headers: Record<string, string> = { 'Content-Type': 'application/json' };
if (token) headers.Authorization = `Bearer ${token}`;

const main = async () => {
  console.log(`→ POST ${endpoint} (mode=${mode})`);

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyByMode[mode]),
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    const detail = isJson ? await res.json() : await res.text();
    throw new Error(`Request failed (${res.status}): ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }

  const data = isJson ? await res.json() : { text: await res.text() };
  console.log('✓ Success\n', JSON.stringify(data, null, 2));
};

main().catch((err) => {
  console.error('✗ Error', err);
  process.exit(1);
});
