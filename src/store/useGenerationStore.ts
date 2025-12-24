import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  ArticleConfig,
  GenerationStatus,
  GenerationStep,
  SectionGenerationResult,
  ImageAssetPlan,
} from '../types';

interface GenerationState {
  content: string;
  status: GenerationStatus;
  generationStep: GenerationStep;
  error: string | null;
  isStopped: boolean;
  analysisResults: { productResult: any; structureResult: any } | null;
  lastConfig: ArticleConfig | null;
  sectionResults: (SectionGenerationResult & { id: string })[];
  streamingQueue: { id: string; index: number; body: any }[];
  completedSections: string[];
  setStreamingQueue: (queue: { id: string; index: number; body: any }[]) => void;
  addToStreamingQueue: (item: { id: string; index: number; body: any }) => void;
  removeFromStreamingQueue: (id: string) => void;
  markSectionCompleted: (id: string) => void;
  setContent: (content: string | ((prev: string) => string)) => void;
  setStatus: (status: GenerationStatus) => void;
  setGenerationStep: (step: GenerationStep) => void;
  setError: (error: string | null) => void;
  setAnalysisResults: (results: { productResult: any; structureResult: any } | null) => void;
  setLastConfig: (config: ArticleConfig | null) => void;
  setSectionResults: (results: (SectionGenerationResult & { id: string })[]) => void;
  addSectionResult: (result: SectionGenerationResult & { id: string }) => void;
  updateSectionResult: (id: string, updates: Partial<SectionGenerationResult>) => void;
  imageAssetPlans: ImageAssetPlan[];
  stopGeneration: () => void;
  resetGeneration: () => void;
  setImageAssetPlans: (
    plans: ImageAssetPlan[] | ((prev: ImageAssetPlan[]) => ImageAssetPlan[])
  ) => void;
  updateImageAssetPlan: (id: string, updates: Partial<ImageAssetPlan>) => void;
  deleteImageAssetPlan: (id: string) => void;
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
      streamingQueue: [],
      completedSections: [],
      imageAssetPlans: [],
      setContent: (content) =>
        set((state) => ({
          content: typeof content === 'function' ? content(state.content) : content,
        })),
      setStreamingQueue: (queue) => set({ streamingQueue: queue }),
      addToStreamingQueue: (item) =>
        set((state) => ({ streamingQueue: [...state.streamingQueue, item] })),
      removeFromStreamingQueue: (id) =>
        set((state) => ({
          streamingQueue: state.streamingQueue.filter((item) => item.id !== id),
        })),
      markSectionCompleted: (id) =>
        set((state) => ({
          completedSections: [...state.completedSections, id],
        })),
      setStatus: (status) => set({ status }),
      setGenerationStep: (step) => set({ generationStep: step }),
      setError: (error) => set({ error }),
      setAnalysisResults: (results) => set({ analysisResults: results }),
      setLastConfig: (config) => set({ lastConfig: config }),
      stopGeneration: () => set({ isStopped: true, status: 'completed', generationStep: 'idle' }),
      resetGeneration: () =>
        set({
          content: '',
          status: 'idle',
          generationStep: 'idle',
          error: null,
          isStopped: false,
          analysisResults: null,
          lastConfig: null,
          sectionResults: [],
          streamingQueue: [],
          completedSections: [],
          imageAssetPlans: [],
        }),
      setImageAssetPlans: (plans) =>
        set((state) => ({
          imageAssetPlans: typeof plans === 'function' ? plans(state.imageAssetPlans) : plans,
        })),
      updateImageAssetPlan: (id, updates) =>
        set((state) => ({
          imageAssetPlans: state.imageAssetPlans.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),
      deleteImageAssetPlan: (id) =>
        set((state) => ({
          imageAssetPlans: state.imageAssetPlans.filter((p) => p.id !== id),
        })),
      setSectionResults: (results) => set({ sectionResults: results }),
      addSectionResult: (result) =>
        set((state) => ({
          sectionResults: [...state.sectionResults, result],
        })),
      updateSectionResult: (id, updates) =>
        set((state) => ({
          sectionResults: state.sectionResults.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),
    }),
    {
      name: 'pro_content_writer_generation',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => {
        const stripImages = (html: string) =>
          (html || '').replace(/src="data:image\/[^"]+"/g, 'src=""');

        return {
          content: stripImages(state.content),
          sectionResults: (state.sectionResults || []).map((r) => ({
            ...r,
            content: stripImages(r.content || ''),
            rawContent: stripImages(r.rawContent || ''),
            refinedContent: stripImages(r.refinedContent || ''),
          })),
          imageAssetPlans: (state.imageAssetPlans || []).map((p) => ({
            ...p,
            url: (p.url || '').startsWith('data:') ? '' : p.url,
          })),
        };
      },
    }
  )
);
