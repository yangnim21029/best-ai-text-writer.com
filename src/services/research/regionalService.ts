/**
 * Regional Analysis & Grounding Service
 * Consolidated logic for detecting, validating, and adapting content for regional markets.
 */

import { TokenUsage, CostBreakdown, TargetAudience, SectionAnalysis, ServiceResponse, RegionIssue, RegionGroundingResult } from '../../types';
import { REGION_CONFIG } from '../../config/regionConfig';
import { aiService } from '../engine/aiService';
import { Type } from '../engine/schemaTypes';
import { promptTemplates } from '../engine/promptTemplates';

// --- Utils ---

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

// --- Core AI Engine Logic ---

/**
 * AI logic for detecting entities from other regions
 */
export const detectForeignEntities = async (
  content: string,
  targetAudience: TargetAudience
): Promise<{
  entities: { text: string; type: string; region: string }[];
  usage: TokenUsage;
  cost: CostBreakdown;
  duration: number;
}> => {
  const config = REGION_CONFIG[targetAudience];
  if (!config) return { entities: [], usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: 0 };

  const prompt = promptTemplates.detectForeignEntities(config, content);

  const response = await aiService.runJson<{
    entities: { text: string; type: string; region: string }[];
  }>(prompt, 'FLASH', {
    schema: {
      type: Type.OBJECT,
      properties: {
        entities: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              type: { type: Type.STRING },
              region: { type: Type.STRING },
            },
          },
        },
      },
    },
    promptId: 'detect_foreign_entities',
  });

  const foreignEntities = (response.data.entities || []).filter(
    (e) => config.excludeRegions.includes(e.region) || e.region === 'OTHER'
  );

  return { entities: foreignEntities, usage: response.usage, cost: response.cost, duration: response.duration };
};

/**
 * AI logic for finding regional equivalents
 */
export const findRegionEquivalents = async (
  entities: { text: string; type: string; region: string }[],
  targetAudience: TargetAudience
) => {
  const config = REGION_CONFIG[targetAudience];
  if (entities.length === 0 || !config) {
    return { mappings: [], usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: 0 };
  }

  const entityList = entities.map((e) => `- ${e.text} (${e.type})`).join('\n');
  const prompt = promptTemplates.findRegionEquivalents(config, entityList);

  const response = await aiService.runJson<{
    mappings: RegionIssue[];
  }>(prompt, 'FLASH', {
    schema: {
      type: Type.OBJECT,
      properties: {
        mappings: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              original: { type: Type.STRING },
              regionEquivalent: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              context: { type: Type.STRING },
              sourceRegion: { type: Type.STRING },
            },
            required: ['original', 'regionEquivalent', 'context'],
          },
        },
      },
      required: ['mappings'],
    },
    useSearch: true,
    promptId: 'find_region_equivalents',
  });

  const aiMappings = response.data.mappings || [];
  const finalMappings: RegionIssue[] = entities.map((entity) => {
    const found = aiMappings.find((m) => m.original === entity.text);
    if (found) {
      return {
        ...found,
        regionEquivalent: found.regionEquivalent === '[刪除]' ? '' : found.regionEquivalent,
      };
    }
    return {
      type: entity.type as any,
      original: entity.text,
      regionEquivalent: '',
      confidence: 0,
      context: '未找到合適替代，建議從內容中移除',
      sourceRegion: entity.region,
    };
  });

  return { mappings: finalMappings, usage: response.usage, cost: response.cost, duration: response.duration };
};

/**
 * AI logic for rewriting content for target region
 */
export const rewriteForRegion = async (
  content: string,
  mappings: RegionIssue[],
  targetAudience: TargetAudience
): Promise<{
  rewrittenContent: string;
  changes: { original: string; rewritten: string }[];
  usage: TokenUsage;
  cost: CostBreakdown;
  duration: number;
}> => {
  const config = REGION_CONFIG[targetAudience];
  if (mappings.length === 0 || !config) return { rewrittenContent: content, changes: [], usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: 0 };

  const mappingInstructions = mappings
    .map((m) => `- 「${m.original}」→「${m.regionEquivalent}」：${m.context}`)
    .join('\n');

  const prompt = promptTemplates.rewriteForRegion(config, mappingInstructions, content);

  const response = await aiService.runJson<{
    rewrittenContent: string;
    changes: { original: string; rewritten: string }[];
  }>(prompt, 'FLASH', {
    schema: {
      type: Type.OBJECT,
      properties: {
        rewrittenContent: { type: Type.STRING },
        changes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING },
              rewritten: { type: Type.STRING },
            },
          },
        },
      },
    },
    promptId: 'rewrite_for_region',
  });

  return {
    rewrittenContent: response.data.rewrittenContent || content,
    changes: response.data.changes || [],
    usage: response.usage,
    cost: response.cost,
    duration: response.duration,
  };
};

// --- High Level Service Pipelines ---

/**
 * Full region grounding validation pipeline
 */
