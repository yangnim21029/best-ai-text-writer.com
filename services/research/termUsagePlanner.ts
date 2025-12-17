import { ServiceResponse, FrequentWordsPlacementAnalysis, KeywordData, TargetAudience } from '../../types';
import { SEMANTIC_KEYWORD_LIMIT } from '../../config/constants';
import { extractRawSnippets, getLanguageInstruction, toTokenUsage } from '../engine/promptService';
import { promptTemplates } from '../engine/promptTemplates';
import { aiService } from '../engine/aiService';
import { Type } from '../engine/schemaTypes';

// Helper to chunk array
const chunkArray = <T>(array: T[], size: number): T[][] => {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
};

// Analyze Context & Generate Action Plan for keywords
export const extractSemanticKeywordsAnalysis = async (
    referenceContent: string,
    keywords: KeywordData[],
    targetAudience: TargetAudience
): Promise<ServiceResponse<FrequentWordsPlacementAnalysis[]>> => {
    const startTs = Date.now();

    // Take top keywords to avoid token limits (magic number tuned for speed/cost)
    const topKeywords = keywords.slice(0, SEMANTIC_KEYWORD_LIMIT);

    const truncateSnippet = (text: string, maxLen: number = 160) =>
        text.length > maxLen ? `${text.slice(0, maxLen - 3)}...` : text;

    // Prepare snippets for ALL keywords first
    const allAnalysisPayloads = topKeywords.map(k => ({
        word: k.token,
        snippets: extractRawSnippets(referenceContent, k.token, 80)
            .slice(0, 2)
            .map(snippet => truncateSnippet(snippet))
    }));

    const languageInstruction = getLanguageInstruction(targetAudience);

    // BATCHING STRATEGY:
    // User requested "chuck" / async parallel processing.
    // Execute multiple batches in parallel to reduce total latency.
    const BATCH_SIZE = 5;
    const batches = chunkArray(allAnalysisPayloads, BATCH_SIZE);

    console.log(`[SemanticKeywords] Processing ${allAnalysisPayloads.length} words in ${batches.length} batches (Parallel)...`);

    const batchPromises = batches.map(async (batchPayload, batchIdx) => {
        // Stringify the analysis payload for this batch
        const analysisPayloadString = JSON.stringify(batchPayload, null, 2);

        // Use the registry to build the prompt with snippet context
        const prompt = promptTemplates.frequentWordsPlacementAnalysis({
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
                        plan: { type: Type.ARRAY, items: { type: Type.STRING } },
                        exampleSentence: { type: Type.STRING } // NEW Field request
                    }
                }
            });

            return {
                data: response.data || [],
                usage: response.usage,
                cost: response.cost,
                duration: response.duration
            };
        } catch (e) {
            console.warn(`[SemanticKeywords] Batch ${batchIdx + 1} failed`, e);
            return {
                data: [],
                usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
                cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
                duration: 0
            };
        }
    });

    // Execute all batches in parallel
    const results = await Promise.all(batchPromises);

    // Merge results
    let mergedPlans: any[] = [];
    let totalUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    let totalCost = { inputCost: 0, outputCost: 0, totalCost: 0 };

    results.forEach(res => {
        if (res.data) mergedPlans = mergedPlans.concat(res.data);
        if (res.usage) {
            totalUsage.inputTokens += res.usage.inputTokens || 0;
            totalUsage.outputTokens += res.usage.outputTokens || 0;
            totalUsage.totalTokens += res.usage.totalTokens || 0;
        }
        if (res.cost) {
            totalCost.inputCost += res.cost.inputCost || 0;
            totalCost.outputCost += res.cost.outputCost || 0;
            totalCost.totalCost += res.cost.totalCost || 0;
        }
    });

    // Map back to include snippets (using the original payloads)
    const finalPlans: FrequentWordsPlacementAnalysis[] = mergedPlans.map((p: any) => {
        const original = allAnalysisPayloads.find(ap => ap.word === p.word);
        return {
            word: p.word,
            plan: p.plan || [],
            snippets: original ? original.snippets : [],
            exampleSentence: p.exampleSentence || ''
        };
    });

    return {
        data: finalPlans,
        usage: toTokenUsage(totalUsage),
        cost: totalCost,
        duration: Date.now() - startTs
    };
};
