import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ArticleConfig, GenerationStatus, GenerationStep } from '../types';

interface GenerationState {
    content: string;
    status: GenerationStatus;
    generationStep: GenerationStep;
    error: string | null;
    isStopped: boolean;
    analysisResults: { productResult: any; structureResult: any } | null;
    lastConfig: ArticleConfig | null;
    setContent: (content: string | ((prev: string) => string)) => void;
    setStatus: (status: GenerationStatus) => void;
    setGenerationStep: (step: GenerationStep) => void;
    setError: (error: string | null) => void;
    setAnalysisResults: (results: { productResult: any; structureResult: any } | null) => void;
    setLastConfig: (config: ArticleConfig | null) => void;
    stopGeneration: () => void;
    resetGeneration: () => void;
}

export const useGenerationStore = create<GenerationState>()(
    persist(
        (set) => ({
            content: '',
            status: 'idle',
            generationStep: 'idle',
            error: null,
            isStopped: false,
            analysisResults: null,
            lastConfig: null,
            setContent: (content) => set((state) => ({
                content: typeof content === 'function' ? content(state.content) : content
            })),
            setStatus: (status) => set({ status }),
            setGenerationStep: (step) => set({ generationStep: step }),
            setError: (error) => set({ error }),
            setAnalysisResults: (results) => set({ analysisResults: results }),
            setLastConfig: (config) => set({ lastConfig: config }),
            stopGeneration: () => set({ isStopped: true, status: 'completed', generationStep: 'idle' }),
            resetGeneration: () => set({
                content: '',
                status: 'idle',
                generationStep: 'idle',
                error: null,
                isStopped: false,
                analysisResults: null,
                lastConfig: null
            }),
        }),
        {
            name: 'pro_content_writer_generation',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                content: state.content,
            }),
        }
    )
);
