import 'dotenv/config';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');
const normalizePath = (value = 'ai') => `/${value.replace(/^\/+/, '').replace(/\/+$/, '')}`;

const baseUrl = trimTrailingSlash(process.env.AI_BASE_URL || process.env.VITE_AI_BASE_URL || '');
const aiPath = normalizePath(process.env.AI_PATH || process.env.VITE_AI_PATH || 'ai');
const token = process.env.AI_TOKEN;
const prompt = process.argv.slice(2).join(' ') || 'Give me two SEO title ideas for summer travel.';
const model = process.env.AI_MODEL_ID || 'gemini-2.5-flash';

if (!baseUrl) {
  console.error('Please set AI_BASE_URL (or VITE_AI_BASE_URL) in your .env');
  process.exit(1);
}

const headers: Record<string, string> = { 'Content-Type': 'application/json' };
if (token) headers.Authorization = `Bearer ${token}`;

const streamEndpoint = `${baseUrl}${aiPath}/stream`;
const generateEndpoint = `${baseUrl}${aiPath}/generate`;

const readStream = async (res: Response) => {
  if (!res.ok || !res.body) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let combined = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    combined += chunk;
    process.stdout.write(chunk);
  }
  combined += decoder.decode();
  console.log('\n---\nStream finished.');
  return combined;
};

const main = async () => {
  console.log(`→ POST ${streamEndpoint} (streaming)`);
  const body = JSON.stringify({ prompt, model });

  let res = await fetch(streamEndpoint, { method: 'POST', headers, body });

  // Fallback for deployments without /stream
  if (res.status === 404) {
    console.warn('Stream endpoint returned 404; retrying /generate without streaming...');
    res = await fetch(generateEndpoint, { method: 'POST', headers, body });
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  await readStream(res);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
