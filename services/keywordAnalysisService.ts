import { ServiceResponse, KeywordActionPlan, KeywordData, TargetAudience } from '../types';
import { extractRawSnippets, getLanguageInstruction, toTokenUsage } from './promptService';
import { promptRegistry } from './promptRegistry';
import { aiClient } from './aiClient';
import { Type } from './schemaTypes';

// Analyze Context & Generate Action Plan for keywords
export const extractKeywordActionPlans = async (
    referenceContent: string,
    keywords: KeywordData[],
    targetAudience: TargetAudience
): Promise<ServiceResponse<KeywordActionPlan[]>> => {
    const startTs = Date.now();

    // Take top keywords to avoid token limits
    const topTokens = keywords.slice(0, 12);

    const truncateSnippet = (text: string, maxLen: number = 160) =>
        text.length > maxLen ? `${text.slice(0, maxLen - 3)}...` : text;

    // Prepare snippets for the prompt context
    const analysisPayload = topTokens.map(k => ({
        word: k.token,
        snippets: extractRawSnippets(referenceContent, k.token, 80)
            .slice(0, 2)
            .map(snippet => truncateSnippet(snippet))
    }));

    const languageInstruction = getLanguageInstruction(targetAudience);

    // Stringify the analysis payload for the prompt template
    let analysisPayloadString = JSON.stringify(analysisPayload, null, 2);
    const MAX_ANALYSIS_PAYLOAD = 8000;
    if (analysisPayloadString.length > MAX_ANALYSIS_PAYLOAD) {
        analysisPayloadString = analysisPayloadString.slice(0, MAX_ANALYSIS_PAYLOAD) + '\n...(truncated for length)...';
    }

    // Use the registry to build the prompt with snippet context
    const prompt = promptRegistry.build('keywordActionPlan', {
        analysisPayloadString,
        targetAudience,
        languageInstruction
    });

    try {
        const response = await aiClient.runJson<any[]>(prompt, 'FLASH', {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    word: { type: Type.STRING },
                    plan: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        });

        const plans = response.data || [];

        // Map back to include snippets
        const finalPlans: KeywordActionPlan[] = plans.map((p: any) => {
            const original = analysisPayload.find(ap => ap.word === p.word);
            return {
                word: p.word,
                plan: p.plan || [],
                snippets: original ? original.snippets : []
            };
        });

        return {
            data: finalPlans,
            usage: toTokenUsage(response.usage),
            cost: response.cost,
            duration: response.duration
        };

    } catch (e) {
        console.error("Action Plan extraction failed", e);
        const usage = toTokenUsage((e as any)?.usage);
        return {
            data: [],
            usage,
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: Date.now() - startTs
        };
    }
};
