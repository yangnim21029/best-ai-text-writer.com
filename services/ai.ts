
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

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate content');
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("AI Service Error:", error);
        throw error;
    }
};
