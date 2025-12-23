import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from './useAppStore';

export const useUIStore = () => {
  return useAppStore(
    useShallow((state) => ({
      showInput: state.showInput,
      showSidebar: state.showSidebar,
      showChangelog: state.showChangelog,
      showPlanModal: state.showPlanModal,
      showSettings: state.showSettings,
      inputType: state.inputType,
      displayScale: state.displayScale,

      toggleInput: state.toggleInput,
      toggleSidebar: state.toggleSidebar,
      setShowSidebar: state.setShowSidebar,
      setShowChangelog: state.setShowChangelog,
      setShowPlanModal: state.setShowPlanModal,
      setShowSettings: state.setShowSettings,
      setInputType: state.setInputType,
      setDisplayScale: state.setDisplayScale,
    }))
  );
};