export const validateAndAdaptForRegion = async (
  content: string,
  targetAudience: TargetAudience
): Promise<{
  result: RegionGroundingResult;
  rewrittenContent: string;
  usage: TokenUsage;
  cost: CostBreakdown;
  duration: number;
}> => {
  const startTime = Date.now();
  let totalUsage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  let totalCost: CostBreakdown = { inputCost: 0, outputCost: 0, totalCost: 0 };

  const detectResult = await detectForeignEntities(content, targetAudience);
  totalUsage = mergeUsage(totalUsage, detectResult.usage);
  totalCost = mergeCost(totalCost, detectResult.cost);

  if (detectResult.entities.length === 0) {
    return {
      result: { isRegionRelevant: true, relevanceScore: 100, issues: [], suggestions: [] },
      rewrittenContent: content,
      usage: totalUsage,
      cost: totalCost,
      duration: Date.now() - startTime,
    };
  }

  const groundingResult = await findRegionEquivalents(detectResult.entities, targetAudience);
  totalUsage = mergeUsage(totalUsage, groundingResult.usage);
  totalCost = mergeCost(totalCost, groundingResult.cost);

  let finalContent = content;
  let changes: { original: string; rewritten: string }[] = [];

  if (groundingResult.mappings.length > 0) {
    const rewriteResult = await rewriteForRegion(content, groundingResult.mappings, targetAudience);
    finalContent = rewriteResult.rewrittenContent;
    changes = rewriteResult.changes;
    totalUsage = mergeUsage(totalUsage, rewriteResult.usage);
    totalCost = mergeCost(totalCost, rewriteResult.cost);
  }

  const totalEntities = detectResult.entities.length;
  const resolvedEntities = groundingResult.mappings.filter((m) => m.confidence > 0.7).length;
  const relevanceScore = Math.round((resolvedEntities / Math.max(1, totalEntities)) * 100);

  return {
    result: {
      isRegionRelevant: detectResult.entities.length === 0 || relevanceScore >= 80,
      relevanceScore: Math.max(0, Math.min(100, 100 - (totalEntities - resolvedEntities) * 10)),
      issues: groundingResult.mappings,
      suggestions: changes,
    },
    rewrittenContent: finalContent,
    usage: totalUsage,
    cost: totalCost,
    duration: Date.now() - startTime,
  };
};

/**
 * AI-powered localization for section plans
 */
export const localizePlanWithAI = async (
  data: {
    generalPlan: string[];
    conversionPlan: string[];
    sections: SectionAnalysis[];
    humanWritingVoice?: string;
  },
  replacements: { original: string; replacement: string; reason?: string }[],
  targetAudience: TargetAudience
) => {
  const config = REGION_CONFIG[targetAudience];
  if (!config || replacements.length === 0) {
    return {
      localizedGeneralPlan: data.generalPlan,
      localizedConversionPlan: data.conversionPlan,
      localizedSections: data.sections,
      localizedHumanWritingVoice: data.humanWritingVoice,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
      duration: 0,
    };
  }

  const replacementGuide = replacements
    .map((r) => r.replacement ? `- 「${r.original}」→「${r.replacement}」${r.reason ? `（${r.reason}）` : ''}` : `- 「${r.original}」→ 刪除此詞`)
    .join('\n');

  const plansJson = JSON.stringify({
    generalPlan: data.generalPlan,
    conversionPlan: data.conversionPlan,
    humanWritingVoice: data.humanWritingVoice || '',
    sections: data.sections.map(s => ({ ...s })),
  }, null, 2);

  const prompt = promptTemplates.localizePlanWithAI(replacementGuide, plansJson);

  const response = await aiService.runJson<{
    generalPlan: string[];
    conversionPlan: string[];
    humanWritingVoice: string;
    sections: SectionAnalysis[];
  }>(prompt, 'FLASH', {
    schema: {
      type: Type.OBJECT,
      properties: {
        generalPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
        conversionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
        humanWritingVoice: { type: Type.STRING },
        sections: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              narrativePlan: { type: Type.ARRAY, items: { type: Type.STRING } },
              coreQuestion: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              writingMode: { type: Type.STRING },
              subheadings: { type: Type.ARRAY, items: { type: Type.STRING } },
              keyFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
              logicalFlow: { type: Type.STRING },
              coreFocus: { type: Type.STRING },
            },
          },
        },
      },
      required: ['generalPlan', 'conversionPlan', 'sections', 'humanWritingVoice'],
    },
    promptId: 'localize_plan_ai',
  });

  return {
    localizedGeneralPlan: response.data.generalPlan || data.generalPlan,
    localizedConversionPlan: response.data.conversionPlan || data.conversionPlan,
    localizedSections: response.data.sections || data.sections,
    localizedHumanWritingVoice: response.data.humanWritingVoice || data.humanWritingVoice,
    usage: response.usage,
    cost: response.cost,
    duration: response.duration,
  };
};

/**
 * Basic regional term analysis for the initial analysis pipeline
 */
export const analyzeRegionalTerms = async (
  content: string,
  targetAudience: string
): Promise<ServiceResponse<{ original: string; replacement: string; reason: string }[]>> => {
  // Safety check: if content is too short, skip
  if (!content || content.length < 50) {
    return {
      data: [],
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
      duration: 0,
    };
  }

  const startTs = Date.now();
  const prompt = promptTemplates.regionalBrandAnalysis({ content, targetAudience });

  const response = await aiService.runJson< 
    { original: string; replacement: string; reason: string }[]
  >(prompt, 'FLASH', {
    schema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING },
          replacement: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
      },
    },
    promptId: 'analyze_regional_terms',
  });

  return {
    data: response.data || [],
    usage: response.usage,
    cost: response.cost,
    duration: Date.now() - startTs,
  };
};