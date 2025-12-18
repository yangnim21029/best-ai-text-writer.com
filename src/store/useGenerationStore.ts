import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ArticleConfig, GenerationStatus, GenerationStep, SectionGenerationResult } from '../types';

interface GenerationState {
    content: string;
    status: GenerationStatus;
    generationStep: GenerationStep;
    error: string | null;
    isStopped: boolean;
    analysisResults: { productResult: any; structureResult: any } | null;
    lastConfig: ArticleConfig | null;
    sectionResults: (SectionGenerationResult & { id: string })[];
    setContent: (content: string | ((prev: string) => string)) => void;
    setStatus: (status: GenerationStatus) => void;
    setGenerationStep: (step: GenerationStep) => void;
    setError: (error: string | null) => void;
    setAnalysisResults: (results: { productResult: any; structureResult: any } | null) => void;
    setLastConfig: (config: ArticleConfig | null) => void;
    setSectionResults: (results: (SectionGenerationResult & { id: string })[]) => void;
    addSectionResult: (result: SectionGenerationResult & { id: string }) => void;
    updateSectionResult: (id: string, updates: Partial<SectionGenerationResult>) => void;
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
            sectionResults: [],
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
                lastConfig: null,
                sectionResults: []
            }),
            setSectionResults: (results) => set({ sectionResults: results }),
            addSectionResult: (result) => set((state) => ({
                sectionResults: [...state.sectionResults, result]
            })),
            updateSectionResult: (id, updates) => set((state) => ({
                sectionResults: state.sectionResults.map(r => r.id === id ? { ...r, ...updates } : r)
            })),
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
