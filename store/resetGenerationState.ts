import { useAnalysisStore } from './useAnalysisStore';
import { useGenerationStore } from './useGenerationStore';
import { useMetricsStore } from './useMetricsStore';

export const resetGenerationState = () => {
    useGenerationStore.getState().resetGeneration();
    useMetricsStore.getState().resetSessionStats();

    // Clear editor autosave so a fresh analysis doesn't resurrect stale drafts
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem('ai_writer_editor_autosave_v1');
        } catch (e) {
            console.warn('Failed to clear editor autosave', e);
        }
    }

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
    analysis.setHeadingOptimizations([]);
};
