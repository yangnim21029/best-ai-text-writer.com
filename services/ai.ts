
// Define the response type
export interface AIResponse {
    text: string;
    usageMetadata?: any;
    candidates?: any[];
}

import { genAIClient } from './genAIClient';

export const generateContent = async (
    model: string,
    contents: any,
    config?: any
): Promise<AIResponse> => {
    try {
        const normalizedContents = typeof contents === 'undefined' ? '' : contents;
        return await genAIClient.request({ model, contents: normalizedContents, config });
    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};
