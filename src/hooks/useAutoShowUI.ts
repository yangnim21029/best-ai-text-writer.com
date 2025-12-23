import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useAnalysisStore } from '@/store/useAnalysisStore';

export const useAutoShowUI = () => {
  const app = useAppStore();
  const generationStore = useGenerationStore();
  const analysisStore = useAnalysisStore();
  
  const [hasAutoShownSidebar, setHasAutoShownSidebar] = useState(false);
  const [hasAutoShownPlanModal, setHasAutoShownPlanModal] = useState(false);

  // Reset auto-show flags when starting a new analysis
  useEffect(() => {
    if (generationStore.status === 'analyzing') {
      setHasAutoShownSidebar(false);
      setHasAutoShownPlanModal(false);
    }
  }, [generationStore.status]);

  // Sidebar Auto-show
  useEffect(() => {
    if (generationStore.status === 'analyzing' && !app.showSidebar && !hasAutoShownSidebar) {
      app.setShowSidebar(true);
      setHasAutoShownSidebar(true);
    }
  }, [generationStore.status, app.showSidebar, hasAutoShownSidebar, app]);

  // Plan Modal Auto-show
  useEffect(() => {
    const hasStructure = Boolean(analysisStore.refAnalysis?.structure?.length);
    if (
      generationStore.status === 'analysis_ready' &&
      hasStructure &&
      !app.showPlanModal &&
      !hasAutoShownPlanModal
    ) {
      // Only show if we just finished analysis
      if (generationStore.generationStep === 'idle') {
        app.setShowPlanModal(true);
        setHasAutoShownPlanModal(true);
      }
    }
  }, [
    generationStore.status,
    generationStore.generationStep,
    analysisStore.refAnalysis?.structure,
    app.showPlanModal,
    hasAutoShownPlanModal,
    app,
  ]);
};
