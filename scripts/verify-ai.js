import assert from 'node:assert/strict';

const trimSlash = (value = '') => value.replace(/\/+$/, '');

const logSkip = (reason) => console.warn(`AI check skipped: ${reason}`);

const main = async () => {
  if (process.env.SKIP_AI_CHECK === '1') {
    return logSkip('SKIP_AI_CHECK=1');
  }

  const base = trimSlash(process.env.AI_BASE_URL || process.env.VITE_AI_BASE_URL || '');
  const healthPath = process.env.AI_HEALTH_PATH || '/health';
  const generatePath = process.env.AI_GENERATE_PATH || '/ai/generate';
  const model = process.env.AI_CHECK_MODEL || 'gemini-2.5-flash';
  const prompt = process.env.AI_CHECK_PROMPT || 'healthcheck';

  if (!base) {
    return logSkip('AI_BASE_URL not provided');
  }

  const healthUrl = `${base}${healthPath}`;
  try {
    const healthRes = await fetch(healthUrl);
    if (healthRes.ok) {
      console.log(`AI health OK: ${healthUrl} (${healthRes.status})`);
      return;
    }
    console.warn(`Health check ${healthUrl} returned ${healthRes.status}, falling back to generate...`);
  } catch (err) {
    console.warn(`Health check failed (${healthUrl}), falling back to generate:`, err?.message || err);
  }

  const generateUrl = `${base}${generatePath}`;
  const res = await fetch(generateUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model })
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    const detail = isJson ? await res.json() : await res.text();
    const message = typeof detail === 'string' ? detail : (detail?.error || JSON.stringify(detail));
    throw new Error(`AI generate check failed (${res.status}): ${message}`);
  }

  const data = isJson ? await res.json() : { text: await res.text() };
  const text = data?.text || (typeof data === 'string' ? data : '');
  assert(text !== undefined, 'AI backend responded without text');
  console.log(`AI generate OK (${generateUrl}): "${String(text).slice(0, 60)}${String(text).length > 60 ? '...' : ''}"`);
};

main().catch((err) => {
  console.error('AI check failed:', err?.message || err);
  process.exit(1);
});
