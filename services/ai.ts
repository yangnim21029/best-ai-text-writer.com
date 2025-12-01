
// Define the response type
export interface AIResponse {
    text: string;
    object?: any;
    usageMetadata?: any;
    candidates?: any[];
}

import { genAIClient } from './genAIClient';

export const generateContent = async (
    model: string,
    contents: any,
    config?: any
): Promise<AIResponse> => {
    console.log('[generateContent] Calling API with model:', model, 'config:', !!config);
    try {
        const normalizedContents = typeof contents === 'undefined' ? '' : contents;
        const result = await genAIClient.request({ model, contents: normalizedContents, config });
        console.log('[generateContent] API success');
        return result;
    } catch (error) {
        console.error("[generateContent] API ERROR:", error);
        throw error;
    }
};
