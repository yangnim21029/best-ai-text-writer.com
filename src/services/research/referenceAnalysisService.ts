import 'server-only';
import { z } from 'zod';
import { ServiceResponse, ReferenceAnalysis, TargetAudience } from '../../types';
import { aiService } from '../adapters/aiService';
import { promptTemplates } from '../adapters/promptTemplates';
import { getLanguageInstruction, toTokenUsage } from '../adapters/promptService';

export const extractWebsiteTypeAndTerm = async (content: string) => {
  // Lightweight helper for URL scraping flow to infer websiteType & authorityTerms.
  const prompt = promptTemplates.websiteTypeExtraction({ content });

  // Using runJson for structured output with Zod schema
  return await aiService.runJson<{ websiteType: string; authorityTerms: string }>(
    prompt,
    'FLASH',
    {
      schema: z.object({
        websiteType: z.string(),
        authorityTerms: z.string(),
      }),
      promptId: 'website_type_extraction',
    }
  );
};

export const analyzeReferenceStructure = async (
  referenceContent: string,
  targetAudience: TargetAudience
): Promise<ServiceResponse<ReferenceAnalysis>> => {
  const startTs = Date.now();
  const languageInstruction = getLanguageInstruction(targetAudience);

  // Prepare Prompts
  const voicePrompt = promptTemplates.voiceStrategy({
    content: referenceContent,
    targetAudience,
    languageInstruction,
  });

  try {
    // --- STAGE 0: Voice & Strategy Analysis (Can run in parallel with Stage 1) ---
    const voiceResPromise = aiService.runJson<any>(voicePrompt, 'FLASH', {
      schema: z.object({
        generalPlan: z.array(z.string()),
        conversionPlan: z.array(z.string()),
        brandExclusivePoints: z.array(z.string()),
        competitorBrands: z.array(z.string()),
        competitorProducts: z.array(z.string()),
        regionVoiceDetect: z.string(),
        humanWritingVoice: z.string(),
        toneSensation: z.string().optional(),
        entryPoint: z.string().optional(),
      }),
      promptId: 'voice_strategy_analysis',
    });

    // --- STAGE 1: Skeleton Extraction ---
    console.log('[RefAnalysis] Stage 1: Skeleton Extraction...');
    const outlinePrompt = promptTemplates.extractOutline({
      content: referenceContent,
      targetAudience,
      languageInstruction,
    });
    const outlineRes = await aiService.runJson<any>(outlinePrompt, 'FLASH', {
      schema: z.object({
        h1Title: z.string(),
        introText: z.string(),
        keyInformationPoints: z.array(z.string()),
        structure: z.array(
          z.object({
            title: z.string(),
            subheadings: z.array(z.string()).optional(),
            exclude: z.boolean().optional(),
            excludeReason: z.string().optional(),
          })
        ),
      }),
      promptId: 'skeleton_extraction',
    });

    const outlineData = outlineRes.data;
    console.log('[RefAnalysis] Outline Data:', JSON.stringify(outlineData, null, 2));

    // Filter excluded sections for deep analysis
    const sectionsToAnalyze = (outlineData.structure || []).filter((item: any) => {
      if (item.exclude === true) return false;
      const navKeywords = [
        '目錄',
        '導覽',
        '清單',
        '引言',
        '前言',
        '延伸閱讀',
        '相關文章',
        'Table of Contents',
        'TOC',
        'Introduction',
        'Overview',
      ];
      if (navKeywords.some((kw) => item.title.includes(kw) && item.title.length < 15)) return false;
      return true;
    });

    // Inject Introduction as the first section if introText exists
    if (outlineData.introText && outlineData.introText.length > 10) {
      sectionsToAnalyze.unshift({
        title: 'Introduction',
        subheadings: [], // Intro usually doesn't have subheadings
      });
    }

    // --- STAGE 2: Deep Narrative Logic Analysis (Parallel Batches) ---
    console.log(
      `[RefAnalysis] Stage 2: Deep Logic Analysis for ${sectionsToAnalyze.length} sections...`
    );

    const chunkArray = <T>(array: T[], size: number): T[][] => {
      const chunked: T[][] = [];
      for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
      }
      return chunked;
    };

    // Split sections into chunks of 4 to avoid massive prompts and enable parallelism
    const sectionChunks = chunkArray(sectionsToAnalyze, 4);

    const logicAnalysisPromise = (async () => {
      const chunkPromises = sectionChunks.map(async (chunk, idx) => {
        const chunkPrompt = promptTemplates.analyzeNarrativeLogic({
          content: referenceContent,
          outlineJson: JSON.stringify(chunk),
          targetAudience,
          languageInstruction,
        });

        try {
          return await aiService.runJson<any>(chunkPrompt, 'FLASH', {
            schema: z.object({
              structure: z.array(
                z.object({
                  title: z.string(),
                  narrativePlan: z.array(z.string()),
                  logicalFlow: z.string(),
                  coreFocus: z.string(),
                  keyFacts: z.array(z.string()),
                  coreQuestion: z.string(),
                  difficulty: z.enum(['easy', 'medium', 'unclear']),
                  writingMode: z.enum(['direct', 'multi_solutions']),
                  uspNotes: z.array(z.string()).optional(),
                  suppress: z.array(z.string()).optional(),
                  augment: z.array(z.string()).optional(),
                  subsections: z.array(
                    z.object({
                      title: z.string(),
                      keyFacts: z.array(z.string()),
                    })
                  ),
                  sourceCharCount: z.number(),
                  instruction: z.string(),
                })
              ),
            }),
            promptId: `narrative_logic_analysis_chunk_${idx}`,
          });
        } catch (err) {
          console.error(`[RefAnalysis] Logic analysis chunk ${idx} failed`, err);
          return null; // Handle partial failure
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      
      // Merge results
      const combinedStructure: any[] = [];
      let combinedUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
      let combinedCost = { inputCost: 0, outputCost: 0, totalCost: 0 };

      chunkResults.forEach((res) => {
        if (res && res.data?.structure) {
          combinedStructure.push(...res.data.structure);
          combinedUsage.inputTokens += res.usage?.inputTokens || 0;
          combinedUsage.outputTokens += res.usage?.outputTokens || 0;
          combinedUsage.totalTokens += res.usage?.totalTokens || 0;
          combinedCost.inputCost += res.cost?.inputCost || 0;
          combinedCost.outputCost += res.cost?.outputCost || 0;
          combinedCost.totalCost += res.cost?.totalCost || 0;
        }
      });

      return {
        data: { structure: combinedStructure },
        usage: combinedUsage,
        cost: combinedCost
      };
    })();

    const [logicRes, voiceRes] = await Promise.all([
      logicAnalysisPromise,
      voiceResPromise,
    ]);

    const logicData = logicRes.data;
    const voiceData = voiceRes.data;

    // --- DATA MERGING ---
    const normalizedStructure = logicData.structure.map((logicItem: any) => {
      // Find original skeleton item to get subheadings
      const skeletonItem = outlineData.structure.find((s: any) => s.title === logicItem.title);

      return {
        ...logicItem,
        subheadings: skeletonItem?.subheadings || [],
        uspNotes: logicItem.uspNotes || [],
        suppress: logicItem.suppress || [],
        augment: logicItem.augment || [],
        subsections: logicItem.subsections || [],
        keyFacts:
          logicItem.keyFacts ||
          (logicItem.subsections ? logicItem.subsections.flatMap((s: any) => s.keyFacts) : []),
        difficulty: logicItem.difficulty || 'easy',
        writingMode: logicItem.writingMode || 'direct',
      };
    });

    const combinedRules = [
      ...(voiceData.competitorBrands || []),
      ...(voiceData.competitorProducts || []),
    ];

    // Total usage including all 3 calls (Outline, Logic, Voice)
    const totalUsage = {
      inputTokens:
        (outlineRes.usage?.inputTokens || 0) +
        (logicRes.usage?.inputTokens || 0) +
        (voiceRes.usage?.inputTokens || 0),
      outputTokens:
        (outlineRes.usage?.outputTokens || 0) +
        (logicRes.usage?.outputTokens || 0) +
        (voiceRes.usage?.outputTokens || 0),
      totalTokens:
        (outlineRes.usage?.totalTokens || 0) +
        (logicRes.usage?.totalTokens || 0) +
        (voiceRes.usage?.totalTokens || 0),
    };

    const totalCost = {
      inputCost:
        (outlineRes.cost?.inputCost || 0) +
        (logicRes.cost?.inputCost || 0) +
        (voiceRes.cost?.inputCost || 0),
      outputCost:
        (outlineRes.cost?.outputCost || 0) +
        (logicRes.cost?.outputCost || 0) +
        (voiceRes.cost?.outputCost || 0),
      totalCost:
        (outlineRes.cost?.totalCost || 0) +
        (logicRes.cost?.totalCost || 0) +
        (voiceRes.cost?.totalCost || 0),
    };

    return {
      data: {
        h1Title: outlineData.h1Title || '',
        introText: outlineData.introText || '',
        structure: normalizedStructure,
        keyInformationPoints: outlineData.keyInformationPoints || [],
        generalPlan: voiceData.generalPlan || [],
        conversionPlan: voiceData.conversionPlan || [],
        brandExclusivePoints: voiceData.brandExclusivePoints || [],
        replacementRules: combinedRules,
        competitorBrands: voiceData.competitorBrands || [],
        competitorProducts: voiceData.competitorProducts || [],
        regionVoiceDetect: voiceData.regionVoiceDetect,
        humanWritingVoice: voiceData.humanWritingVoice,
        toneSensation: voiceData.toneSensation,
        entryPoint: voiceData.entryPoint,
      },
      usage: totalUsage,
      cost: totalCost,
      duration: Date.now() - startTs,
    };
  } catch (e: any) {
    console.error('Structure analysis failed', e);
    const errorUsage = toTokenUsage(0); // Simplified error handling
    const errorCost = { inputCost: 0, outputCost: 0, totalCost: 0 };
    return {
      data: {
        structure: [],
        generalPlan: [],
        conversionPlan: [],
        keyInformationPoints: [],
        brandExclusivePoints: [],
        replacementRules: [],
        competitorBrands: [],
        competitorProducts: [],
      },
      usage: errorUsage,
      cost: errorCost,
      duration: Date.now() - startTs,
    };
  }
};

/**
 * Merges multiple ReferenceAnalysis objects into a single "Master Plan".
 */
export const mergeMultipleAnalyses = async (
  analyses: ReferenceAnalysis[],
  targetAudience: TargetAudience,
  userInstruction?: string
): Promise<ReferenceAnalysis> => {
  // 0. Pre-check
  if (!analyses || analyses.length === 0) throw new Error('No analyses to merge');
  if (analyses.length === 1) return analyses[0];

  const startTs = Date.now();
  const languageInstruction = getLanguageInstruction(targetAudience);

  // 1. Union "Sharable" Elements (Keywords, Rules, simple lists)
  // Flatten lists and deduplicate
  const allCompetitorBrands = Array.from(
    new Set(analyses.flatMap((a) => a.competitorBrands || []))
  );
  const allCompetitorProducts = Array.from(
    new Set(analyses.flatMap((a) => a.competitorProducts || []))
  );
  const allReplacements = Array.from(
    new Set(analyses.flatMap((a) => a.regionalReplacements || []).map((x) => JSON.stringify(x)))
  ).map((s: any) => JSON.parse(s));

  // For logical synthesis, we prepare a simplified input for the AI
  // We strip out heavy content to save tokens, focusing on Structure & Strategy
  const simplifiedInputs = analyses.map((a, idx) => ({
    id: `Source_${idx + 1}`,
    structure: a.structure.map((s) => ({
      title: s.title,
      subheadings: s.subheadings,
      coreFocus: s.coreFocus,
      keyFacts: s.keyFacts,
    })),
    generalPlan: a.generalPlan,
    keyInformationPoints: a.keyInformationPoints,
    humanWritingVoice: a.humanWritingVoice,
    toneSensation: a.toneSensation,
  }));

  // 2. AI Synthesis for Structure & Voice
  console.log(`[RefAnalysis] Merging ${analyses.length} analyses...`);
  const mergePrompt = promptTemplates.mergeAnalyses({
    analysesJson: JSON.stringify(simplifiedInputs, null, 2),
    targetAudience,
    languageInstruction,
    userInstruction,
  });

  try {
    const mergeRes = await aiService.runJson<ReferenceAnalysis>(mergePrompt, 'FLASH', {
      schema: z.object({
        structure: z.array(
          z.object({
            title: z.string(),
            subheadings: z.array(z.string()).optional(),
            narrativePlan: z.array(z.string()),
            logicalFlow: z.string().optional(),
            keyFacts: z.array(z.string()).optional(),
            coreFocus: z.string().optional(),
            writingMode: z.enum(['direct', 'multi_solutions']).optional(),
          })
        ),
        generalPlan: z.array(z.string()),
        keyInformationPoints: z.array(z.string()),
        brandExclusivePoints: z.array(z.string()),
        conversionPlan: z.array(z.string()),
        humanWritingVoice: z.string(),
        regionVoiceDetect: z.string().optional(),
      }),
      promptId: 'analysis_synthesis_merge',
    });

    const mergedData = mergeRes.data;

    // 3. Re-attach Unioned Data
    return {
      ...mergedData,
      competitorBrands: allCompetitorBrands,
      competitorProducts: allCompetitorProducts,
      regionalReplacements: allReplacements,
      // We use the AI's synthesized structure, but ensure defaults
      structure: mergedData.structure.map((s) => ({
        ...s,
        difficulty: 'medium', // Default for merged content
        exclude: false,
        subheadings: s.subheadings || [],
        narrativePlan: s.narrativePlan || [],
        keyFacts: s.keyFacts || [],
        uspNotes: [],
        suppress: [],
        augment: [],
      })),
    };
  } catch (e) {
    console.error('Merge failed', e);
    // Fallback: Return the first analysis
    return analyses[0];
  }
};
