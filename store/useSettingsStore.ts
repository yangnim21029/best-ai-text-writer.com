import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MODEL, KEYWORD_CHAR_DIVISOR, MIN_KEYWORDS, SEMANTIC_KEYWORD_LIMIT } from '../config/constants';

interface SettingsState {
    modelFlash: string;
    modelImage: string;
    keywordCharDivisor: number;
    minKeywords: number;
    maxKeywords: number;

    // Actions
    setModelFlash: (model: string) => void;
    setModelImage: (model: string) => void;
    setKeywordCharDivisor: (divisor: number) => void;
    setMinKeywords: (min: number) => void;
    setMaxKeywords: (max: number) => void;

    // Reset
    resetToDefaults: () => void;
}

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            modelFlash: MODEL.FLASH,
            modelImage: MODEL.IMAGE_PREVIEW,
            keywordCharDivisor: KEYWORD_CHAR_DIVISOR,
            minKeywords: MIN_KEYWORDS,
            maxKeywords: SEMANTIC_KEYWORD_LIMIT,

            setModelFlash: (model) => set({ modelFlash: model }),
            setModelImage: (model) => set({ modelImage: model }),
            setKeywordCharDivisor: (divisor) => set({ keywordCharDivisor: divisor }),
            setMinKeywords: (min) => set({ minKeywords: min }),
            setMaxKeywords: (max) => set({ maxKeywords: max }),

            resetToDefaults: () => set({
                modelFlash: MODEL.FLASH,
                modelImage: MODEL.IMAGE_PREVIEW,
                keywordCharDivisor: KEYWORD_CHAR_DIVISOR,
                minKeywords: MIN_KEYWORDS,
                maxKeywords: SEMANTIC_KEYWORD_LIMIT,
            }),
        }),
        {
            name: 'pro_content_writer_settings',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
