import { useAnalysisStore } from './useAnalysisStore';
import { useGenerationStore } from './useGenerationStore';
import { useMetricsStore } from './useMetricsStore';

export const resetGenerationState = () => {
    useGenerationStore.getState().resetGeneration();
    useMetricsStore.getState().resetSessionStats();

    const analysis = useAnalysisStore.getState();
    analysis.setKeywordPlans([]);
    analysis.setRefAnalysis(null);
    analysis.setAuthAnalysis(null);
    analysis.setScrapedImages([]);
    analysis.setVisualStyle('');
    analysis.setCoveredPoints([]);
    analysis.setProductMapping([]);
    analysis.setActiveProductBrief(undefined);
    analysis.setArticleTitle('');
};
