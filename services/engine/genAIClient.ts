import { AIResponse } from '../../types';
import { AI_DEFAULTS } from '../../config/constants';

interface GenAIRequest {
    model: string;
    contents: any;
    config?: any;
    promptId?: string;
    timeoutMs?: number;
    signal?: AbortSignal;
}

interface RetryOptions {
    attempts?: number;
    delayMs?: number;
}

const DEFAULT_RETRY: Required<RetryOptions> = {
    attempts: AI_DEFAULTS.RETRY_ATTEMPTS,
    delayMs: AI_DEFAULTS.RETRY_DELAY_MS,
};

const DEFAULT_TIMEOUT = AI_DEFAULTS.TIMEOUT_MS;

const env =
    (typeof import.meta !== 'undefined' && (import.meta as any).env)
        ? (import.meta as any).env
        : (process.env as any);

const AI_BASE_URL = (env.VITE_AI_BASE_URL || env.AI_BASE_URL || '').replace(/\/$/, '');
const AI_PATH = (env.VITE_AI_PATH || env.AI_PATH || '/ai').replace(/\/$/, '');

export const buildAiUrl = (path: string) => {
    const prefix = AI_PATH
        ? (AI_PATH.startsWith('/') ? AI_PATH : `/${AI_PATH}`)
        : '';
    return `${AI_BASE_URL}${prefix}${path}`;
};

const extractTextFromCandidates = (candidates: any[] | undefined): string => {
    if (!Array.isArray(candidates)) return '';
    for (const candidate of candidates) {
        const parts = candidate?.content?.parts;
        if (Array.isArray(parts)) {
            const text = parts.map((p: any) => p?.text || '').filter(Boolean).join('');
            if (text) return text;
        }
    }
    return '';
};

const buildPrompt = (contents: any): string => {
    if (!contents) return '';
    if (typeof contents === 'string') return contents;
    if (Array.isArray(contents)) {
        const parts: string[] = [];
        for (const item of contents) {
            if (typeof item === 'string') {
                parts.push(item);
            } else if (item?.parts?.length) {
                const joined = item.parts.map((p: any) => p?.text || '').filter(Boolean).join('');
                if (joined) parts.push(joined);
            } else if (item?.text) {
                parts.push(item.text);
            }
        }
        return parts.join('\n\n');
    }
    if (contents?.parts?.length) {
        return contents.parts.map((p: any) => p?.text || '').filter(Boolean).join('');
    }
    if (contents?.text) return contents.text;
    try {
        return JSON.stringify(contents);
    } catch {
        return '';
    }
};

const extractTextFromUIMessage = (message: any): string => {
    const content = message?.content;
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content
            .map((part: any) => {
                if (typeof part === 'string') return part;
                if (typeof part?.text === 'string') return part.text;
                if (typeof part?.value === 'string') return part.value;
                if (typeof part?.data?.text === 'string') return part.data.text;
                return '';
            })
            .filter(Boolean)
            .join('');
    }
    return '';
};

const parseSseTextContent = (raw: string): { text: string; usageMetadata?: any; object?: any } | null => {
    if (typeof raw !== 'string') return null;
    if (!raw.includes('data:')) return null;

    const chunks = raw.split(/data:\s*/).slice(1);
    if (chunks.length === 0) return null;

    let text = '';
    let usageMetadata: any;
    let object: any;

    for (const chunk of chunks) {
        const line = chunk.split(/\n/)[0].trim();
        if (!line || line === '[DONE]') continue;

        let evt: any;
        try {
            evt = JSON.parse(line);
        } catch {
            continue;
        }

        const type = evt.type || evt.event || evt.kind;
        if (type === 'text-delta') {
            const delta = evt.textDelta ?? evt.delta ?? evt.text;
            if (typeof delta === 'string') text += delta;
        } else if (type === 'message') {
            const msgText = extractTextFromUIMessage(evt.message);
            if (msgText) text += msgText;
            usageMetadata = evt.message?.metadata?.totalUsage || evt.message?.metadata?.usage || usageMetadata;
        } else if (type === 'object') {
            object = evt.object ?? object;
        } else if (type === 'finish') {
            usageMetadata = evt.message?.metadata?.totalUsage ||
                evt.message?.metadata?.usage ||
                evt.usage ||
                evt.totalUsage ||
                usageMetadata;
            if (evt.object !== undefined) object = evt.object;
        } else if (typeof evt.text === 'string' && !type) {
            text += evt.text;
        }
    }

    const cleaned = text.trim() || raw.trim();
    return { text: cleaned, usageMetadata, object };
};

