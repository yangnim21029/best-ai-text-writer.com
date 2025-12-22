import {
  ServiceResponse,
  FrequentWordsPlacementAnalysis,
  KeywordData,
  TargetAudience,
} from '../../types';
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

import pLimit from 'p-limit'; // v6+ is pure ESM

// ... imports

// Analyze Context & Generate Action Plan for keywords
export const extractSemanticKeywordsAnalysis = async (
  referenceContent: string,
  keywords: KeywordData[],
  targetAudience: TargetAudience
): Promise<ServiceResponse<FrequentWordsPlacementAnalysis[]>> => {
  const startTs = Date.now();

  // 1. Deduplicate keywords (Case-insensitive) to prevent processing duplicates
  const uniqueKeywordsMap = new Map<string, KeywordData>();
  keywords.forEach((k) => {
    const lower = (k.token || '').toLowerCase().trim();
    if (lower && !uniqueKeywordsMap.has(lower)) {
      uniqueKeywordsMap.set(lower, k);
    }
  });
  const uniqueKeywords = Array.from(uniqueKeywordsMap.values());

  // Take top keywords to avoid token limits (magic number tuned for speed/cost)
  const topKeywords = uniqueKeywords.slice(0, SEMANTIC_KEYWORD_LIMIT);

  const truncateSnippet = (text: string, maxLen: number = 160) =>
    text.length > maxLen ? `${text.slice(0, maxLen - 3)}...` : text;

  // Prepare snippets for ALL keywords first
  const allAnalysisPayloads = topKeywords.map((k) => ({
    word: k.token,
    snippets: extractRawSnippets(referenceContent, k.token, 80)
      .slice(0, 2)
      .map((snippet) => truncateSnippet(snippet)),
  }));

  const languageInstruction = getLanguageInstruction(targetAudience);

  // BATCHING STRATEGY:
  // Execute multiple batches in parallel but with a CONCURRENCY LIMIT
  // to prevent 429 errors or network timeouts.
  const BATCH_SIZE = 10;
  const CONCURRENCY_LIMIT = 2; // Slightly reduced for more stable proxy handling
  const limit = pLimit(CONCURRENCY_LIMIT);

  const batches = chunkArray(allAnalysisPayloads, BATCH_SIZE);

  console.log(
    `[SemanticKeywords] Processing ${allAnalysisPayloads.length} words in ${batches.length} batches (Concurrency: ${CONCURRENCY_LIMIT})...`
  );

  const batchPromises = batches.map((batchPayload, batchIdx) =>
    limit(async () => {
      // Breath delay: Space out batch starts by 1.2s to prevent spike failures
      const delayMs = batchIdx * 1200;
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }

      // Stringify the analysis payload for this batch
      const analysisPayloadString = JSON.stringify(batchPayload, null, 2);

      // Use the registry to build the prompt with snippet context
      const planPrompt = promptTemplates.frequentWordsPlacementAnalysis({
        analysisPayloadString,
        languageInstruction,
      });

      try {
        console.log(`[SemanticKeywords] Starting batch ${batchIdx + 1}/${batches.length}...`);
        const planRes = await aiService.runJson<any[]>(planPrompt, 'FLASH', {
          schema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                plan: { type: Type.ARRAY, items: { type: Type.STRING } },
                exampleSentence: { type: Type.STRING },
                isSentenceStart: { type: Type.BOOLEAN },
                isSentenceEnd: { type: Type.BOOLEAN },
                isPrefix: { type: Type.BOOLEAN },
                isSuffix: { type: Type.BOOLEAN },
              },
              required: ['word', 'plan', 'exampleSentence'],
            },
          },
        });

        console.log(`[SemanticKeywords] Batch ${batchIdx + 1} Result:`, {
          requested: batchPayload.length,
          received: planRes.data?.length || 0,
          duration: planRes.duration,
        });

        if (!planRes.data || planRes.data.length === 0) {
          console.warn(
            `[SemanticKeywords] Batch ${batchIdx + 1} returned NO data. Batch payload:`,
            batchPayload.map((p) => p.word)
          );
          return {
            data: [],
            usage: planRes.usage,
            cost: planRes.cost,
            duration: planRes.duration,
          };
        }

        return {
          data: planRes.data.map((p) => ({
            ...p,
            plan: Array.isArray(p.plan) ? p.plan : [p.plan].filter(Boolean),
          })),
          usage: planRes.usage,
          cost: planRes.cost,
          duration: planRes.duration,
        };
      } catch (e) {
        console.warn(`[SemanticKeywords] Batch ${batchIdx + 1} failed`, e);
        return {
          data: [],
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
          duration: 0,
        };
      }
    })
  );

  // Execute all batches with the limit
  const results = await Promise.all(batchPromises);

  // Merge results
  let mergedPlans: any[] = [];
  let totalUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  let totalCost = { inputCost: 0, outputCost: 0, totalCost: 0 };

  results.forEach((res) => {
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
  // Also final safety dedupe on the results
  const seenWords = new Set<string>();

  const finalPlans: FrequentWordsPlacementAnalysis[] = mergedPlans.reduce(
    (acc: FrequentWordsPlacementAnalysis[], p: any) => {
      const lower = (p.word || '').toLowerCase().trim();
      if (!lower || seenWords.has(lower)) return acc;

      seenWords.add(lower);

      const original =
        allAnalysisPayloads.find((ap) => ap.word === p.word) ||
        allAnalysisPayloads.find((ap) => (ap.word || '').toLowerCase() === lower);

      acc.push({
        word: p.word,
        plan: p.plan || [],
        snippets: original ? original.snippets : [],
        exampleSentence: p.exampleSentence || '',
        isSentenceStart: !!p.isSentenceStart,
        isSentenceEnd: !!p.isSentenceEnd,
        isPrefix: !!p.isPrefix,
        isSuffix: !!p.isSuffix,
      });
      return acc;
    },
    []
  );

  return {
    data: finalPlans,
    usage: toTokenUsage(totalUsage),
    cost: totalCost,
    duration: Date.now() - startTs,
  };
};
