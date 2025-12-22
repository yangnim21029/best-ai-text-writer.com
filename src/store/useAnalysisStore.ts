import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  AnalysisDocument,
  AuthorityAnalysis,
  FrequentWordsPlacementAnalysis,
  ProblemProductMapping,
  ProductBrief,
  ReferenceAnalysis,
  ScrapedImage,
  TargetAudience,
} from '../types';

interface AnalysisState {
  keywordPlans: FrequentWordsPlacementAnalysis[];
  refAnalysis: ReferenceAnalysis | null;
  authAnalysis: AuthorityAnalysis | null;
  scrapedImages: ScrapedImage[];
  visualStyle: string;
  brandKnowledge: string;
  brandRagUrl: string;
  coveredPoints: string[];
  targetAudience: TargetAudience;
  productMapping: ProblemProductMapping[];
  activeProductBrief: ProductBrief | undefined;
  articleTitle: string;
  referenceContent: string;
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
    issues: {
      type: string;
      original: string;
      hkEquivalent: string;
      confidence: number;
      context: string;
    }[];
    suggestions: { original: string; rewritten: string }[];
  } | null;
  // NEW: Pending grounding for confirmation modal
  pendingGroundingResult: {
    issues: {
      type: string;
      original: string;
      regionEquivalent: string;
      confidence: number;
      context: string;
      selected: boolean;
    }[];
    rewrittenContent: string;
    regionLabel: string;
  } | null;
  showGroundingModal: boolean;
  // NEW: Localized plan stored separately
  localizedRefAnalysis: ReferenceAnalysis | null;
  analysisDocuments: AnalysisDocument[];
  selectedDocumentIds: string[];

  setKeywordPlans: (plans: FrequentWordsPlacementAnalysis[]) => void;
  setRefAnalysis: (analysis: ReferenceAnalysis | null) => void;
  setAuthAnalysis: (analysis: AuthorityAnalysis | null) => void;
  setScrapedImages: (images: ScrapedImage[]) => void;
  setVisualStyle: (style: string) => void;
  setBrandKnowledge: (knowledge: string) => void;
  setBrandRagUrl: (url: string) => void;
  setCoveredPoints: (points: string[] | ((prev: string[]) => string[])) => void;
  setTargetAudience: (audience: TargetAudience) => void;
  setProductMapping: (mapping: ProblemProductMapping[]) => void;
  setActiveProductBrief: (brief: ProductBrief | undefined) => void;
  setArticleTitle: (title: string) => void;
  setReferenceContent: (content: string) => void;
  setHeadingOptimizations: (
    items: {
      h2_before: string;
      h2_after: string;
      h2_reason?: string;
      h2_options?: { text: string; reason?: string; score?: number }[];
      needs_manual?: boolean;
      h3?: { h3_before: string; h3_after: string; h3_reason?: string }[];
    }[]
  ) => void;
  setLanguageInstruction: (instruction: string) => void;
  setHKGroundingResult: (result: AnalysisState['hkGroundingResult']) => void;
  setPendingGroundingResult: (result: AnalysisState['pendingGroundingResult']) => void;
  setShowGroundingModal: (show: boolean) => void;
  toggleGroundingIssueSelection: (index: number) => void;
  setLocalizedRefAnalysis: (analysis: ReferenceAnalysis | null) => void;
  saveCurrentToDocument: () => Promise<void>;
  loadAnalysisDocument: (id: string) => Promise<void>;
  setSelectedDocumentIds: (ids: string[]) => void;
  toggleDocumentSelection: (id: string) => void;
  deleteDocument: (id: string) => Promise<void>;
  loadDocumentsFromDb: () => Promise<void>;
  reset: () => void;
}

