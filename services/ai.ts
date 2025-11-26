
import { Type } from "@google/genai";

// Define the response type
export interface AIResponse {
    text: string;
    usageMetadata?: any;
    candidates?: any[];
}

export const generateContent = async (
    model: string,
    contents: any,
    config?: any
): Promise<AIResponse> => {
    try {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                contents,
                config
            })
        });

        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        if (!response.ok) {
            if (isJson) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to generate content');
            } else {
                const text = await response.text();
                throw new Error(text || 'Failed to generate content (non-JSON response)');
            }
        }

        const data = isJson ? await response.json() : { text: await response.text() };
        return data;

    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};
