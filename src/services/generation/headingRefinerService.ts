import {
  HeadingOption,
  HeadingResult,
  TargetAudience,
  ServiceResponse,
  TokenUsage,
  CostBreakdown,
} from '../../types';
import { aiService } from '../engine/aiService';
import { embedTexts, cosineSimilarity } from '../engine/embeddingService';
import { getLanguageInstruction, toTokenUsage } from '../engine/promptService';
import { promptTemplates } from '../engine/promptTemplates';
import { Type } from '../engine/schemaTypes';
import { logger } from '../../utils/logger';

const cleanHeading = (s: string | undefined): string =>
  (s || '')
    .replace(/^#+\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/["“”]/g, '')
    .trim();

const fallbackHeading = (original: string): string => {
  const base = cleanHeading(original).replace(/[?？]+$/, '');
  if (!base) return '重點整理';
  if (base.length > 14) return `${base}重點`;
  return `${base}解析`;
};

const normalizeH3 = (list: any[]): HeadingResult['h3'] => {
  const normalized = Array.isArray(list)
    ? list
        .filter((h: any) => h && (h.h3_before || h.h3_after || h.before || h.after))
        .map((h: any) => {
          const h3Before = cleanHeading(h.h3_before || h.before || '');
          const h3AfterRaw = typeof h.h3_after === 'string' ? h.h3_after : h.after || h3Before;
          const h3After = cleanHeading(h3AfterRaw) || h3Before;
          const h3Reason =
            typeof h.h3_reason === 'string'
              ? h.h3_reason
              : typeof h.reason === 'string'
                ? h.reason
                : '';
          return {
            h3_before: h3Before,
            h3_after: h3After,
            ...(h3Reason ? { h3_reason: h3Reason } : {}),
          };
        })
    : [];
  return normalized.length ? normalized : undefined;
};

const normalizeOptions = (input: any): HeadingOption[] => {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const options: HeadingOption[] = [];

  input.forEach((raw: any) => {
    const text = cleanHeading(typeof raw === 'string' ? raw : raw?.text);
    if (!text) return;
    const key = text.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const reason = typeof raw?.reason === 'string' ? raw.reason.trim() : '';
    options.push({ text, ...(reason ? { reason } : {}) });
  });

  return options;
};

const calculateBestOption = (
  h2Before: string,
  options: HeadingOption[],
  fallback: string,
  baseEmbedding: number[] | undefined,
  optionEmbeddings: (number[] | undefined)[]
): { text: string; optionsWithScores: HeadingOption[]; needsManual: boolean } => {
  const beforeClean = cleanHeading(h2Before);
  const fallbackClean = cleanHeading(fallback) || beforeClean;

  if (!options.length) {
    return { text: fallbackClean, optionsWithScores: [], needsManual: true };
  }

  const scored = options.map((opt, idx) => {
    const vec = optionEmbeddings[idx];
    const score = baseEmbedding && vec ? cosineSimilarity(baseEmbedding, vec) : undefined;
    return { ...opt, score };
  });

  const valid = scored.filter(
    (opt) => opt.text && opt.text.toLowerCase() !== beforeClean.toLowerCase()
  );

  const best = valid.reduce<HeadingOption | null>((acc, cur) => {
    const currentScore = cur.score ?? -1;
    const accScore = acc?.score ?? -1;
    return currentScore > accScore ? cur : acc;
  }, null);

  if (!best) {
    return { text: fallbackClean, optionsWithScores: scored, needsManual: true };
  }

  const needsManual =
    (best.score ?? 0) > 0.995 || best.text.toLowerCase() === beforeClean.toLowerCase();
  return { text: best.text || fallbackClean, optionsWithScores: scored, needsManual };
};

const toCost = (cost: any): CostBreakdown => ({
  inputCost: cost?.inputCost || 0,
  outputCost: cost?.outputCost || 0,
  totalCost: cost?.totalCost || 0,
});

export const refineHeadings = async (
  articleTitle: string,
  headings: string[],
  targetAudience: TargetAudience
): Promise<ServiceResponse<HeadingResult[]>> => {
  const started = Date.now();
  const languageInstruction = getLanguageInstruction(targetAudience);
  const BATCH_SIZE = 12;

  const mergeUsage = (a: TokenUsage, b: TokenUsage): TokenUsage => ({
    inputTokens: (a.inputTokens || 0) + (b.inputTokens || 0),
    outputTokens: (a.outputTokens || 0) + (b.outputTokens || 0),
    totalTokens: (a.totalTokens || 0) + (b.totalTokens || 0),
  });

  const mergeCost = (a: CostBreakdown, b: CostBreakdown): CostBreakdown => ({
    inputCost: (a.inputCost || 0) + (b.inputCost || 0),
    outputCost: (a.outputCost || 0) + (b.outputCost || 0),
    totalCost: (a.totalCost || 0) + (b.totalCost || 0),
  });

  const refineBatch = async (batch: string[]): Promise<ServiceResponse<HeadingResult[]>> => {
    logger.log('refining_headings', `Refining ${batch.length} headings...`);
    const prompt = promptTemplates.batchRefineHeadings({
      articleTitle,
      headings: batch,
      languageInstruction,
    });

    const response = await aiService.runJson<{ headings: any[] }>(prompt, 'FLASH', {
      schema: {
        type: Type.OBJECT,
        properties: {
          headings: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                h2_before: { type: Type.STRING },
                h2_after: { type: Type.STRING },
                h2_reason: { type: Type.STRING },
                h2_options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      text: { type: Type.STRING },
                      reason: { type: Type.STRING },
                    },
                    required: ['text'],
                  },
                },
                h3: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      h3_before: { type: Type.STRING },
                      h3_after: { type: Type.STRING },
                      h3_reason: { type: Type.STRING },
                    },
                    required: ['h3_after'],
                  },
                },
              },
              required: ['h2_before', 'h2_after', 'h2_options', 'h3'],
            },
          },
        },
        required: ['headings'],
      },
      promptId: 'heading_refinement',
    });

    const list = Array.isArray(response.data?.headings) ? response.data.headings : [];

    // 1. Prepare for Batch Embedding
    const allTextsToEmbed: string[] = [];
    const preparedItems: any[] = [];

    for (let idx = 0; idx < batch.length; idx++) {
      const beforeRaw = batch[idx] || '';
      const before = cleanHeading(beforeRaw);
      const match =
        list.find(
          (h: any) => cleanHeading(h?.h2_before) === before || cleanHeading(h?.before) === before
        ) ||
        list[idx] ||
        {};

      const h2Before = cleanHeading(match?.h2_before || match?.before || beforeRaw) || before;
      const options = normalizeOptions(match?.h2_options);
      const rawAfter =
        typeof match?.h2_after === 'string'
          ? match.h2_after
          : typeof match?.after === 'string'
            ? match.after
            : beforeRaw;

      const h3 = normalizeH3(Array.isArray(match?.h3) ? match.h3 : []);
      const h2Reason =
        typeof match?.h2_reason === 'string'
          ? match.h2_reason
          : typeof match?.reason === 'string'
            ? match.reason
            : '';

      // Record indices for embedding
      const baseIndex = allTextsToEmbed.length;
      allTextsToEmbed.push(h2Before);

      const optionIndices = options.map((opt) => {
        const index = allTextsToEmbed.length;
        allTextsToEmbed.push(opt.text);
        return index;
      });

      preparedItems.push({
        before,
        h2Before,
        options,
        rawAfter,
        h3,
        h2Reason,
        baseIndex,
        optionIndices,
      });
    }

    // 2. Execute Batch Embedding
    let allEmbeddings: number[][] = [];
    if (allTextsToEmbed.length > 0) {
      try {
        logger.log('refining_headings', `Batch embedding ${allTextsToEmbed.length} texts...`);
        allEmbeddings = await embedTexts(allTextsToEmbed);
      } catch (err) {
        logger.warn('refining_headings', 'Batch embedding failed', err);
      }
    }

    // 3. Process Results with Embeddings
    const results: HeadingResult[] = preparedItems.map((item) => {
      const { before, h2Before, options, rawAfter, h3, h2Reason, baseIndex, optionIndices } = item;

      const baseEmbedding = allEmbeddings[baseIndex];
      const optionEmbeddings = optionIndices.map((idx: number) => allEmbeddings[idx]);

      const {
        text: picked,
        optionsWithScores,
        needsManual,
      } = calculateBestOption(
        h2Before,
        options,
        rawAfter || before,
        baseEmbedding,
        optionEmbeddings
      );

      return {
        before,
        after: picked || h2Before,
        h2_before: h2Before,
        h2_after: picked,
        ...(h2Reason ? { h2_reason: h2Reason } : {}),
        ...(optionsWithScores.length ? { h2_options: optionsWithScores } : {}),
        ...(h3 ? { h3 } : {}),
        ...(needsManual ? { needs_manual: true } : {}),
      };
    });

    return {
      data: results,
      usage: toTokenUsage(response.usage),
      cost: toCost(response.cost),
      duration: Date.now() - started,
    };
  };

  if (headings.length <= BATCH_SIZE) {
    const single = await refineBatch(headings);
    return { ...single, duration: Date.now() - started };
  }

  let aggregatedResults: HeadingResult[] = [];
  let totalUsage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  let totalCost: CostBreakdown = { inputCost: 0, outputCost: 0, totalCost: 0 };

  for (let i = 0; i < headings.length; i += BATCH_SIZE) {
    const slice = headings.slice(i, i + BATCH_SIZE);
    const batchRes = await refineBatch(slice);
    aggregatedResults = aggregatedResults.concat(batchRes.data || []);
    totalUsage = mergeUsage(totalUsage, batchRes.usage);
    totalCost = mergeCost(totalCost, batchRes.cost);
  }

  return {
    data: aggregatedResults,
    usage: totalUsage,
    cost: totalCost,
    duration: Date.now() - started,
  };
};
