import { ServiceResponse, KeywordActionPlan, KeywordData, TargetAudience } from '../../types';
import { SEMANTIC_KEYWORD_LIMIT } from '../../config/constants';
import { extractRawSnippets, getLanguageInstruction, toTokenUsage } from '../engine/promptService';
import { promptTemplates } from '../engine/promptTemplates';
import { aiService } from '../engine/aiService';
import { Type } from '../engine/schemaTypes';

// Analyze Context & Generate Action Plan for keywords
export const extractKeywordActionPlans = async (
    referenceContent: string,
    keywords: KeywordData[],
    targetAudience: TargetAudience
): Promise<ServiceResponse<KeywordActionPlan[]>> => {
    const startTs = Date.now();

    // Take top keywords to avoid token limits (magic number tuned for speed/cost)
    const topTokens = keywords.slice(0, SEMANTIC_KEYWORD_LIMIT);

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
    const prompt = promptTemplates.keywordActionPlan({
        analysisPayloadString,
        languageInstruction
    });

    try {
        const response = await aiService.runJson<any[]>(prompt, 'FLASH', {
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
