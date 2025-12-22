import { ArticleConfig } from '../../types';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { useAppStore } from '@/store/useAppStore';
import { runAnalysisPipelineService } from '@/services/generation/analysisCoordinator';

/**
 * Orchestrates the analysis pipeline by connecting global store state to the analysis service.
 * This is a service wrapper, not a hook.
 */
export const executeAnalysisPipeline = async (config: ArticleConfig) => {
  const generationStore = useGenerationStore.getState();
  const analysisStore = useAnalysisStore.getState();
  const appStore = useAppStore.getState();

  return runAnalysisPipelineService(config, {
    generationStore: {
      setStatus: (status) => useGenerationStore.getState().setStatus(status),
      setGenerationStep: (step) => useGenerationStore.getState().setGenerationStep(step),
      isStopped: useGenerationStore.getState().isStopped,
    },
    analysisStore: {
      setScrapedImages: (images) => useAnalysisStore.getState().setScrapedImages(images),
      setTargetAudience: (audience) => useAnalysisStore.getState().setTargetAudience(audience),
      setArticleTitle: (title) => useAnalysisStore.getState().setArticleTitle(title),
      setReferenceContent: (content) => useAnalysisStore.getState().setReferenceContent(content),
      setLanguageInstruction: (instruction) =>
        useAnalysisStore.getState().setLanguageInstruction(instruction),
      setProductMapping: (mapping) => useAnalysisStore.getState().setProductMapping(mapping),
      setActiveProductBrief: (brief) => useAnalysisStore.getState().setActiveProductBrief(brief),
      setKeywordPlans: (plans) => useAnalysisStore.getState().setKeywordPlans(plans),
      setRefAnalysis: (analysis) => useAnalysisStore.getState().setRefAnalysis(analysis),
      setAuthAnalysis: (analysis) => useAnalysisStore.getState().setAuthAnalysis(analysis),
      setVisualStyle: (style) => useAnalysisStore.getState().setVisualStyle(style),
      saveCurrentToDocument: () => useAnalysisStore.getState().saveCurrentToDocument(),
      brandKnowledge: analysisStore.brandKnowledge,
      refAnalysis: analysisStore.refAnalysis,
    },
    appStore: {
      addCost: (cost, tokens) => useAppStore.getState().addCost(cost, tokens),
      keywordCharDivisor: appStore.keywordCharDivisor,
      minKeywords: appStore.minKeywords,
      maxKeywords: appStore.maxKeywords,
    },
  });
};
