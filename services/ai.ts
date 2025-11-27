
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
        // Format contents if it's a plain string (common case)
        let formattedContents = contents;
        if (typeof contents === 'string') {
            formattedContents = [
                {
                    role: 'user',
                    parts: [{ text: contents }]
                }
            ];
        }

        return await genAIClient.request({ model, contents: formattedContents, config });
    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};
