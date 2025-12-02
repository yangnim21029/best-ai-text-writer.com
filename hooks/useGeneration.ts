import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArticleConfig } from '../types';
import { useGenerationStore } from '../store/useGenerationStore';
import { resetGenerationState } from '../store/resetGenerationState';
import { runAnalysisPipeline } from './generation/useAnalysisPipeline';
import { runContentGeneration } from './generation/useContentGenerator';

const runGeneration = async (config: ArticleConfig) => {
    const generationStore = useGenerationStore.getState();

    // Reset State
    resetGenerationState();

    try {
        // 1. Analysis Phase
        const analysisResults = await runAnalysisPipeline(config);

        if (useGenerationStore.getState().isStopped) return;

        // 2. Content Generation Phase
        await runContentGeneration(config, analysisResults);

    } catch (err: any) {
        console.error(err);
        generationStore.setError(err.message || "An unexpected error occurred during generation.");
        generationStore.setStatus('error');
        generationStore.setGenerationStep('idle');
    }
};

export const useGeneration = () => {
    const mutation = useMutation({
        mutationFn: (config: ArticleConfig) => runGeneration(config),
    });

    const generate = useCallback(async (config: ArticleConfig) => {
        await mutation.mutateAsync(config);
    }, [mutation]);

    const stop = useCallback(() => {
        useGenerationStore.getState().stopGeneration();
    }, []);

    return { generate, stop, status: mutation.status };
};
