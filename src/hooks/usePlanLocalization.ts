import { useState } from 'react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { useAppStore } from '@/store/useAppStore';
import { localizePlanWithAI } from '@/services/research/regionalService';

export const usePlanLocalization = () => {
  const [isLocalizingPlan, setIsLocalizingPlan] = useState(false);
  const analysisStore = useAnalysisStore();
  const app = useAppStore();

  const handleLocalizePlan = async () => {
    const current = analysisStore.refAnalysis;
    if (!current) return;

    setIsLocalizingPlan(true);
    try {
      const result = await localizePlanWithAI(
        {
          generalPlan: current.generalPlan || [],
          conversionPlan: current.conversionPlan || [],
          sections: current.structure,
          humanWritingVoice: current.humanWritingVoice,
        },
        current.regionalReplacements || [],
        analysisStore.targetAudience
      );

      app.addCost(result.cost.totalCost, result.usage.totalTokens);

      const localizedStructure = current.structure.map((original, idx) => ({
        ...original,
        ...result.localizedSections[idx],
      }));

      analysisStore.setLocalizedRefAnalysis({
        ...current,
        structure: localizedStructure,
        generalPlan: result.localizedGeneralPlan,
        conversionPlan: result.localizedConversionPlan,
        humanWritingVoice: result.localizedHumanWritingVoice,
      });
    } catch (error) {
      console.error('[App] AI Plan localization failed', error);
    } finally {
      setIsLocalizingPlan(false);
    }
  };

  return {
    isLocalizingPlan,
    handleLocalizePlan,
  };
};
