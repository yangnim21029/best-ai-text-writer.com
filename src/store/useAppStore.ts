import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ContentScore, SavedProfile, ScrapedImage } from '@/types';
import { MODEL, KEYWORD_CHAR_DIVISOR, MIN_KEYWORDS, SEMANTIC_KEYWORD_LIMIT } from '@/config/constants';

interface AppState {
    // UI Slice
    showInput: boolean;
    showSidebar: boolean;
    showChangelog: boolean;
    showPlanModal: boolean;
    showSettings: boolean;
    inputType: 'text' | 'url';
    displayScale: number;

    // Metrics Slice
    contentScore: ContentScore;
    sessionCost: number;
    sessionTokens: number;

    // Settings Slice
    modelFlash: string;
    modelImage: string;
    keywordCharDivisor: number;
    minKeywords: number;
    maxKeywords: number;
    defaultModelAppearance: string;
    defaultDesignStyle: string;
    useRag: boolean;
    autoImagePlan: boolean;

    // Profile Slice
    savedProfiles: SavedProfile[];
    activeProfile: SavedProfile | null;

    // Actions
    toggleInput: () => void;
    toggleSidebar: () => void;
    setShowSidebar: (show: boolean) => void;
    setShowChangelog: (show: boolean) => void;
    setShowPlanModal: (show: boolean) => void;
    setShowSettings: (show: boolean) => void;
    setInputType: (type: 'text' | 'url') => void;
    setDisplayScale: (scale: number) => void;

    setContentScore: (score: ContentScore) => void;
    addCost: (cost: number, tokens: number) => void;
    resetSessionStats: () => void;

    setModelFlash: (model: string) => void;
    setModelImage: (model: string) => void;
    setKeywordCharDivisor: (divisor: number) => void;
    setMinKeywords: (min: number) => void;
    setMaxKeywords: (max: number) => void;
    setDefaultModelAppearance: (appearance: string) => void;
    setDefaultDesignStyle: (style: string) => void;
    setUseRag: (use: boolean) => void;
    setAutoImagePlan: (auto: boolean) => void;
    resetSettings: () => void;

    setSavedProfiles: (profiles: SavedProfile[]) => void;
    setActiveProfile: (profile: SavedProfile | null) => void;
    addProfile: (profile: SavedProfile) => void;
    updateProfile: (profile: SavedProfile) => void;
    deleteProfile: (id: string) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            // Defaults
            showInput: true,
            showSidebar: true,
            showChangelog: false,
            showPlanModal: false,
            showSettings: false,
            inputType: 'url',
            displayScale: 1.1,

            contentScore: { value: 0, label: 'Start Writing', color: 'text-gray-400' },
            sessionCost: 0,
            sessionTokens: 0,

            modelFlash: MODEL.FLASH,
            modelImage: MODEL.IMAGE_PREVIEW,
            keywordCharDivisor: KEYWORD_CHAR_DIVISOR,
            minKeywords: MIN_KEYWORDS,
            maxKeywords: SEMANTIC_KEYWORD_LIMIT,
            defaultModelAppearance: 'Asian female, professional attire, natural lighting, high quality photography',
            defaultDesignStyle: 'Minimalist, flat design, clean lines, professional corporate color palette, high resolution infographic style',
            useRag: true,
            autoImagePlan: true,

            savedProfiles: [],
            activeProfile: null,

            // Actions
            toggleInput: () => set((state) => ({ showInput: !state.showInput })),
            toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
            setShowSidebar: (show) => set({ showSidebar: show }),
            setShowChangelog: (show) => set({ showChangelog: show }),
            setShowPlanModal: (show) => set({ showPlanModal: show }),
            setShowSettings: (show) => set({ showSettings: show }),
            setInputType: (type) => set({ inputType: type }),
            setDisplayScale: (scale) => set({ displayScale: scale }),

            setContentScore: (score) => set({ contentScore: score }),
            addCost: (cost, tokens) => set((state) => ({
                sessionCost: Number(state.sessionCost || 0) + Number(cost || 0),
                sessionTokens: Number(state.sessionTokens || 0) + Number(tokens || 0)
            })),
            resetSessionStats: () => set({ sessionCost: 0, sessionTokens: 0 }),

            setModelFlash: (model) => set({ modelFlash: model }),
            setModelImage: (model) => set({ modelImage: model }),
            setKeywordCharDivisor: (divisor) => set({ keywordCharDivisor: divisor }),
            setMinKeywords: (min) => set({ minKeywords: min }),
            setMaxKeywords: (max) => set({ maxKeywords: max }),
            setDefaultModelAppearance: (appearance) => set({ defaultModelAppearance: appearance }),
            setDefaultDesignStyle: (style) => set({ defaultDesignStyle: style }),
            setUseRag: (use) => set({ useRag: use }),
            setAutoImagePlan: (auto) => set({ autoImagePlan: auto }),
            resetSettings: () => set({
                modelFlash: MODEL.FLASH,
                modelImage: MODEL.IMAGE_PREVIEW,
                keywordCharDivisor: KEYWORD_CHAR_DIVISOR,
                minKeywords: MIN_KEYWORDS,
                maxKeywords: SEMANTIC_KEYWORD_LIMIT,
                defaultModelAppearance: 'Asian female, professional attire, natural lighting, high quality photography',
                defaultDesignStyle: 'Minimalist, flat design, clean lines, professional corporate color palette, high resolution infographic style',
                useRag: true,
                autoImagePlan: true,
            }),

            setSavedProfiles: (profiles) => set({ savedProfiles: profiles }),
            setActiveProfile: (profile) => set({ activeProfile: profile }),
            addProfile: (profile) => set((state) => ({
                savedProfiles: [...state.savedProfiles, profile],
                activeProfile: profile
            })),
            updateProfile: (updatedProfile) => set((state) => ({
                savedProfiles: state.savedProfiles.map((p) =>
                    p.id === updatedProfile.id ? updatedProfile : p
                ),
                activeProfile: state.activeProfile?.id === updatedProfile.id ? updatedProfile : state.activeProfile
            })),
            deleteProfile: (id) => set((state) => ({
                savedProfiles: state.savedProfiles.filter((p) => p.id !== id),
                activeProfile: state.activeProfile?.id === id ? null : state.activeProfile
            })),
        }),
        {
            name: 'pro_content_writer_app_v1',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
