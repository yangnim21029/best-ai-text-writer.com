import { AI_DEFAULTS, MODEL } from '../config/constants';
import { calculateCost } from './promptService';
import { TokenUsage, CostBreakdown } from '../types';

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

// --- Types ---

export type LlmModelKey = keyof typeof MODEL;

export interface AIResponse {
    text: string;
    object?: any;
    usageMetadata?: any;
    candidates?: any[];
}

export interface AIRequestConfig {
    responseMimeType?: string;
    responseSchema?: any;
    temperature?: number;
    topK?: number;
    topP?: number;
}

// --- Configuration ---

const DEFAULT_TIMEOUT = AI_DEFAULTS.TIMEOUT_MS;
const DEFAULT_RETRY_ATTEMPTS = AI_DEFAULTS.RETRY_ATTEMPTS;
const DEFAULT_RETRY_DELAY = AI_DEFAULTS.RETRY_DELAY_MS;

const env =
    (typeof import.meta !== 'undefined' && (import.meta as any).env)
        ? (import.meta as any).env
        : (process.env as any);

const AI_BASE_URL = (env.VITE_AI_BASE_URL || env.AI_BASE_URL || '').replace(/\/$/, '');
const AI_PATH = (env.VITE_AI_PATH || env.AI_PATH || '/ai').replace(/\/$/, '');

const buildAiUrl = (path: string) => {
    const prefix = AI_PATH
        ? (AI_PATH.startsWith('/') ? AI_PATH : `/${AI_PATH}`)
        : '';
    return `${AI_BASE_URL}${prefix}${path}`;
};

// --- AI Client Class ---

class AIClient {
    async request(
        model: string,
        contents: any,
        config?: AIRequestConfig,
        timeoutMs: number = DEFAULT_TIMEOUT
    ): Promise<AIResponse> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const payload: any = { model };

        if (typeof contents === 'string') {
            payload.prompt = contents;
        } else {
            payload.contents = contents;
        }

        if (config) {
            if (config.responseSchema) {
                // Send both keys for backend compatibility
                payload.schema = config.responseSchema;
                payload.responseSchema = config.responseSchema;
            }
            if (config.responseMimeType) payload.responseMimeType = config.responseMimeType;
            // Add other config params as needed
        }

        try {
            // Try /generate directly; streaming is handled elsewhere
            const response = await fetch(buildAiUrl('/generate'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`AI Request Failed: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            if (result?.success === false) {
                const detail = result.message || result.error || JSON.stringify(result);
                throw new Error(`AI Request Failed: ${detail}`);
            }

            const data = result?.data || {};
            const candidates = data.candidates;
            const object = data.object;
            const usageMetadata = data.usage || data.usageMetadata;
            const text = data.text || extractTextFromCandidates(candidates) || '';

            return { text, object, usageMetadata, candidates };

        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`AI Request Timed Out after ${timeoutMs}ms`);
            }
            throw error;
        }
    }

    async runText(
        prompt: string,
        modelKey: LlmModelKey = 'FLASH',
        config?: AIRequestConfig
    ): Promise<{ text: string; usage: TokenUsage; cost: CostBreakdown; duration: number }> {
        const start = Date.now();
        const model = MODEL[modelKey];

        try {
            const response = await this.request(model, prompt, config);
            const { usage, cost } = calculateCost(response.usageMetadata, modelKey as any);

            return {
                text: response.text,
                usage,
                cost,
                duration: Date.now() - start
            };
        } catch (error) {
            console.error(`[AIClient] runText failed for ${modelKey}`, error);
            throw error;
        }
    }

    async runJson<T>(
        prompt: string,
        modelKey: LlmModelKey = 'FLASH',
        schema?: any
    ): Promise<{ data: T; usage: TokenUsage; cost: CostBreakdown; duration: number }> {
        const start = Date.now();
        const model = MODEL[modelKey];
        const config: AIRequestConfig = {
            responseMimeType: 'application/json',
            responseSchema: schema
        };

        try {
            const response = await this.request(model, prompt, config);
            const { usage, cost } = calculateCost(response.usageMetadata, modelKey as any);

            let data: T;
            if (response.object) {
                data = response.object as T;
            } else {
                try {
                    // Clean markdown code blocks if present
                    const cleanText = response.text.replace(/```(?:json)?\n?|\n?```/gi, '').trim();
                    data = JSON.parse(cleanText) as T;
                } catch (e) {
                    throw new Error(`Failed to parse JSON response: ${response.text.substring(0, 100)}...`);
                }
            }

            return {
                data,
                usage,
                cost,
                duration: Date.now() - start
            };
        } catch (error) {
            console.error(`[AIClient] runJson failed for ${modelKey}`, error);
            throw error;
        }
    }
}

export const aiClient = new AIClient();

// --- Shared Utils ---

export const parseSchemaResponse = <T>(
    response: { data: T; usage: TokenUsage; cost: CostBreakdown; duration: number },
    fallback?: T
): { data: T; usage: TokenUsage; cost: CostBreakdown; duration: number } => {
    if (!response.data && fallback) {
        return { ...response, data: fallback };
    }
    return response;
};

export const trackCost = (
    metricsStore: { addCost: (cost: number, tokens: number) => void },
    ...responses: { cost: CostBreakdown; usage: TokenUsage }[]
) => {
    let totalCost = 0;
    let totalTokens = 0;

    responses.forEach(r => {
        if (r && r.cost && r.usage) {
            totalCost += r.cost.totalCost || 0;
            totalTokens += r.usage.totalTokenCount || 0;
        }
    });

    if (!isNaN(totalCost) && !isNaN(totalTokens)) {
        metricsStore.addCost(totalCost, totalTokens);
    }

    return { totalCost, totalTokens };
};
