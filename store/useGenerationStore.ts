import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { GenerationStatus, GenerationStep } from '../types';

interface GenerationState {
    content: string;
    status: GenerationStatus;
    generationStep: GenerationStep;
    error: string | null;
    isStopped: boolean;
    setContent: (content: string | ((prev: string) => string)) => void;
    setStatus: (status: GenerationStatus) => void;
    setGenerationStep: (step: GenerationStep) => void;
    setError: (error: string | null) => void;
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
            setContent: (content) => set((state) => ({
                content: typeof content === 'function' ? content(state.content) : content
            })),
            setStatus: (status) => set({ status }),
            setGenerationStep: (step) => set({ generationStep: step }),
            setError: (error) => set({ error }),
            stopGeneration: () => set({ isStopped: true, status: 'completed', generationStep: 'idle' }),
            resetGeneration: () => set({
                content: '',
                status: 'idle',
                generationStep: 'idle',
                error: null,
                isStopped: false
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
