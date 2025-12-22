import 'dotenv/config';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');
const normalizePath = (value = 'ai') => `/${value.replace(/^\/+/, '').replace(/\/+$/, '')}`;

const baseUrl = trimTrailingSlash(process.env.AI_BASE_URL || process.env.VITE_AI_BASE_URL || '');
const aiPath = normalizePath(process.env.AI_PATH || process.env.VITE_AI_PATH || 'ai');
const modelId = process.env.AI_MODEL_ID || process.env.VITE_AI_MODEL_ID || 'gemini-2.5-flash';
const token = process.env.AI_TOKEN || '';

const endpoint = `${baseUrl}${aiPath}/generate`;

const headers: Record<string, string> = { 'Content-Type': 'application/json' };
if (token) headers.Authorization = `Bearer ${token}`;

const schema = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    summary: { type: 'string' },
  },
  required: ['ok', 'summary'],
  additionalProperties: false,
} as const;

const payload = {
  model: modelId,
  prompt: 'Return a tiny JSON summary with ok=true and a 1-line status message.',
  schema,
};

const expectSuccessShape = (body: any) => {
  if (body?.success === false) {
    const message = body?.message || body?.error || 'Unknown error';
    throw new Error(`AI backend returned success=false: ${message}`);
  }
  if (!body || typeof body !== 'object') {
    throw new Error('AI backend returned non-JSON body');
  }
};

const assertObject = (data: any) => {
  const object = data?.object;
  if (!object || typeof object !== 'object') {
    throw new Error('Missing schema object in response');
  }
  if (object.ok !== true) {
    throw new Error(`Unexpected ok flag: ${object.ok}`);
  }
  if (typeof object.summary !== 'string' || object.summary.length === 0) {
    throw new Error('Missing summary string in schema object');
  }
  return object;
};

const run = async () => {
  if (!baseUrl) {
    throw new Error('Please set AI_BASE_URL (or VITE_AI_BASE_URL)');
  }

  console.log(`→ POST ${endpoint} (model=${modelId})`);
  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Request failed (${res.status}): ${detail}`);
  }

  const json = await res.json();
  expectSuccessShape(json);
  const data = json.data || {};
  const object = assertObject(data);

  const usage = data.usage || {};
  console.log('✓ AI reachable');
  console.log('  summary:', object.summary);
  console.log('  usage:', JSON.stringify(usage));
};

run().catch((err) => {
  console.error('✗ AI smoke test failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
