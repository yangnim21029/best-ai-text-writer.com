import { HeadingOption, HeadingResult, TargetAudience, ServiceResponse, TokenUsage, CostBreakdown } from '../types';
import { aiClient } from './aiClient';
import { embedTexts, cosineSimilarity } from './embeddingService';
import { getLanguageInstruction, toTokenUsage } from './promptService';
import { promptRegistry } from './promptRegistry';
import { Type } from './schemaTypes';
import { logger } from '../utils/logger';

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
                const h3AfterRaw = typeof h.h3_after === 'string' ? h.h3_after : (h.after || h3Before);
                const h3After = cleanHeading(h3AfterRaw) || h3Before;
                const h3Reason = typeof h.h3_reason === 'string' ? h.h3_reason : (typeof h.reason === 'string' ? h.reason : '');
                return { h3_before: h3Before, h3_after: h3After, ...(h3Reason ? { h3_reason: h3Reason } : {}) };
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

const pickBestOption = async (
    before: string,
    options: HeadingOption[],
    fallback: string
): Promise<{ text: string; optionsWithScores: HeadingOption[]; needsManual: boolean }> => {
    const beforeClean = cleanHeading(before);
    const fallbackClean = cleanHeading(fallback) || beforeClean;
    if (!options.length) {
        return { text: fallbackClean, optionsWithScores: [], needsManual: true };
    }

    try {
        const texts = [beforeClean, ...options.map(o => o.text)];
        const embeddings = await embedTexts(texts);
        const base = embeddings[0];
        const scored = options.map((opt, idx) => {
            const vec = embeddings[idx + 1];
            const score = (base && vec) ? cosineSimilarity(base, vec) : undefined;
            return { ...opt, score };
        });

        const valid = scored.filter(opt =>
            opt.text &&
            opt.text.toLowerCase() !== beforeClean.toLowerCase()
        );

        const best = valid.reduce<HeadingOption | null>((acc, cur) => {
            const currentScore = cur.score ?? -1;
            const accScore = acc?.score ?? -1;
            return currentScore > accScore ? cur : acc;
        }, null);

        if (!best) {
            return { text: fallbackClean, optionsWithScores: scored, needsManual: true };
        }

        const needsManual = (best.score ?? 0) > 0.995 || best.text.toLowerCase() === beforeClean.toLowerCase();
        return { text: best.text || fallbackClean, optionsWithScores: scored, needsManual };
    } catch (err) {
        logger.warn('refining_headings', 'Embedding selection failed, using first option', err);
        const first = options[0];
        return { text: first?.text || fallbackClean, optionsWithScores: options, needsManual: true };
    }
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
    logger.log('refining_headings', `Refining ${headings.length} headings...`);
    const started = Date.now();

    const languageInstruction = getLanguageInstruction(targetAudience);
    const prompt = promptRegistry.refineHeadings(articleTitle, headings, languageInstruction);

    const response = await aiClient.runJson<{ headings: any[] }>(prompt, 'FLASH', {
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
                                required: ['text']
                            }
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
                                required: ['h3_after']
                            }
                        }
                    },
                    required: ['h2_before', 'h2_after', 'h2_options', 'h3']
                }
            }
        },
        required: ['headings']
    });

    const list = Array.isArray(response.data?.headings) ? response.data.headings : [];
    const results: HeadingResult[] = [];

    for (let idx = 0; idx < headings.length; idx++) {
        const beforeRaw = headings[idx] || '';
        const before = cleanHeading(beforeRaw);
        const match = list.find((h: any) =>
            cleanHeading(h?.h2_before) === before ||
            cleanHeading(h?.before) === before
        ) || list[idx] || {};

        const h2Before = cleanHeading(match?.h2_before || match?.before || beforeRaw) || before;
        const options = normalizeOptions(match?.h2_options);
        const rawAfter = typeof match?.h2_after === 'string'
            ? match.h2_after
            : (typeof match?.after === 'string' ? match.after : beforeRaw);

        const { text: picked, optionsWithScores, needsManual } = await pickBestOption(
            h2Before,
            options,
            rawAfter || beforeRaw
        );

        const h3 = normalizeH3(Array.isArray(match?.h3) ? match.h3 : []);
        const h2Reason = typeof match?.h2_reason === 'string'
            ? match.h2_reason
            : (typeof match?.reason === 'string' ? match.reason : '');

        results.push({
            before,
            after: picked || h2Before,
            h2_before: h2Before,
            h2_after: picked,
            ...(h2Reason ? { h2_reason: h2Reason } : {}),
            ...(optionsWithScores.length ? { h2_options: optionsWithScores } : {}),
            ...(h3 ? { h3 } : {}),
            ...(needsManual ? { needs_manual: true } : {})
        });
    }

    return {
        data: results,
        usage: toTokenUsage(response.usage),
        cost: toCost(response.cost),
        duration: Date.now() - started
    };
};