import { db } from '../db/analysisDb';

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set, get) => ({
      keywordPlans: [],
      refAnalysis: null,
      authAnalysis: null,
      scrapedImages: [],
      visualStyle: '',
      brandKnowledge: '',
      brandRagUrl: '',
      coveredPoints: [],
      targetAudience: 'zh-TW',
      productMapping: [],
      activeProductBrief: undefined,
      articleTitle: '',
      referenceContent: '',
      headingOptimizations: [],
      languageInstruction: '',
      hkGroundingResult: null,
      pendingGroundingResult: null,
      showGroundingModal: false,
      localizedRefAnalysis: null,
      analysisDocuments: [],
      selectedDocumentIds: [],

      setKeywordPlans: (plans) => set({ keywordPlans: plans }),
      setRefAnalysis: (analysis) => set({ refAnalysis: analysis }),
      setAuthAnalysis: (analysis) => set({ authAnalysis: analysis }),
      setScrapedImages: (images) => set({ scrapedImages: images }),
      setVisualStyle: (style) => set({ visualStyle: style }),
      setBrandKnowledge: (knowledge) => set({ brandKnowledge: knowledge }),
      setBrandRagUrl: (url) => set({ brandRagUrl: url }),
      setCoveredPoints: (points) =>
        set((state) => ({
          coveredPoints: typeof points === 'function' ? points(state.coveredPoints) : points,
        })),
      setTargetAudience: (audience) => set({ targetAudience: audience }),
      setProductMapping: (mapping) => set({ productMapping: mapping }),
      setActiveProductBrief: (brief) => set({ activeProductBrief: brief }),
      setArticleTitle: (title) => set({ articleTitle: title }),
      setReferenceContent: (content) => set({ referenceContent: content }),
      setHeadingOptimizations: (items) => set({ headingOptimizations: items }),
      setLanguageInstruction: (instruction) => set({ languageInstruction: instruction }),
      setHKGroundingResult: (result) => set({ hkGroundingResult: result }),
      setPendingGroundingResult: (result) => set({ pendingGroundingResult: result }),
      setShowGroundingModal: (show) => set({ showGroundingModal: show }),
      toggleGroundingIssueSelection: (index) =>
        set((state) => {
          if (!state.pendingGroundingResult) return state;
          const newIssues = state.pendingGroundingResult.issues.map((issue, i) =>
            i === index ? { ...issue, selected: !issue.selected } : issue
          );
          return {
            pendingGroundingResult: {
              ...state.pendingGroundingResult,
              issues: newIssues,
            },
          };
        }),
      setLocalizedRefAnalysis: (analysis) => set({ localizedRefAnalysis: analysis }),
      saveCurrentToDocument: async () => {
        const state = get();
        if (!state.refAnalysis && state.keywordPlans.length === 0) return;
        const newDoc: AnalysisDocument = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          title: state.articleTitle || `Analysis ${new Date().toLocaleString()}`,
          keywordPlans: [...state.keywordPlans],
          refAnalysis: state.refAnalysis ? { ...state.refAnalysis } : null,
          authAnalysis: state.authAnalysis ? { ...state.authAnalysis } : null,
          visualStyle: state.visualStyle,
          productMapping: [...state.productMapping],
          productBrief: state.activeProductBrief ? { ...state.activeProductBrief } : undefined,
          targetAudience: state.targetAudience,
          languageInstruction: state.languageInstruction,
          sourceContent: state.referenceContent,
          brandRagUrl: state.brandRagUrl,
        };

        await db.documents.add(newDoc);
        const allDocs = await db.documents.orderBy('timestamp').reverse().toArray();
        set({
          analysisDocuments: allDocs,
          selectedDocumentIds: [newDoc.id],
        });
      },
      loadAnalysisDocument: async (id: string) => {
        const doc = await db.documents.get(id);
        if (!doc) return;

        set({
          articleTitle: doc.title,
          keywordPlans: doc.keywordPlans,
          refAnalysis: doc.refAnalysis,
          authAnalysis: doc.authAnalysis,
          visualStyle: doc.visualStyle,
          productMapping: doc.productMapping,
          activeProductBrief: doc.productBrief,
          targetAudience: doc.targetAudience,
          languageInstruction: doc.languageInstruction,
          referenceContent: doc.sourceContent,
          brandRagUrl: doc.brandRagUrl,
          // Keep existing generic state or reset it?
          // Usually loading a doc implies full restoration.
        });
      },
      setSelectedDocumentIds: (ids) => set({ selectedDocumentIds: ids }),
      toggleDocumentSelection: (id) =>
        set((state) => {
          const ids = state.selectedDocumentIds.includes(id)
            ? state.selectedDocumentIds.filter((i) => i !== id)
            : [...state.selectedDocumentIds, id];
          return { selectedDocumentIds: ids };
        }),
      deleteDocument: async (id) => {
        await db.documents.delete(id);
        const allDocs = await db.documents.orderBy('timestamp').reverse().toArray();
        set((state) => ({
          analysisDocuments: allDocs,
          selectedDocumentIds: state.selectedDocumentIds.filter((i) => i !== id),
        }));
      },
      loadDocumentsFromDb: async () => {
        const allDocs = await db.documents.orderBy('timestamp').reverse().toArray();
        set({ analysisDocuments: allDocs });
      },
      reset: () =>
        set({
          keywordPlans: [],
          refAnalysis: null,
          authAnalysis: null,
          scrapedImages: [],
          visualStyle: '',
          brandKnowledge: '',
          brandRagUrl: '',
          coveredPoints: [],
          // targetAudience: 'zh-TW', // Keep audience
          productMapping: [],
          activeProductBrief: undefined,
          articleTitle: '',
          referenceContent: '',
          headingOptimizations: [],
          languageInstruction: '',
          hkGroundingResult: null,
          pendingGroundingResult: null,
          showGroundingModal: false,
          localizedRefAnalysis: null,
          selectedDocumentIds: [],
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
        brandRagUrl: state.brandRagUrl,
        coveredPoints: state.coveredPoints,
        targetAudience: state.targetAudience,
        articleTitle: state.articleTitle,
        headingOptimizations: state.headingOptimizations,
        languageInstruction: state.languageInstruction,
        productMapping: state.productMapping,
        activeProductBrief: state.activeProductBrief,
        localizedRefAnalysis: state.localizedRefAnalysis,
        selectedDocumentIds: state.selectedDocumentIds,
      }),
    }
  )
);
