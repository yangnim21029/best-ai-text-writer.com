import { readUIMessageStream } from 'ai';
import 'dotenv/config';

type Mode = 'generate' | 'schema' | 'stream' | 'image';

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
    : mode === 'stream'
      ? `${baseUrl}${aiPath}/stream`
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
  stream: {
    prompt: 'Stream this response please',
    model: 'gemini-2.5-flash',
  },
  image: {
    prompt: 'A scenic mountain lake at sunrise',
    model: 'google/gemini-2.5-flash-image',
    aspectRatio: '16:9',
  },
};

const headers: Record<string, string> = { 'Content-Type': 'application/json' };
if (token) headers.Authorization = `Bearer ${token}`;

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

const readUIStream = async (res: Response) => {
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

const readSchemaStream = async (res: Response) => {
  if (!res.body) throw new Error('Missing stream body');
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let text = '';
  let usage: any;

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
      if (evt.type === 'finish') {
        usage = evt.usage || evt.totalUsage || usage;
      }
    }
    if (done) break;
  }

  console.log('\n---\nText:', text || '(empty)');
  console.log('Usage:', usage ?? 'n/a');
};

const handleResponse = async (res: Response) => {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const isSse = contentType.includes('text/event-stream');

  if (!res.ok) {
    const detail = isJson ? await res.json() : await res.text();
    throw new Error(`Request failed (${res.status}): ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
  }

  if (isSse) {
    const isUI = Boolean(res.headers.get('x-vercel-ai-ui-message-stream'));
    if (isUI) {
      await readUIStream(res);
    } else {
      await readSchemaStream(res);
    }
    return;
  }

  const data = isJson ? await res.json() : { text: await res.text() };
  const usage = data?.data?.totalUsage || data?.data?.usage || data?.totalUsage || data?.usage;
  console.log('✓ Success\n', JSON.stringify(data, null, 2));
  if (usage) console.log('Usage:', usage);
};

const main = async () => {
  console.log(`→ POST ${endpoint} (mode=${mode})`);

  const doRequest = async (url: string) =>
    fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyByMode[mode]),
    });

  let res = await doRequest(endpoint);

  // Fallback: if /stream is missing, retry /generate automatically
  if (mode === 'stream' && res.status === 404) {
    const fallback = `${baseUrl}${aiPath}/generate`;
    console.log(`↻ /stream returned 404, retrying ${fallback}`);
    res = await doRequest(fallback);
  }

  await handleResponse(res);
};

main().catch((err) => {
  console.error('✗ Error', err);
  process.exit(1);
});
