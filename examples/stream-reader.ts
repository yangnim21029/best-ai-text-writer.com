import { readUIMessageStream } from 'ai';
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

const extractMessageText = (message: any) => {
  const content = message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part: any) => {
        if (typeof part === 'string') return part;
        if (typeof part?.text === 'string') return part.text;
        if (typeof part?.value === 'string') return part.value;
        return '';
      })
      .filter(Boolean)
      .join('');
  }
  return '';
};

const handleUIStream = async (res: Response) => {
  if (!res.body) throw new Error('Missing stream body');
  let lastMessage: any = null;
  let printed = '';

  for await (const message of readUIMessageStream({ stream: res.body as any })) {
    lastMessage = message;
    const text = extractMessageText(message) || '';
    if (text.length > printed.length) {
      process.stdout.write(text.slice(printed.length));
      printed = text;
    }
  }

  const usage = lastMessage?.metadata?.totalUsage || lastMessage?.metadata?.usage;
  console.log('\n---\nUsage:', usage ?? 'n/a');
};

const handleSchemaStream = async (res: Response) => {
  if (!res.body) throw new Error('Missing stream body');
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let text = '';
  let usage: any;
  let object: any;

  while (true) {
    const { value, done } = await reader.read();
    buf += dec.decode(value || new Uint8Array(), { stream: !done });
    let idx;
    while ((idx = buf.indexOf('\n\n')) !== -1) {
      const block = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 2);
      if (!block) continue;

      const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
      let eventName: string | null = null;
      const dataLines: string[] = [];

      for (const line of lines) {
        if (line.startsWith('event:')) {
          eventName = line.slice(6).trimStart();
          continue;
        }
        if (line.startsWith('data:')) {
          dataLines.push(line.slice(5).trimStart());
        }
      }

      if (!dataLines.length) continue;
      const payloadStr = dataLines.join('\n');
      let evt: any;
      try {
        evt = JSON.parse(payloadStr);
      } catch {
        continue;
      }
      if (!evt.type && eventName) {
        evt.type = eventName;
      }

      if (evt.type === 'text-delta') {
        const delta = evt.textDelta ?? evt.delta ?? evt.text;
        if (typeof delta === 'string') {
          text += delta;
          process.stdout.write(delta);
        }
      }
      if (evt.type === 'object') {
        if (evt.object !== undefined) {
          object = evt.object;
        }
      }
      if (evt.type === 'finish') {
        usage = evt.usage || evt.totalUsage || usage;
        if (evt.object !== undefined) {
          object = evt.object;
        }
      }
    }
    if (done) break;
  }

  console.log('\n---\nText:', text || '(empty)');
  console.log('Object:', object !== undefined ? JSON.stringify(object, null, 2) : '(none)');
  console.log('Usage:', usage ?? 'n/a');
};

const handleResponse = async (res: Response) => {
  const contentType = res.headers.get('content-type') || '';
  const isSse = contentType.includes('text/event-stream');

  if (!res.ok) {
    const detail = isSse ? await res.text() : await res.text();
    throw new Error(`Request failed: ${res.status} ${detail}`);
  }

  if (isSse) {
    const isUIStream = Boolean(res.headers.get('x-vercel-ai-ui-message-stream'));
    if (isUIStream) {
      await handleUIStream(res);
    } else {
      await handleSchemaStream(res);
    }
    return;
  }

  const json = await res.json();
  const usage = json?.data?.totalUsage || json?.data?.usage || json?.totalUsage || json?.usage;
  const text = json?.data?.text || json?.text || '';
  console.log(text || JSON.stringify(json, null, 2));
  console.log('\nUsage:', usage ?? 'n/a');
};

const main = async () => {
  console.log(`→ POST ${streamEndpoint} (streaming)`);
  const body = JSON.stringify({ prompt, model });

  let res = await fetch(streamEndpoint, { method: 'POST', headers, body });

  // Fallback for deployments without /stream
  if (res.status === 404) {
    console.warn('Stream endpoint returned 404; retrying /generate without streaming...');
    res = await fetch(generateEndpoint, { method: 'POST', headers, body });
  }

  await handleResponse(res);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