const consumeEventStream = async (body: ReadableStream<Uint8Array>): Promise<AIResponse> => {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    let object: any;
    let usageMetadata: any;

    const processBuffer = () => {
        // Normalize CRLF to LF so we can reliably find blank-line delimiters
        if (buffer.includes('\r\n')) {
            buffer = buffer.replace(/\r\n/g, '\n');
        }

        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const raw = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 2);

            if (!raw) continue;

            // Support standard SSE blocks that include an optional `event:` line before `data:`
            let eventName = '';
            const dataLines: string[] = [];
            for (const line of raw.split('\n')) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                if (trimmed.startsWith(':')) continue; // comment line
                if (trimmed.startsWith('event:')) {
                    eventName = trimmed.slice('event:'.length).trim();
                } else if (trimmed.startsWith('data:')) {
                    dataLines.push(trimmed.slice('data:'.length).trim());
                }
            }

            const payload = dataLines.join('\n').trim();
            if (!payload) continue;

            let evt: any;
            try {
                evt = JSON.parse(payload);
            } catch {
                continue;
            }
            const type = evt.type || evt.event || evt.kind || eventName;
            if (type === 'text-delta') {
                const delta = evt.textDelta ?? evt.delta ?? evt.text;
                if (typeof delta === 'string') text += delta;
            } else if (type === 'message') {
                const msgText = extractTextFromUIMessage(evt.message);
                if (msgText) text += msgText;
                usageMetadata = evt.message?.metadata?.totalUsage || evt.message?.metadata?.usage || usageMetadata;
            } else if (type === 'object') {
                object = evt.object ?? object;
            } else if (type === 'finish') {
                usageMetadata = evt.message?.metadata?.totalUsage || evt.message?.metadata?.usage || evt.usage || evt.totalUsage || usageMetadata;
                if (evt.object !== undefined) object = evt.object;
            } else if (typeof evt.text === 'string') {
                text += evt.text;
            }
        }
    };

    while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        processBuffer();
        if (done) break;
    }
    processBuffer();

    return { text, object, usageMetadata };
};

const normalizeResponse = (raw: any): AIResponse => {
    // Some backends wrap the actual payload under `data`
    const envelope = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
    const candidates =
        envelope?.candidates ||
        raw?.candidates ||
        envelope?.response?.candidates ||
        raw?.response?.candidates;
    let usageMetadata =
        envelope?.totalUsage ||
        envelope?.usageMetadata ||
        envelope?.usage ||
        raw?.totalUsage ||
        raw?.usageMetadata ||
        raw?.usage ||
        envelope?.response?.totalUsage ||
        envelope?.response?.usageMetadata;
    let object = envelope?.object;

    // Check if this is a schema-based response (backend returns 'object' field)
    if (envelope?.object !== undefined) {
        return {
            text: typeof envelope.text === 'string' ? envelope.text : JSON.stringify(envelope.object),
            object: envelope.object,
            usageMetadata,
            candidates
        };
    }

    // Original text-based response
    let text =
        envelope?.text ||
        raw?.text ||
        envelope?.response?.text ||
        raw?.response?.text ||
        extractTextFromCandidates(candidates) ||
        (typeof envelope === 'string' ? envelope : '');

    const parsedStream = parseSseTextContent(text);
    if (parsedStream) {
        text = parsedStream.text;
        object = object ?? parsedStream.object;
        usageMetadata = usageMetadata ?? parsedStream.usageMetadata;
    }

    return { text, usageMetadata, candidates, object };
};

