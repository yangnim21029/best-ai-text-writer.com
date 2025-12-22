import { ServiceResponse, ReferenceAnalysis, TargetAudience } from '../../types';
import { aiService } from '../engine/aiService';
import { promptTemplates } from '../engine/promptTemplates';
import { getLanguageInstruction, toTokenUsage } from '../engine/promptService';
import { Type } from '../engine/schemaTypes';

export const extractWebsiteTypeAndTerm = async (content: string) => {
  // Lightweight helper for URL scraping flow to infer websiteType & authorityTerms.
  const prompt = `
    Analyze the provided content and extract the website type and authority terms.
    
    CRITICAL: You must return ONLY a JSON object. No conversational text, no introductions, no "Here is the JSON".
    
    JSON STRUCTURE:
    {
      "websiteType": "The broad category of the site (e.g. 'Medical Clinic', 'Ecommerce', 'Tech Blog', 'Review Site')",
      "authorityTerms": "Up to 5 comma-separated terms that establish clinical or brand authority (e.g. medical degrees, awards, proprietary ingredients, certifications)"
    }

    CONTENT TO ANALYZE:
    ${content.substring(0, 6000)}
    `;

  // Using runJson for structured output
  return await aiService.runJson<{ websiteType: string; authorityTerms: string }>(prompt, 'FLASH', {
    type: Type.OBJECT,
    properties: {
      websiteType: { type: Type.STRING },
      authorityTerms: { type: Type.STRING },
    },
  });
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
      type: Type.OBJECT,
      properties: {
        generalPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
        conversionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
        brandExclusivePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        competitorBrands: { type: Type.ARRAY, items: { type: Type.STRING } },
        competitorProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
        regionVoiceDetect: { type: Type.STRING },
        humanWritingVoice: { type: Type.STRING },
        toneSensation: { type: Type.STRING },
        entryPoint: { type: Type.STRING },
      },
      required: [
        'generalPlan',
        'conversionPlan',
        'brandExclusivePoints',
        'regionVoiceDetect',
        'humanWritingVoice',
      ],
    });

    // --- STAGE 1: Skeleton Extraction ---
    console.log('[RefAnalysis] Stage 1: Skeleton Extraction...');
    const outlinePrompt = promptTemplates.extractOutline({
      content: referenceContent,
      targetAudience,
      languageInstruction,
    });
    const outlineRes = await aiService.runJson<any>(outlinePrompt, 'FLASH', {
      type: Type.OBJECT,
      properties: {
        h1Title: { type: Type.STRING },
        introText: { type: Type.STRING },
        keyInformationPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        structure: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subheadings: { type: Type.ARRAY, items: { type: Type.STRING } },
              exclude: { type: Type.BOOLEAN },
              excludeReason: { type: Type.STRING },
            },
            required: ['title'],
          },
        },
      },
      required: ['h1Title', 'introText', 'structure', 'keyInformationPoints'],
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

    // --- STAGE 2: Deep Narrative Logic Analysis ---
    console.log(
      `[RefAnalysis] Stage 2: Deep Logic Analysis for ${sectionsToAnalyze.length} sections...`
    );
    const logicPrompt = promptTemplates.analyzeNarrativeLogic({
      content: referenceContent,
      outlineJson: JSON.stringify(sectionsToAnalyze),
      targetAudience,
      languageInstruction,
    });

    const [logicRes, voiceRes] = await Promise.all([
      aiService.runJson<any>(logicPrompt, 'FLASH', {
        type: Type.OBJECT,
        properties: {
          structure: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                narrativePlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                logicalFlow: { type: Type.STRING },
                coreFocus: { type: Type.STRING },
                keyFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
                coreQuestion: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                writingMode: { type: Type.STRING },
                uspNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
                suppress: { type: Type.ARRAY, items: { type: Type.STRING } },
                augment: { type: Type.ARRAY, items: { type: Type.STRING } },
                subsections: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      keyFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['title', 'keyFacts'],
                  },
                },
                sourceCharCount: { type: Type.NUMBER },
                instruction: { type: Type.STRING },
              },
              required: [
                'title',
                'narrativePlan',
                'logicalFlow',
                'keyFacts',
                'coreQuestion',
                'coreFocus',
                'subsections',
                'instruction',
                'sourceCharCount',
              ],
            },
          },
        },
        required: ['structure'],
      }),
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
      type: Type.OBJECT,
      properties: {
        structure: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              subheadings: { type: Type.ARRAY, items: { type: Type.STRING } },
              narrativePlan: { type: Type.ARRAY, items: { type: Type.STRING } },
              logicalFlow: { type: Type.STRING },
              keyFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
              coreFocus: { type: Type.STRING },
              writingMode: { type: Type.STRING },
            },
            required: ['title', 'subheadings', 'narrativePlan'],
          },
        },
        generalPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
        keyInformationPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        brandExclusivePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        conversionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
        humanWritingVoice: { type: Type.STRING },
        regionVoiceDetect: { type: Type.STRING },
      },
      required: ['structure', 'generalPlan', 'humanWritingVoice'],
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
