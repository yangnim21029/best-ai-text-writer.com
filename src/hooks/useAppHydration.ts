import { useEffect, useRef } from 'react';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { getScopedKey } from '@/utils/scopedStorage';

export function useAppHydration(isUnlocked: boolean, isAuthVerified: boolean = true) {
  const generationStore = useGenerationStore();
  const analysisStore = useAnalysisStore();
  const restorePromptedRef = useRef(false);
  const hydratedAnalysisRef = useRef(false);

  useEffect(() => {
    if (!isUnlocked) return;
    analysisStore.loadDocumentsFromDb();
  }, [isUnlocked]);

  useEffect(() => {
    if (!isUnlocked || !isAuthVerified) return;
    if (typeof window === 'undefined') return;

    // 1. Session ID check and generation
    const params = new URLSearchParams(window.location.search);
    if (!params.get('session')) {
      const newSessionId = crypto.randomUUID().slice(0, 8);

      // MIGRATION: Check if legacy data exists and migrate it to the new session
      const legacyKeys = [
        'pro_content_writer_analysis',
        'pro_content_writer_generation',
        'pro_content_writer_inputs_simple_v4',
        'ai_writer_editor_autosave_v1',
      ];

      let hasLegacyData = false;
      legacyKeys.forEach(key => {
        const val = localStorage.getItem(key);
        if (val) {
          hasLegacyData = true;
          localStorage.setItem(getScopedKey(key, newSessionId), val);
          localStorage.removeItem(key);
        }
      });

      // Update URL without reload
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('session', newSessionId);
      window.history.replaceState({}, '', newUrl.toString());

      // Reload page to ensure all components pick up the new ID from the URL
      // This is crucial because Stores might have initialized with empty scoped keys
      // if the URL param wasn't there initially.
      window.location.reload();
      return;
    }

    if (restorePromptedRef.current) return;
    const persistedKeys = [
      'pro_content_writer_analysis',
      'pro_content_writer_generation',
      'pro_content_writer_inputs_simple_v4',
      'ai_writer_editor_autosave_v1',
    ];
    // Check scoped keys
    const hasPersisted = persistedKeys.some((k) => localStorage.getItem(getScopedKey(k)));

    if (!hasPersisted) return;
    restorePromptedRef.current = true;
    const shouldRestore = window.confirm(
      '偵測到上次的資料，是否恢復? 選擇「取消」將清空並重新開始。'
    );
    if (!shouldRestore) {
      persistedKeys.forEach((k) => localStorage.removeItem(getScopedKey(k)));
      analysisStore.reset();
      generationStore.resetGeneration();
    }
  }, [analysisStore, generationStore, isUnlocked, isAuthVerified]);

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

    const savedRaw = localStorage.getItem(getScopedKey('pro_content_writer_inputs_simple_v4'));
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
