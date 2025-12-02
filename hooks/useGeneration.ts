import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArticleConfig } from '../types';
import { useGenerationStore } from '../store/useGenerationStore';
import { resetGenerationState } from '../store/resetGenerationState';
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
        generationStore.setError(err.message || "An unexpected error occurred during generation.");
        generationStore.setStatus('error');
        generationStore.setGenerationStep('idle');
    }
};

const runWritingPhase = async () => {
    const generationStore = useGenerationStore.getState();
    const analysisResults = generationStore.analysisResults;
    const config = generationStore.lastConfig;

    if (!analysisResults || !config) {
        generationStore.setError('尚未完成分析，無法生成段落。請先執行分析。');
        generationStore.setStatus('error');
        return;
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

    const generate = useCallback(async (config: ArticleConfig) => {
        await mutation.mutateAsync(config);
    }, [mutation]);

    const startWriting = useCallback(async () => {
        await writeMutation.mutateAsync();
    }, [writeMutation]);

    const stop = useCallback(() => {
        useGenerationStore.getState().stopGeneration();
    }, []);

    return { generate, startWriting, stop, status: mutation.status };
};
