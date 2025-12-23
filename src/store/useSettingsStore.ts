import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from './useAppStore';

export const useSettingsStore = () => {
  return useAppStore(
    useShallow((state) => ({
      modelFlash: state.modelFlash,
      modelImage: state.modelImage,
      keywordCharDivisor: state.keywordCharDivisor,
      minKeywords: state.minKeywords,
      maxKeywords: state.maxKeywords,
      defaultModelAppearance: state.defaultModelAppearance,
      defaultDesignStyle: state.defaultDesignStyle,
      useRag: state.useRag,
      autoImagePlan: state.autoImagePlan,

      setModelFlash: state.setModelFlash,
      setModelImage: state.setModelImage,
      setKeywordCharDivisor: state.setKeywordCharDivisor,
      setMinKeywords: state.setMinKeywords,
      setMaxKeywords: state.setMaxKeywords,
      setDefaultModelAppearance: state.setDefaultModelAppearance,
      setDefaultDesignStyle: state.setDefaultDesignStyle,
      setUseRag: state.setUseRag,
      setAutoImagePlan: state.setAutoImagePlan,
      resetSettings: state.resetSettings,
    }))
  );
};
