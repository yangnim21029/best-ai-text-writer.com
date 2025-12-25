'use server';

import {
  extractWebsiteTypeAndTerm,
  analyzeReferenceStructure,
  mergeMultipleAnalyses,
  extractVoiceProfileOnly,
  generateTestSectionWithVoice,
  runFullReplicationTest,
  runMixAndMatchReplication
} from '@/services/research/referenceAnalysisService';
import { analyzeVisualStyle } from '@/services/generation/imageService';
import {
  analyzeRegionalTerms,
  localizePlanWithAI,
  findRegionEquivalents
} from '@/services/research/regionalService';
import { analyzeAuthorityTerms } from '@/services/research/authorityService';
import { analyzeText } from '@/services/adapters/nlpService';
import { embedTexts, cosineSimilarity } from '@/services/adapters/embeddingService';
import { extractSemanticKeywordsAnalysis } from '@/services/research/termUsagePlanner';

import {
  parseProductContext,
  generateProblemProductMapping,
  summarizeBrandContent
} from '@/services/research/productFeatureToPainPointMapper';
import {
  TargetAudience,
  ScrapedImage,
  ProductBrief,
  ArticleConfig,
  ReferenceAnalysis,
  KeywordData
} from '@/types';
import { aiService } from '@/services/adapters/aiService';
import { isAuthorizedAction } from './auth';

/**
 * Server Action to convert content to Markdown.
 */
export async function convertToMarkdownAction(content: string) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  return await aiService.convertToMarkdown(content);
}

/**
 * Server Action to localize a plan.
 */
export async function localizePlanAction(
  plan: ReferenceAnalysis,
  targetAudience: TargetAudience
) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  return await localizePlanWithAI(
    {
      generalPlan: plan.generalPlan || [],
      conversionPlan: plan.conversionPlan || [],
      sections: plan.structure || [],
      humanWritingVoice: plan.humanWritingVoice,
    },
    plan.regionalReplacements || [],
    targetAudience
  );
}

/**
 * Server Action to find regional equivalents.
 */
export async function findRegionEquivalentsAction(
  entities: { text: string; type: string; region: string }[],
  targetAudience: TargetAudience
) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  return await findRegionEquivalents(entities, targetAudience);
}

/**
 * Server Action to merge multiple reference analyses.
 */
export async function mergeAnalysesAction(
  analyses: ReferenceAnalysis[],
  targetAudience: TargetAudience,
  instruction?: string
) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  return await mergeMultipleAnalyses(analyses, targetAudience, instruction);
}

/**
 * Server Action to run the entire analysis pipeline.
 * This replaces the client-side coordination logic.
 */
export async function runFullAnalysisAction(config: ArticleConfig & { brandKnowledge?: string }) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  // 1. Product Task
  const productTask = async () => {
    let parsedProductBrief = config.productBrief;
    let generatedMapping: any[] = [];
    let totalUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    let totalCost = { inputCost: 0, outputCost: 0, totalCost: 0 };

    if (!parsedProductBrief && config.productRawText && config.productRawText.length > 5) {
      const parseRes = await parseProductContext(config.productRawText);
      parsedProductBrief = parseRes.data;
      totalUsage.totalTokens += parseRes.usage.totalTokens;
      totalCost.totalCost += parseRes.cost.totalCost;
    }

    if (parsedProductBrief && parsedProductBrief.productName) {
      const mapRes = await generateProblemProductMapping(parsedProductBrief, config.targetAudience);
      generatedMapping = mapRes.data;
      totalUsage.totalTokens += mapRes.usage.totalTokens;
      totalCost.totalCost += mapRes.cost.totalCost;
    }

    return { brief: parsedProductBrief, mapping: generatedMapping, usage: totalUsage, cost: totalCost };
  };

  // 2. NLP & Keyword Planning
  const keywordTask = async () => {
    const keywords = await analyzeText(config.referenceContent);
    const planRes = await extractSemanticKeywordsAnalysis(config.referenceContent, keywords, config.targetAudience);
    return { plans: planRes.data, usage: planRes.usage, cost: planRes.cost };
  };

  // 3. Structure & Authority
  const structureTask = async () => {
    const [structRes, authRes] = await Promise.all([
      analyzeReferenceStructure(config.referenceContent, config.targetAudience),
      analyzeAuthorityTerms(
        config.authorityTerms || '',
        config.title,
        config.websiteType || 'General Professional Website',
        config.targetAudience
      ),
    ]);
    return { structRes, authRes };
  };

  // 4. Visual Style
  const visualTask = async () => {
    try {
      const styleRes = await analyzeVisualStyle(config.scrapedImages || [], config.websiteType || 'Modern Business');
      return { style: styleRes.data, usage: styleRes.usage, cost: styleRes.cost };
    } catch (e) {
      return { style: 'Clean, modern professional photography.', usage: { totalTokens: 0 }, cost: { totalCost: 0 } };
    }
  };

  // 5. Regional Analysis
  const regionalTask = async () => {
    try {
      const regionRes = await analyzeRegionalTerms(config.referenceContent, config.targetAudience);
      return regionRes.data || [];
    } catch (e) {
      return [];
    }
  };

  const [productResult, structureResult, visualResult, regionalResult, keywordResult] = await Promise.all([
    productTask(),
    structureTask(),
    visualTask(),
    regionalTask(),
    keywordTask(),
  ]);

  // Merge regional result into structure
  if (structureResult.structRes.data) {
    structureResult.structRes.data.regionalReplacements = regionalResult;
  }

  return {
    productResult,
    structureResult,
    keywordResult,
    visualResult,
    regionalResult,
  };
}