export class GenAIClient {
    async request(
        { model, contents, config, timeoutMs, signal }: GenAIRequest,
        retryOpts: RetryOptions = {}
    ): Promise<AIResponse> {
        const { attempts, delayMs } = { ...DEFAULT_RETRY, ...retryOpts };
        const controller = new AbortController();
        const combinedSignal = signal
            ? new AbortSignalAny([signal, controller.signal]).signal
            : controller.signal;

        const prompt = buildPrompt(contents);
        const payload: Record<string, any> = { model };
        if (prompt) payload.prompt = prompt;

        // Extract schema from config if present
        if (config) {
            const { responseSchema, responseMimeType, ...restConfig } = config;

            // Some backends expect `responseSchema`, others expect `schema`.
            // Send both to stay backward compatible and avoid missing-field errors.
            if (responseSchema) {
                payload.schema = responseSchema;
                payload.responseSchema = responseSchema;
            }

            if (responseMimeType) payload.responseMimeType = responseMimeType;
            if (Object.keys(restConfig).length > 0) payload.config = restConfig;
        }

        if (contents && typeof contents !== 'string') {
            payload.contents = contents;
        }

        let lastError: unknown = null;
        for (let attempt = 0; attempt < attempts; attempt++) {
            const timer = setTimeout(
                () => {
                    console.error('[GenAIClient] Request TIMEOUT after', timeoutMs || DEFAULT_TIMEOUT, 'ms');
                    controller.abort('GenAI request timed out');
                },
                timeoutMs || DEFAULT_TIMEOUT
            );
            try {
                // DEBUG: Log request payload for debugging
                console.log('[GenAIClient] Request payload:', JSON.stringify(payload, null, 2));
                console.log('[GenAIClient] Request URL:', buildAiUrl('/generate'));

                const token = env.VITE_AI_TOKEN || env.AI_TOKEN;
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json',
                };
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const doRequest = async (path: string) => fetch(buildAiUrl(path), {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(payload),
                    signal: combinedSignal,
                });

                let response = await doRequest('/generate');

                // Backward compatibility: try /stream if /generate is missing
                if (response.status === 404) {
                    response = await doRequest('/stream');
                }

                const contentType = response.headers.get('content-type') || '';
                const isJson = contentType.includes('application/json');
                const isEventStream = contentType.includes('text/event-stream');

                if (!response.ok) {
                    const errorData = isJson ? await response.json() : await response.text();
                    const detail = typeof errorData === 'string'
                        ? errorData
                        : (errorData.error || JSON.stringify(errorData));
                    throw new Error(`Failed to generate content (HTTP ${response.status}): ${detail}`);
                }

                if (isEventStream) {
                    if (!response.body) throw new Error('Stream response missing body');
                    const streamed = await consumeEventStream(response.body);
                    clearTimeout(timer);
                    return streamed;
                }

                const data = isJson ? await response.json() : { text: await response.text() };
                clearTimeout(timer);
                return normalizeResponse(data);
            } catch (err: any) {
                lastError = err;
                clearTimeout(timer);
                const message = err?.message || '';
                const retryable = message.includes('503') || message.includes('UNAVAILABLE') || message.toLowerCase().includes('overloaded');
                if (attempt < attempts - 1 && retryable) {
                    const wait = delayMs * (attempt + 1);
                    console.warn(`GenAI retry (${attempt + 1}/${attempts}) after ${wait}ms due to: ${message}`);
                    await new Promise((res) => setTimeout(res, wait));
                    continue;
                }
                if (attempt < attempts - 1) {
                    await new Promise((res) => setTimeout(res, delayMs));
                }
            }
        }
        throw lastError instanceof Error ? lastError : new Error(`GenAI request failed: ${String(lastError)}`);
    }
}

// Simple helper to merge multiple AbortSignals
class AbortSignalAny {
    private controller: AbortController;
    public signal: AbortSignal;

    constructor(signals: AbortSignal[]) {
        this.controller = new AbortController();
        this.signal = this.controller.signal;

        signals.forEach((sig) => {
            if (sig) {
                if (sig.aborted) {
                    this.controller.abort(sig.reason);
                } else {
                    sig.addEventListener('abort', () => this.controller.abort(sig.reason));
                }
            }
        });
    }
}

export const genAIClient = new GenAIClient();
