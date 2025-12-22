import { useAnalysisStore } from '@/store/useAnalysisStore';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useAppStore } from '@/store/useAppStore';

export const resetGenerationState = () => {
  useGenerationStore.getState().resetGeneration();
  useAppStore.getState().resetSessionStats();

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