/**
 * Server Action to extract website type and authority terms from content.
 */
export async function extractWebsiteTypeAction(content: string) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  try {
    return await extractWebsiteTypeAndTerm(content);
  } catch (error) {
    console.error('[extractWebsiteTypeAction] Failed:', error);
    throw error;
  }
}

/**
 * Server Action to summarize brand content from multiple URLs.
 */
export async function summarizeBrandAction(urls: string[], targetAudience: TargetAudience) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  try {
    return await summarizeBrandContent(urls, targetAudience);
  } catch (error) {
    console.error('[summarizeBrandAction] Failed:', error);
    throw error;
  }
}

/**
 * Server Action to analyze product context.
 */
export async function parseProductContextAction(rawText: string) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  return await parseProductContext(rawText);
}

/**
 * Server Action to map pain points to product features.
 */
export async function generateProductMappingAction(brief: ProductBrief, targetAudience: TargetAudience) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  return await generateProblemProductMapping(brief, targetAudience);
}

/**
 * Server Action for NLP analysis.
 */
export async function analyzeTextAction(content: string) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  return await analyzeText(content);
}

/**
 * Server Action for semantic keyword planning.
 */
export async function planKeywordsAction(content: string, keywords: KeywordData[], targetAudience: TargetAudience) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  return await extractSemanticKeywordsAnalysis(content, keywords, targetAudience);
}

/**
 * Server Action to score chunks based on semantic similarity to a title.
 */
export async function scoreSemanticChunksAction(chunks: string[], title: string) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  try {
    const [titleEmbeddings, chunkEmbeddings] = await Promise.all([
      embedTexts([title]),
      embedTexts(chunks),
    ]);

    const titleEmbedding = titleEmbeddings[0];
    if (!titleEmbedding?.length) {
      throw new Error('Failed to get title embedding');
    }

    const similarities = chunks.map((_, idx) => {
      const chunkEmbedding = chunkEmbeddings[idx];
      if (!chunkEmbedding?.length) return 1;
      return cosineSimilarity(titleEmbedding, chunkEmbedding);
    });

    return similarities;
  } catch (error) {
    console.error('[scoreSemanticChunksAction] Failed:', error);
    throw error;
  }
}

/**
 * EXPERIMENTAL: Server Action to extract voice profile only.
 */
export async function extractVoiceProfileAction(content: string, targetAudience: TargetAudience) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  return await extractVoiceProfileOnly(content, targetAudience);
}

/**
 * EXPERIMENTAL: Server Action to test voice profile by generating a section.
 */
export async function testVoiceSectionGenerationAction(
  sectionTitle: string,
  voiceProfile: any,
  targetAudience: TargetAudience
) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  return await generateTestSectionWithVoice(sectionTitle, voiceProfile, targetAudience);
}

/**
 * EXPERIMENTAL: Server Action to run full replication test.
 */
export async function runFullReplicationTestAction(
  sourceContent: string,
  targetAudience: TargetAudience
) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  return await runFullReplicationTest(sourceContent, targetAudience);
}

/**
 * EXPERIMENTAL: Server Action to run mix and match replication test.
 */
export async function runMixAndMatchReplicationAction(
  voiceSource: string,
  structureSource: string,
  contentSource: string,
  targetAudience: TargetAudience
) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  return await runMixAndMatchReplication(
    voiceSource,
    structureSource,
    contentSource,
    targetAudience
  );
}
