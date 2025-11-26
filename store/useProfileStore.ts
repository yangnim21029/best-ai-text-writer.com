import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { SavedProfile } from '../types';

interface ProfileState {
    savedProfiles: SavedProfile[];
    activeProfile: SavedProfile | null;

    // Actions
    setSavedProfiles: (profiles: SavedProfile[]) => void;
    setActiveProfile: (profile: SavedProfile | null) => void;
    addProfile: (profile: SavedProfile) => void;
    updateProfile: (profile: SavedProfile) => void;
    deleteProfile: (id: string) => void;
}

export const useProfileStore = create<ProfileState>()(
    persist(
        (set) => ({
            savedProfiles: [],
            activeProfile: null,

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
            name: 'pro_content_writer_profiles_v1', // Keep existing key to preserve user data
            storage: createJSONStorage(() => localStorage),
        }
    )
);
