import { AIResponse } from './ai';
import { AI_DEFAULTS } from '../config/constants';

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

const AI_BASE_URL = (import.meta.env.VITE_AI_BASE_URL || '').replace(/\/$/, '');
const AI_PATH = (import.meta.env.VITE_AI_PATH || '/ai').replace(/\/$/, '');

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

const normalizeResponse = (data: any): AIResponse => {
    const candidates = data?.candidates || data?.response?.candidates;
    const usageMetadata = data?.usageMetadata || data?.usage || data?.response?.usageMetadata;

    // Check if this is a schema-based response (backend returns 'object' field)
    if (data?.object !== undefined) {
        return {
            text: JSON.stringify(data.object),
            object: data.object,
            usageMetadata,
            candidates
        };
    }

    // Original text-based response
    const text =
        data?.text ||
        data?.response?.text ||
        extractTextFromCandidates(candidates) ||
        (typeof data === 'string' ? data : '');
    return { text, usageMetadata, candidates };
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
        let useGeneratePath = false;
        for (let attempt = 0; attempt < attempts; attempt++) {
            const timer = setTimeout(
                () => {
                    console.error('[GenAIClient] Request TIMEOUT after', timeoutMs || DEFAULT_TIMEOUT, 'ms');
                    controller.abort('GenAI request timed out');
                },
                timeoutMs || DEFAULT_TIMEOUT
            );
            try {
                const path = useGeneratePath ? '/generate' : '/stream';
                const response = await fetch(buildAiUrl(path), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: combinedSignal,
                });

                const contentType = response.headers.get('content-type') || '';
                const isJson = contentType.includes('application/json');

                if (!response.ok) {
                    const errorData = isJson ? await response.json() : await response.text();
                    const detail = typeof errorData === 'string'
                        ? errorData
                        : (errorData.error || JSON.stringify(errorData));

                    // Some backends do not expose /ai/stream; automatically fall back to /ai/generate on 404.
                    if (response.status === 404 && !useGeneratePath) {
                        useGeneratePath = true;
                        clearTimeout(timer);
                        continue;
                    }

                    throw new Error(`Failed to generate content (HTTP ${response.status}): ${detail}`);
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
