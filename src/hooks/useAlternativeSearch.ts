import { useState } from 'react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { useAppStore } from '@/store/useAppStore';
import { findRegionEquivalentsAction } from '@/app/actions/analysis';

export const useAlternativeSearch = () => {
  const [isSearchingAlternatives, setIsSearchingAlternatives] = useState(false);
  const analysisStore = useAnalysisStore();
  const app = useAppStore();

  const handleSearchLocalAlternatives = async () => {
    const refAnalysis = analysisStore.refAnalysis;
    if (!refAnalysis) return;

    const entities = [
      ...(refAnalysis.competitorBrands || []).map((b) => ({
        text: b,
        type: 'brand' as const,
        region: 'OTHER',
      })),
      ...(refAnalysis.competitorProducts || []).map((p) => ({
        text: p,
        type: 'service' as const,
        region: 'OTHER',
      })),
    ];

    if (entities.length === 0) return;

    setIsSearchingAlternatives(true);
    try {
      const res = await findRegionEquivalentsAction(entities, analysisStore.targetAudience);
      
      const result = res.mappings;
      if (!result) return;

      app.addCost(res.cost.totalCost, res.usage.totalTokens);

      if (result.length > 0) {
        const existingReplacements = refAnalysis.regionalReplacements || [];
        const newReplacements = result.map((m) => ({
          original: m.original,
          replacement: m.regionEquivalent,
          reason: m.context,
        }));

        const mergedReplacements = [...existingReplacements];
        newReplacements.forEach((nr) => {
          if (!mergedReplacements.some((er) => er.original === nr.original)) {
            mergedReplacements.push(nr);
          }
        });

        analysisStore.setRefAnalysis({ ...refAnalysis, regionalReplacements: mergedReplacements });
      }
    } catch (error) {
      console.error('[App] Search local alternatives failed', error);
    } finally {
      setIsSearchingAlternatives(false);
    }
  };

  return {
    isSearchingAlternatives,
    handleSearchLocalAlternatives,
  };
};
