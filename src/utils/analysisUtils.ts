import { 
  ReferenceAnalysis, 
  TargetAudience, 
  FrequentWordsPlacementAnalysis 
} from '@/types';

/**
 * Merges multiple ReferenceAnalysis objects into a single "Master Plan" on the client side
 * without using AI logic directly (or delegates back to server if needed).
 * 
 * IMPORTANT: This utility previously contained AI logic. 
 * Since AI logic is now server-only, this function must either:
 * 1. Be purely deterministic (no AI)
 * 2. Or be replaced by a Server Action call in the component.
 * 
 * For now, we will move the interface here to satisfy the import, 
 * but the actual AI synthesis logic should be moved to a Server Action.
 */
export const mergeMultipleAnalysesClientSide = (
  analyses: ReferenceAnalysis[],
  targetAudience: TargetAudience
): ReferenceAnalysis => {
  // Simple deterministic merge fallback (Client Side)
  if (!analyses || analyses.length === 0) throw new Error('No analyses to merge');
  
  const primary = analyses[0];
  
  // Union specific fields
  const allBrands = Array.from(new Set(analyses.flatMap(a => a.competitorBrands || [])));
  const allProducts = Array.from(new Set(analyses.flatMap(a => a.competitorProducts || [])));
  
  return {
    ...primary,
    competitorBrands: allBrands,
    competitorProducts: allProducts,
    sourceCount: analyses.length,
    isSynthesis: true
  };
};
