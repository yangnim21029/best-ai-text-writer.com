import { AIResponse } from './ai';

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

import { AI_DEFAULTS } from '../config/constants';

const DEFAULT_RETRY: Required<RetryOptions> = {
    attempts: AI_DEFAULTS.RETRY_ATTEMPTS,
    delayMs: AI_DEFAULTS.RETRY_DELAY_MS,
};

const DEFAULT_TIMEOUT = AI_DEFAULTS.TIMEOUT_MS;

export class GenAIClient {
    async request(
        { model, contents, config, timeoutMs, signal }: GenAIRequest,
        retryOpts: RetryOptions = {}
    ): Promise<AIResponse> {
        const { attempts, delayMs } = { ...DEFAULT_RETRY, ...retryOpts };
        const controller = new AbortController();
        const combinedSignal = signal
            ? new AbortSignalAny([signal, controller.signal])
            : controller.signal;

        let lastError: unknown = null;
        for (let attempt = 0; attempt < attempts; attempt++) {
            const timer = setTimeout(() => controller.abort('GenAI request timed out'), timeoutMs || DEFAULT_TIMEOUT);
            try {
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model, contents, config }),
                    signal: combinedSignal,
                });

                const contentType = response.headers.get('content-type') || '';
                const isJson = contentType.includes('application/json');

                if (!response.ok) {
                    const errorData = isJson ? await response.json() : await response.text();
                    throw new Error(typeof errorData === 'string' ? errorData : errorData.error || `Failed to generate content (HTTP ${response.status})`);
                }

                const data = isJson ? await response.json() : { text: await response.text() };
                clearTimeout(timer);
                return data;
            } catch (err: any) {
                lastError = err;
                clearTimeout(timer);
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
