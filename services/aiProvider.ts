import { runLlm, runJsonLlm } from './llmOrchestrator';
import { LlmModelKey } from './llmOrchestrator';

export interface AiProvider {
    runText: (prompt: string, model: LlmModelKey, config?: Record<string, unknown>) => Promise<{ text: string; usage: any; cost: any; duration: number }>;
    runJson: <T>(prompt: string, model: LlmModelKey) => Promise<{ data: T; usage: any; cost: any; duration: number }>;
}

let currentProvider: AiProvider = {
    runText: (prompt, model, config) => runLlm({
        prompt,
        model,
        ...(config?.responseMimeType ? { responseMimeType: config.responseMimeType as string } : {}),
        ...(config ? { config } : {})
    }),
    runJson: <T>(prompt: string, model: LlmModelKey) => runJsonLlm<T>({ prompt, model }),
};

export const setAiProvider = (provider: AiProvider) => {
    currentProvider = provider;
};

export const getAiProvider = () => currentProvider;
