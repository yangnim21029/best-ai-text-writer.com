import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    AuthorityAnalysis,
    KeywordActionPlan,
    ProblemProductMapping,
    ProductBrief,
    ReferenceAnalysis,
    ScrapedImage,
    TargetAudience
} from '../types';

interface AnalysisState {
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
    articleTitle: string;
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
    setArticleTitle: (title: string) => void;
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
            }),
        }
    )
);
