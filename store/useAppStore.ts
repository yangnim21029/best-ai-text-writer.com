import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    GenerationStatus,
    GenerationStep,
    ContentScore,
    KeywordActionPlan,
    ReferenceAnalysis,
    AuthorityAnalysis,
    ScrapedImage,
    TargetAudience,
    ProblemProductMapping,
    ProductBrief
} from '../types';

interface AppState {
    // Content & Status
    content: string;
    status: GenerationStatus;
    generationStep: GenerationStep;
    error: string | null;
    isStopped: boolean;

    // UI State
    showInput: boolean;
    showSidebar: boolean;
    showChangelog: boolean;
    inputType: 'text' | 'url';

    // Metrics
    contentScore: ContentScore;
    sessionCost: number;
    sessionTokens: number;

    // Analysis Data
    keywordPlans: KeywordActionPlan[];
    refAnalysis: ReferenceAnalysis | null;
    authAnalysis: AuthorityAnalysis | null;
    scrapedImages: ScrapedImage[];
    visualStyle: string;
    brandKnowledge: string;
    coveredPoints: string[];
    targetAudience: TargetAudience;
    productMapping: ProblemProductMapping[];
    activeProductBrief: ProductBrief | undefined;

    // Actions
    setContent: (content: string | ((prev: string) => string)) => void;
    setStatus: (status: GenerationStatus) => void;
    setGenerationStep: (step: GenerationStep) => void;
    setError: (error: string | null) => void;
    stopGeneration: () => void;
    resetGeneration: () => void;

    toggleInput: () => void;
    toggleSidebar: () => void;
    setShowChangelog: (show: boolean) => void;
    setInputType: (type: 'text' | 'url') => void;

    setContentScore: (score: ContentScore) => void;
    addCost: (cost: number, tokens: number) => void;
    resetSessionStats: () => void;

    setKeywordPlans: (plans: KeywordActionPlan[]) => void;
    setRefAnalysis: (analysis: ReferenceAnalysis | null) => void;
    setAuthAnalysis: (analysis: AuthorityAnalysis | null) => void;
    setScrapedImages: (images: ScrapedImage[]) => void;
    setVisualStyle: (style: string) => void;
    setBrandKnowledge: (knowledge: string) => void;
    setCoveredPoints: (points: string[] | ((prev: string[]) => string[])) => void;
    setTargetAudience: (audience: TargetAudience) => void;
    setProductMapping: (mapping: ProblemProductMapping[]) => void;
    setActiveProductBrief: (brief: ProductBrief | undefined) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // Initial State
            content: '',
            status: 'idle',
            generationStep: 'idle',
            error: null,
            isStopped: false,

            showInput: true,
            showSidebar: true,
            showChangelog: false,
            inputType: 'url',

            contentScore: { value: 0, label: 'Start Writing', color: 'text-gray-400' },
            sessionCost: 0,
            sessionTokens: 0,

            keywordPlans: [],
            refAnalysis: null,
            authAnalysis: null,
            scrapedImages: [],
            visualStyle: '',
            brandKnowledge: '',
            coveredPoints: [],
            targetAudience: 'zh-TW',
            productMapping: [],
            activeProductBrief: undefined,

            // Actions
            setContent: (content) => set((state) => ({
                content: typeof content === 'function' ? content(state.content) : content
            })),
            setStatus: (status) => set({ status }),
            setGenerationStep: (step) => set({ generationStep: step }),
            setError: (error) => set({ error }),
            stopGeneration: () => set({ isStopped: true, status: 'completed', generationStep: 'idle' }),
            resetGeneration: () => set({
                content: '',
                error: null,
                keywordPlans: [],
                refAnalysis: null,
                authAnalysis: null,
                coveredPoints: [],
                visualStyle: '',
                productMapping: [],
                activeProductBrief: undefined,
                sessionCost: 0,
                sessionTokens: 0,
                isStopped: false
            }),

            toggleInput: () => set((state) => ({ showInput: !state.showInput })),
            toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
            setShowChangelog: (show) => set({ showChangelog: show }),
            setInputType: (type) => set({ inputType: type }),

            setContentScore: (score) => set({ contentScore: score }),
            addCost: (cost, tokens) => set((state) => ({
                sessionCost: state.sessionCost + cost,
                sessionTokens: state.sessionTokens + tokens
            })),
            resetSessionStats: () => set({ sessionCost: 0, sessionTokens: 0 }),

            setKeywordPlans: (plans) => set({ keywordPlans: plans }),
            setRefAnalysis: (analysis) => set({ refAnalysis: analysis }),
            setAuthAnalysis: (analysis) => set({ authAnalysis: analysis }),
            setScrapedImages: (images) => set({ scrapedImages: images }),
            setVisualStyle: (style) => set({ visualStyle: style }),
            setBrandKnowledge: (knowledge) => set({ brandKnowledge: knowledge }),
            setCoveredPoints: (points) => set((state) => ({
                coveredPoints: typeof points === 'function' ? points(state.coveredPoints) : points
            })),
            setTargetAudience: (audience) => set({ targetAudience: audience }),
            setProductMapping: (mapping) => set({ productMapping: mapping }),
            setActiveProductBrief: (brief) => set({ activeProductBrief: brief }),
        }),
        {
            name: 'pro_content_writer_storage_v2', // New key for the refactored store
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // Select fields to persist
                content: state.content,
                showInput: state.showInput,
                showSidebar: state.showSidebar,
                inputType: state.inputType,
                sessionCost: state.sessionCost,
                sessionTokens: state.sessionTokens,
                keywordPlans: state.keywordPlans,
                refAnalysis: state.refAnalysis,
                authAnalysis: state.authAnalysis,
                scrapedImages: state.scrapedImages,
                visualStyle: state.visualStyle,
                brandKnowledge: state.brandKnowledge,
                coveredPoints: state.coveredPoints,
                targetAudience: state.targetAudience,
                // status, generationStep, error, isStopped are transient
            }),
        }
    )
);
