import { generateContent } from './ai';
import { MODEL } from '../config/constants';
import { calculateCost } from './promptService';

export type LlmModelKey = keyof typeof MODEL;

interface RunLlmParams {
    prompt: string;
    model: LlmModelKey;
    responseMimeType?: string;
    config?: Record<string, unknown>;
}

export const runLlm = async ({ prompt, model, responseMimeType, config }: RunLlmParams) => {
    const start = Date.now();
    const response = await generateContent(
        MODEL[model],
        prompt,
        responseMimeType || config ? { responseMimeType, ...config } : undefined
    );
    const metrics = calculateCost(response.usageMetadata, model);
    return { text: response.text || '', object: response.object, ...metrics, duration: Date.now() - start };
};

export const runJsonLlm = async <T>({ prompt, model }: RunLlmParams): Promise<{ data: T; usage: any; cost: any; duration: number }> => {
    const res = await runLlm({ prompt, model });
    try {
        // If backend returned a schema-based response, it's already parsed
        if (res.object !== undefined) {
            return { data: res.object as T, usage: res.usage, cost: res.cost, duration: res.duration };
        }
        // Fallback to manual parsing for non-schema responses
        const data = JSON.parse(res.text) as T;
        return { data, usage: res.usage, cost: res.cost, duration: res.duration };
    } catch (err) {
        throw new Error(`Failed to parse LLM JSON response: ${(err as Error).message}`);
    }
};
