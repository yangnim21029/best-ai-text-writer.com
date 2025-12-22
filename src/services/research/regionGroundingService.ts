/**
 * Region Grounding Service
 * Uses AI to validate and adapt content for the target market region.
 */

import { TokenUsage, CostBreakdown, TargetAudience, SectionAnalysis } from '../../types';
import { REGION_CONFIG } from '../../config/regionConfig';
import { 
  detectForeignEntitiesAI, 
  findRegionEquivalentsAI, 
  rewriteForRegionAI 
} from './regionGroundingEngine';
import { aiService } from '../engine/aiService';
import { Type } from '../engine/schemaTypes';

export interface RegionIssue {
  type: 'entity' | 'brand' | 'regulation' | 'currency' | 'location' | 'service';
  original: string;
  regionEquivalent: string;
  confidence: number;
  context: string;
  sourceRegion: string;
}

export interface RegionGroundingResult {
  isRegionRelevant: boolean;
  relevanceScore: number;
  issues: RegionIssue[];
  suggestions: { original: string; rewritten: string }[];
}

/**
 * Detect entities from other regions
 */
export const detectForeignEntities = detectForeignEntitiesAI;

/**
 * Find regional equivalents for detected foreign entities
 */
export const findRegionEquivalents = async (
  entities: { text: string; type: string; region: string }[],
  targetAudience: TargetAudience
) => {
  const result = await findRegionEquivalentsAI(entities, targetAudience);
  
  // Post-processing logic moved from the engine to the service
  const aiMappings = result.mappings || [];
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

  return { ...result, mappings: finalMappings };
};

/**
 * Rewrite content for target region
 */
export const rewriteForRegion = rewriteForRegionAI;

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

  const prompt = `你是一位市場內容本地化專家。請將以下段落計劃進行本地化改寫：\n\n替換指引：\n${replacementGuide}\n\n原始計劃：\n${plansJson}`;

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