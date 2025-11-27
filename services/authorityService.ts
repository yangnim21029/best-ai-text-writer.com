import { ServiceResponse, AuthorityAnalysis, TargetAudience } from '../types';
import { calculateCost, getLanguageInstruction } from './promptService';
import { Type } from './schemaTypes';
import { runLlm } from './llmOrchestrator';
import { MODEL } from '../config/constants';

// Analyze Authority Terms with Website Context
export const analyzeAuthorityTerms = async (
    authorityInput: string,
    topic: string,
    websiteType: string,
    targetAudience: TargetAudience
): Promise<ServiceResponse<AuthorityAnalysis | null>> => {
    const startTs = Date.now();
    if (!authorityInput || !authorityInput.trim()) {
        return { data: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: 0 };
    }

    const languageInstruction = getLanguageInstruction(targetAudience);

    const prompt = `
    I have a list of "Authority Attribute Terms" (Brand specs, ingredients, certifications, etc.), a target Article Topic, and a description of the Website Type.
    
    ${languageInstruction}

    WEBSITE / BRAND CONTEXT:
    "${websiteType}"
    
    ARTICLE TOPIC:
    "${topic}"

    TASK:
    - For each term, indicate IF it should be used, HOW to use it, and any RISK of misuse.
    - Provide injection guidelines.

    OUTPUT JSON:
    {
        "relevantTerms": ["term1", "term2"],
        "guidelines": [
            { "term": "Term", "usage": "When/how to use", "risk": "What to avoid" }
        ]
    }
    `;

    try {
        const response = await runLlm({
            prompt,
            model: 'FLASH',
            responseMimeType: 'application/json',
            config: {
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        relevantTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
                        guidelines: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    term: { type: Type.STRING },
                                    usage: { type: Type.STRING },
                                    risk: { type: Type.STRING },
                                }
                            }
                        }
                    }
                }
            }
        });

        const data = JSON.parse(response.text || "{}");
        const metrics = calculateCost(response.usage, 'FLASH');

        return {
            data: {
                relevantTerms: data.relevantTerms || [],
                guidelines: data.guidelines || []
            },
            ...metrics,
            duration: response.duration
        };
    } catch (e) {
        console.error("Authority analysis failed", e);
        return { data: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: Date.now() - startTs };
    }
};
