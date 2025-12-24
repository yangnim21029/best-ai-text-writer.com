import { useState } from 'react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { useAppStore } from '@/store/useAppStore';
import { localizePlanAction } from '@/app/actions/analysis';

export const usePlanLocalization = () => {
  const [isLocalizingPlan, setIsLocalizingPlan] = useState(false);
  const analysisStore = useAnalysisStore();
  const app = useAppStore();

  const handleLocalizePlan = async () => {
    const current = analysisStore.refAnalysis;
    if (!current) return;

    setIsLocalizingPlan(true);
    try {
      const result = await localizePlanAction(current, analysisStore.targetAudience);

      app.addCost(result.cost.totalCost, result.usage.totalTokens);

      analysisStore.setLocalizedRefAnalysis({
        ...current,
        structure: result.localizedSections,
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
