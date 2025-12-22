import { useEffect, useMemo } from 'react';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { useAppStore } from '@/store/useAppStore';

export function useContentScore() {
  const generationStore = useGenerationStore();
  const analysisStore = useAnalysisStore();
  const { contentScore, setContentScore } = useAppStore();

  const structurePoints = useMemo(() => {
    const structure = analysisStore.refAnalysis?.structure || [];
    const general = new Set<string>();
    const brand = new Set<string>();
    const legacyGeneral = Array.isArray(analysisStore.refAnalysis?.keyInformationPoints)
      ? analysisStore.refAnalysis?.keyInformationPoints
      : [];
    const legacyBrand = Array.isArray(analysisStore.refAnalysis?.brandExclusivePoints)
      ? analysisStore.refAnalysis?.brandExclusivePoints
      : [];

    legacyGeneral.forEach((p) => {
      if (p) general.add(p);
    });
    legacyBrand.forEach((p) => {
      if (p) brand.add(p);
    });
    structure.forEach((s: any) => {
      (Array.isArray(s?.keyFacts) ? s.keyFacts : []).forEach((p: string) => {
        if (p) general.add(p);
      });
      (Array.isArray(s?.uspNotes) ? s.uspNotes : []).forEach((p: string) => {
        if (p) brand.add(p);
      });
    });
    return {
      general: Array.from(general),
      brand: Array.from(brand),
    };
  }, [analysisStore.refAnalysis]);

  useEffect(() => {
    if (!generationStore.content || generationStore.status === 'idle') {
      const baseScore = { value: 0, label: 'Start Writing', color: 'text-gray-300' };
      if (contentScore.value !== baseScore.value) {
        setContentScore(baseScore);
      }
      return;
    }

    let score = 0;
    let totalFactors = 0;

    if (analysisStore.keywordPlans.length > 0) {
      const contentLower = (generationStore.content || '').toLowerCase();
      const usedKeywords = analysisStore.keywordPlans.filter(
        (k) => k.word && contentLower.includes(k.word.toLowerCase())
      );
      const keywordRatio = usedKeywords.length / analysisStore.keywordPlans.length;
      score += keywordRatio * 50;
      totalFactors++;
    }

    const totalPointCount = structurePoints.general.length + structurePoints.brand.length;
    if (totalPointCount > 0) {
      const pointRatio = analysisStore.coveredPoints.length / totalPointCount;
      score += pointRatio * 50;
      totalFactors++;
    } else {
      score += 50;
    }

    if (analysisStore.keywordPlans.length === 0) score = score * 2;
    score = Math.min(100, Math.round(score));

    let label = 'Needs Work';
    let color = 'text-red-500';
    if (score >= 80) {
      label = 'Excellent';
      color = 'text-emerald-500';
    } else if (score >= 50) {
      label = 'Good';
      color = 'text-amber-500';
    }

    const nextScore = { value: score, label, color };
    if (contentScore.value !== nextScore.value || contentScore.label !== nextScore.label) {
      setContentScore(nextScore);
    }
  }, [
    generationStore.content,
    analysisStore.keywordPlans,
    analysisStore.coveredPoints,
    analysisStore.refAnalysis,
    structurePoints,
    generationStore.status,
    contentScore.value,
    contentScore.label,
    setContentScore,
  ]);

  return { structurePoints };
}
