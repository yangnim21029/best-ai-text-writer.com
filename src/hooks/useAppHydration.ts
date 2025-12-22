import { useEffect, useRef } from 'react';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useAnalysisStore } from '@/store/useAnalysisStore';

export function useAppHydration() {
  const generationStore = useGenerationStore();
  const analysisStore = useAnalysisStore();
  const restorePromptedRef = useRef(false);
  const hydratedAnalysisRef = useRef(false);

  useEffect(() => {
    analysisStore.loadDocumentsFromDb();
  }, []);

  useEffect(() => {
    if (restorePromptedRef.current || typeof window === 'undefined') return;
    const persistedKeys = [
      'pro_content_writer_analysis',
      'pro_content_writer_generation',
      'pro_content_writer_inputs_simple_v4',
      'ai_writer_editor_autosave_v1',
    ];
    const hasPersisted = persistedKeys.some((k) => localStorage.getItem(k));

    if (!hasPersisted) return;
    restorePromptedRef.current = true;
    const shouldRestore = window.confirm(
      '偵測到上次的資料，是否恢復? 選擇「取消」將清空並重新開始。'
    );
    if (!shouldRestore) {
      persistedKeys.forEach((k) => localStorage.removeItem(k));
      analysisStore.reset();
      generationStore.resetGeneration();
    }
  }, [analysisStore, generationStore]);

  useEffect(() => {
    if (
      hydratedAnalysisRef.current ||
      generationStore.status !== 'idle' ||
      generationStore.analysisResults ||
      typeof window === 'undefined'
    )
      return;

    const hasAnalysisState =
      Boolean(analysisStore.refAnalysis?.structure?.length) ||
      Boolean(analysisStore.keywordPlans.length) ||
      Boolean(analysisStore.authAnalysis);

    if (!hasAnalysisState) return;

    const savedRaw = localStorage.getItem('pro_content_writer_inputs_simple_v4');
    if (!savedRaw) return;

    let saved: any;
    try {
      saved = JSON.parse(savedRaw);
    } catch (e) {
      return;
    }

    const title = (saved?.title || analysisStore.articleTitle || '').trim();
    const referenceContent = (saved?.referenceContent || '').trim();
    if (!title || !referenceContent) return;

    const restoredConfig = {
      title,
      referenceContent,
      sampleOutline: saved?.sampleOutline || '',
      authorityTerms: saved?.authorityTerms || '',
      websiteType: saved?.websiteType || '',
      targetAudience: saved?.targetAudience || analysisStore.targetAudience || 'zh-TW',
      useRag: !!saved?.useRag,
      autoImagePlan: !!saved?.autoImagePlan,
      productRawText: saved?.productRawText || '',
      scrapedImages: saved?.scrapedImages || analysisStore.scrapedImages || [],
      brandKnowledge: analysisStore.brandKnowledge,
    };

    if (restoredConfig.productRawText?.trim() && !analysisStore.activeProductBrief?.productName)
      return;

    generationStore.setLastConfig(restoredConfig);
    generationStore.setAnalysisResults({
      productResult: {
        brief: analysisStore.activeProductBrief,
        mapping: analysisStore.productMapping,
      },
      structureResult: {
        structRes: { data: analysisStore.refAnalysis },
        authRes: { data: analysisStore.authAnalysis },
      },
    });
    generationStore.setStatus('analysis_ready');
    generationStore.setGenerationStep('idle');
    generationStore.setError(null);
    hydratedAnalysisRef.current = true;
  }, [analysisStore, generationStore]);
}
