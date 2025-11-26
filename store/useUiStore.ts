import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UiState {
    showInput: boolean;
    showSidebar: boolean;
    showChangelog: boolean;
    inputType: 'text' | 'url';
    displayScale: number;
    toggleInput: () => void;
    toggleSidebar: () => void;
    setShowChangelog: (show: boolean) => void;
    setInputType: (type: 'text' | 'url') => void;
    setDisplayScale: (scale: number) => void;
}

export const useUiStore = create<UiState>()(
    persist(
        (set) => ({
            showInput: true,
            showSidebar: true,
            showChangelog: false,
            inputType: 'url',
            displayScale: 1.1,
            toggleInput: () => set((state) => ({ showInput: !state.showInput })),
            toggleSidebar: () => set((state) => ({ showSidebar: !state.showSidebar })),
            setShowChangelog: (show) => set({ showChangelog: show }),
            setInputType: (type) => set({ inputType: type }),
            setDisplayScale: (scale) => set({ displayScale: scale }),
        }),
        {
            name: 'pro_content_writer_ui',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                showInput: state.showInput,
                showSidebar: state.showSidebar,
                inputType: state.inputType,
                displayScale: state.displayScale,
            }),
        }
    )
);
