import { ArticleConfig } from '../../types';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { useAppStore } from '@/store/useAppStore';
import { runFullAnalysisAction } from '@/app/actions/analysis';
import { getLanguageInstruction } from '@/services/engine/promptService';
import { appendAnalysisLog } from '@/services/generation/generationLogger';

/**
 * Orchestrates the analysis pipeline by connecting global store state to the server-side analysis action.
 */
export const executeAnalysisPipeline = async (config: ArticleConfig) => {
  const generationStore = useGenerationStore.getState();
  const analysisStore = useAnalysisStore.getState();
  const appStore = useAppStore.getState();

  // 1. Local State Sync
  generationStore.setStatus('analyzing');
  analysisStore.setScrapedImages(config.scrapedImages || []);
  analysisStore.setTargetAudience(config.targetAudience);
  analysisStore.setArticleTitle(config.title || '');
  analysisStore.setReferenceContent(config.referenceContent || '');

  const languageInstruction = getLanguageInstruction(config.targetAudience);
  analysisStore.setLanguageInstruction(languageInstruction);

  appendAnalysisLog('Starting full server-side analysis pipeline...');

  try {
    // 2. Run Server Action
    const results = await runFullAnalysisAction({
      ...config,
      brandKnowledge: analysisStore.brandKnowledge
    });

    if (generationStore.isStopped) return null;

    // 3. Update Stores with Results
    const { productResult, structureResult, keywordResult, visualResult, regionalResult } = results;

    // Product
    if (productResult.brief) analysisStore.setActiveProductBrief(productResult.brief);
    if (productResult.mapping) analysisStore.setProductMapping(productResult.mapping);
    appStore.addCost(productResult.cost.totalCost, productResult.usage.totalTokens);

    // Keywords
    if (keywordResult.plans) analysisStore.setKeywordPlans(keywordResult.plans);
    appStore.addCost(keywordResult.cost.totalCost, keywordResult.usage.totalTokens);

    // Structure & Authority
    analysisStore.setRefAnalysis(structureResult.structRes.data);
    analysisStore.setAuthAnalysis(structureResult.authRes.data);
    appStore.addCost(structureResult.structRes.cost.totalCost, structureResult.structRes.usage.totalTokens);
    appStore.addCost(structureResult.authRes.cost.totalCost, structureResult.authRes.usage.totalTokens);

    // Visual
    if (visualResult.style) analysisStore.setVisualStyle(visualResult.style);
    appStore.addCost(visualResult.cost.totalCost, visualResult.usage.totalTokens);

    appendAnalysisLog('Server-side analysis completed.');
    analysisStore.saveCurrentToDocument();

    return results;
  } catch (error) {
    console.error('Analysis Pipeline Failed:', error);
    appendAnalysisLog('Analysis failed. Please check logs.');
    throw error;
  }
};
