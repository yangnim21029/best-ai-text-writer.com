import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { ContentScore } from '../types';

interface MetricsState {
    contentScore: ContentScore;
    sessionCost: number;
    sessionTokens: number;
    setContentScore: (score: ContentScore) => void;
    addCost: (cost: number, tokens: number) => void;
    resetSessionStats: () => void;
}

export const useMetricsStore = create<MetricsState>()(
    persist(
        (set) => ({
            contentScore: { value: 0, label: 'Start Writing', color: 'text-gray-400' },
            sessionCost: 0,
            sessionTokens: 0,
            setContentScore: (score) => set({ contentScore: score }),
            addCost: (cost, tokens) => set((state) => ({
                sessionCost: Number(state.sessionCost || 0) + Number(cost || 0),
                sessionTokens: Number(state.sessionTokens || 0) + Number(tokens || 0)
            })),
            resetSessionStats: () => set({ sessionCost: 0, sessionTokens: 0 }),
        }),
        {
            name: 'pro_content_writer_metrics',
            storage: createJSONStorage(() => localStorage),
            merge: (persisted, current) => {
                const typed = persisted as Partial<MetricsState> | undefined;
                return {
                    ...current,
                    ...typed,
                    sessionCost: Number(typed?.sessionCost ?? current.sessionCost ?? 0),
                    sessionTokens: Number(typed?.sessionTokens ?? current.sessionTokens ?? 0),
                };
            },
            partialize: (state) => ({
                sessionCost: state.sessionCost,
                sessionTokens: state.sessionTokens,
            }),
        }
    )
);
