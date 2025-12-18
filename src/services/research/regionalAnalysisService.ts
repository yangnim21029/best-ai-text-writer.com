import { aiService } from '../engine/aiService';
import { promptTemplates } from '../engine/promptTemplates';
import { ServiceResponse } from '../../types';
import { Type } from '../engine/schemaTypes';

export const analyzeRegionalTerms = async (
    content: string,
    targetAudience: string
): Promise<ServiceResponse<{ original: string; replacement: string; reason: string }[]>> => {

    // Safety check: if content is too short, skip
    if (!content || content.length < 50) {
        return {
            data: [],
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: 0
        };
    }

    const startTs = Date.now();
    const prompt = promptTemplates.regionalBrandAnalysis({ content, targetAudience });

    // Use Gemini with Grounding enabled (if configured in aiService via 'FLASH' or specific model)
    // The prompt explicitly asks for "Use Google Search (Grounding)" which requires the model to have tools support 
    // or just relying on its internal knowledge if tools aren't active. 
    // Assuming 'FLASH' mapped to a model that supports this or the prompt is enough.

    const response = await aiService.runJson<{ original: string; replacement: string; reason: string }[]>(
        prompt,
        'FLASH',
        {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    original: { type: Type.STRING },
                    replacement: { type: Type.STRING },
                    reason: { type: Type.STRING }
                },
                required: ["original", "replacement", "reason"]
            }
        }
    );

    return {
        data: response.data || [],
        usage: response.usage,
        cost: response.cost,
        duration: Date.now() - startTs
    };
};
