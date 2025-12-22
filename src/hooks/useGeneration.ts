import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArticleConfig } from '@/types';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { resetGenerationState } from '@/store/resetGenerationState';
import { runAnalysisPipeline } from './generation/useAnalysisPipeline';
import { runContentGeneration } from './generation/useContentGenerator';

const runAnalysisOnly = async (config: ArticleConfig) => {
  const generationStore = useGenerationStore.getState();

  // Reset State
  resetGenerationState();
  generationStore.setError(null);
  generationStore.setLastConfig(config);

  try {
    // 1. Analysis Phase
    const analysisResults = await runAnalysisPipeline(config);

    if (useGenerationStore.getState().isStopped) return;

    generationStore.setAnalysisResults(analysisResults);
    generationStore.setStatus('analysis_ready');
    generationStore.setGenerationStep('idle');
  } catch (err: any) {
    console.error(err);
    generationStore.setError(err.message || 'An unexpected error occurred during generation.');
    generationStore.setStatus('error');
    generationStore.setGenerationStep('idle');
  }
};

const runWritingPhase = async () => {
  const generationStore = useGenerationStore.getState();
  const analysisStore = useAnalysisStore.getState();
  const analysisResults = generationStore.analysisResults;
  // Fallback: If no lastConfig (e.g. strict synthesis mode), construct one from store
  const config =
    generationStore.lastConfig ||
    ({
      title: analysisStore.articleTitle,
      referenceContent: analysisStore.referenceContent || '',
      targetAudience: analysisStore.targetAudience,
      websiteType: 'General',
      authorityTerms: '',
    } as ArticleConfig);

  if (!analysisResults && !analysisStore.refAnalysis) {
    generationStore.setError('尚未完成分析，無法生成段落。請先執行分析或選擇存檔。');
    generationStore.setStatus('error');
    return;
  }

  // Check for accumulated analysis errors
  const missingData: string[] = [];
  if (!analysisStore.refAnalysis?.structure?.length) missingData.push('文章架構 (Structure)');
  if (!analysisStore.authAnalysis && !analysisResults?.structureResult?.authRes?.data)
    missingData.push('權威分析 (Authority)');
  if (!analysisStore.keywordPlans?.length) missingData.push('關鍵字規劃 (Keywords)');

  if (missingData.length > 0) {
    const confirmMsg = `偵測到部分分析資料缺失：\n${missingData.map((s) => `- ${s}`).join('\n')}\n\n是否仍要嘗試生成？(選擇「取消」將重新執行分析)`;
    if (!window.confirm(confirmMsg)) {
      generationStore.setStatus('idle');
      return;
    }
  }

  generationStore.setError(null);
  try {
    await runContentGeneration(config, analysisResults);
  } catch (err: any) {
    console.error(err);
    generationStore.setError(err?.message || '生成段落時發生錯誤，請重試。');
    generationStore.setStatus('error');
    generationStore.setGenerationStep('idle');
  }
};

export const useGeneration = () => {
  const mutation = useMutation({
    mutationFn: (config: ArticleConfig) => runAnalysisOnly(config),
  });

  const writeMutation = useMutation({
    mutationFn: () => runWritingPhase(),
  });

  const generate = useCallback(
    async (config: ArticleConfig) => {
      const genState = useGenerationStore.getState();
      const hasExistingAnalysis = !!genState.analysisResults;
      const hasExistingContent = (genState.content || '').trim().length > 0;

      if (hasExistingAnalysis || hasExistingContent) {
        const confirmed = window.confirm(
          '已經有分析結果或內容，重新分析會覆蓋目前的資料，確定要繼續嗎？'
        );
        if (!confirmed) return;
      }

      await mutation.mutateAsync(config);
    },
    [mutation]
  );

  const startWriting = useCallback(async () => {
    await writeMutation.mutateAsync();
  }, [writeMutation]);

  const stop = useCallback(() => {
    useGenerationStore.getState().stopGeneration();
  }, []);

  return { generate, startWriting, stop, status: mutation.status };
};
