import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    AuthorityAnalysis,
    FrequentWordsPlacementAnalysis,
    ProblemProductMapping,
    ProductBrief,
    ReferenceAnalysis,
    ScrapedImage,
    TargetAudience
} from '../types';

interface AnalysisState {
    keywordPlans: FrequentWordsPlacementAnalysis[];
    refAnalysis: ReferenceAnalysis | null;
    authAnalysis: AuthorityAnalysis | null;
    scrapedImages: ScrapedImage[];
    visualStyle: string;
    brandKnowledge: string;
    coveredPoints: string[];
    targetAudience: TargetAudience;
    productMapping: ProblemProductMapping[];
    activeProductBrief: ProductBrief | undefined;
    articleTitle: string;
    headingOptimizations: {
        h2_before: string;
        h2_after: string;
        h2_reason?: string;
        h2_options?: { text: string; reason?: string; score?: number }[];
        needs_manual?: boolean;
        h3?: { h3_before: string; h3_after: string; h3_reason?: string }[];
    }[];
    languageInstruction: string;
    hkGroundingResult: {
        isHKRelevant: boolean;
        relevanceScore: number;
        issues: { type: string; original: string; hkEquivalent: string; confidence: number; context: string }[];
        suggestions: { original: string; rewritten: string }[];
    } | null;
    // NEW: Pending grounding for confirmation modal
    pendingGroundingResult: {
        issues: { type: string; original: string; regionEquivalent: string; confidence: number; context: string; selected: boolean }[];
        rewrittenContent: string;
        regionLabel: string;
    } | null;
    showGroundingModal: boolean;
    setKeywordPlans: (plans: FrequentWordsPlacementAnalysis[]) => void;
    setRefAnalysis: (analysis: ReferenceAnalysis | null) => void;
    setAuthAnalysis: (analysis: AuthorityAnalysis | null) => void;
    setScrapedImages: (images: ScrapedImage[]) => void;
    setVisualStyle: (style: string) => void;
    setBrandKnowledge: (knowledge: string) => void;
    setCoveredPoints: (points: string[] | ((prev: string[]) => string[])) => void;
    setTargetAudience: (audience: TargetAudience) => void;
    setProductMapping: (mapping: ProblemProductMapping[]) => void;
    setActiveProductBrief: (brief: ProductBrief | undefined) => void;
    setArticleTitle: (title: string) => void;
    setHeadingOptimizations: (items: {
        h2_before: string;
        h2_after: string;
        h2_reason?: string;
        h2_options?: { text: string; reason?: string; score?: number }[];
        needs_manual?: boolean;
        h3?: { h3_before: string; h3_after: string; h3_reason?: string }[];
    }[]) => void;
    setLanguageInstruction: (instruction: string) => void;
    setHKGroundingResult: (result: AnalysisState['hkGroundingResult']) => void;
    // NEW: Pending grounding actions
    setPendingGroundingResult: (result: AnalysisState['pendingGroundingResult']) => void;
    setShowGroundingModal: (show: boolean) => void;
    toggleGroundingIssueSelection: (index: number) => void;
    reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>()(
    persist(
        (set) => ({
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
            articleTitle: '',
            headingOptimizations: [],
            languageInstruction: '',
            hkGroundingResult: null,
            pendingGroundingResult: null,
            showGroundingModal: false,
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
            setArticleTitle: (title) => set({ articleTitle: title }),
            setHeadingOptimizations: (items) => set({ headingOptimizations: items }),
            setLanguageInstruction: (instruction) => set({ languageInstruction: instruction }),
            setHKGroundingResult: (result) => set({ hkGroundingResult: result }),
            setPendingGroundingResult: (result) => set({ pendingGroundingResult: result }),
            setShowGroundingModal: (show) => set({ showGroundingModal: show }),
            toggleGroundingIssueSelection: (index) => set((state) => {
                if (!state.pendingGroundingResult) return state;
                const newIssues = state.pendingGroundingResult.issues.map((issue, i) =>
                    i === index ? { ...issue, selected: !issue.selected } : issue
                );
                return {
                    pendingGroundingResult: {
                        ...state.pendingGroundingResult,
                        issues: newIssues
                    }
                };
            }),
            reset: () => set({
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
                articleTitle: '',
                headingOptimizations: [],
                languageInstruction: '',
                hkGroundingResult: null,
                pendingGroundingResult: null,
                showGroundingModal: false,
            }),
        }),
        {
            name: 'pro_content_writer_analysis',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                keywordPlans: state.keywordPlans,
                refAnalysis: state.refAnalysis,
                authAnalysis: state.authAnalysis,
                scrapedImages: state.scrapedImages,
                visualStyle: state.visualStyle,
                brandKnowledge: state.brandKnowledge,
                coveredPoints: state.coveredPoints,
                targetAudience: state.targetAudience,
                articleTitle: state.articleTitle,
                headingOptimizations: state.headingOptimizations,
                languageInstruction: state.languageInstruction,
                productMapping: state.productMapping,
                activeProductBrief: state.activeProductBrief,
            }),
        }
    )
);
