import { ServiceResponse, KeywordActionPlan, KeywordData, TargetAudience } from '../types';
import { calculateCost, extractRawSnippets, getLanguageInstruction } from './promptService';
import { promptRegistry } from './promptRegistry';
import { runLlm } from './llmOrchestrator';
import { Type } from '@google/genai';

// Analyze Context & Generate Action Plan for keywords
export const extractKeywordActionPlans = async (
    referenceContent: string,
    keywords: KeywordData[],
    targetAudience: TargetAudience
): Promise<ServiceResponse<KeywordActionPlan[]>> => {
    const startTs = Date.now();

    const topTokens = keywords.slice(15);
    const analysisPayload = topTokens.map(k => ({
        word: k.token,
        snippets: extractRawSnippets(referenceContent, k.token)
    })).filter(item => item.snippets.length > 0);

    if (analysisPayload.length === 0) {
        return { data: [], usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: Date.now() - startTs };
    }

    const languageInstruction = getLanguageInstruction(targetAudience);
    const prompt = promptRegistry.build('keywordActionPlan', {
        languageInstruction,
        analysisPayloadString: JSON.stringify(analysisPayload.slice(0, 20), null, 2),
    });

    try {
        const response = await runLlm({
            prompt,
            model: 'FLASH',
            responseMimeType: 'application/json',
            config: {
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        plans: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    word: { type: Type.STRING },
                                    plan: { type: Type.ARRAY, items: { type: Type.STRING } }
                                }
                            }
                        }
                    }
                }
            }
        });

        const result = JSON.parse(response.text || "{}");
        const plans: any[] = result.plans || [];

        const uniquePlans = new Map();
        plans.forEach((p: any) => {
            if (p && p.word && !uniquePlans.has(p.word)) {
                uniquePlans.set(p.word, p);
            }
        });

        const finalPlans = Array.from(uniquePlans.values()).map((p: any) => {
            const original = analysisPayload.find(ap => ap.word === p.word);
            return {
                word: p.word,
                plan: p.plan || [],
                snippets: original ? original.snippets : []
            };
        });

        return {
            data: finalPlans,
            usage: response.usage,
            cost: response.cost,
            duration: response.duration
        };

    } catch (e) {
        console.error("Action Plan extraction failed", e);
        return { data: [], usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: Date.now() - startTs };
    }
};
