import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from './useAppStore';

export const useProfileStore = () => {
  return useAppStore(
    useShallow((state) => ({
      savedProfiles: state.savedProfiles,
      savedVoiceProfiles: state.savedVoiceProfiles,
      activeProfile: state.activeProfile,
      savedPages: state.savedPages,
      activePageId: state.activePageId,
      visualProfiles: state.visualProfiles,

      setSavedProfiles: state.setSavedProfiles,
      setActiveProfile: state.setActiveProfile,
      addProfile: state.addProfile,
      updateProfile: state.updateProfile,
      deleteProfile: state.deleteProfile,

      setSavedPages: state.setSavedPages,
      setActivePageId: state.setActivePageId,

      setVisualProfiles: state.setVisualProfiles,
      addVisualProfile: state.addVisualProfile,
      updateVisualProfile: state.updateVisualProfile,
      deleteVisualProfile: state.deleteVisualProfile,

      setSavedVoiceProfiles: state.setSavedVoiceProfiles,
    }))
  );
};
