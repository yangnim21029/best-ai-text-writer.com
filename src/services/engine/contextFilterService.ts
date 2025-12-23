import { ServiceResponse, TargetAudience } from '../../types';
import { calculateCost, getLanguageInstruction } from './promptService';
import { Type } from './schemaTypes';
import { aiService } from './aiService';

import { TokenUtils } from '../../utils/tokenUtils';

import { promptTemplates } from './promptTemplates';

// Smart Context Filter with Knowledge Base Support (Stronger RAG)
export const filterSectionContext = async (
  sectionTitle: string,
  allKeyPoints: string[],
  allAuthTerms: string[],
  brandKnowledgeBase: string | undefined,
  referenceContent: string | undefined, // NEW: RAG Source
  targetAudience: TargetAudience
): Promise<
  ServiceResponse<{
    filteredPoints: string[];
    filteredAuthTerms: string[];
    knowledgeInsights: string[];
  }>
> => {
  const startTs = Date.now();
  const hasKnowledge =
    (brandKnowledgeBase && brandKnowledgeBase.trim().length > 10) ||
    (referenceContent && referenceContent.trim().length > 10);

  if (!hasKnowledge && allKeyPoints.length <= 5 && allAuthTerms.length <= 5) {
    return {
      data: {
        filteredPoints: allKeyPoints,
        filteredAuthTerms: allAuthTerms,
        knowledgeInsights: [],
      },
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
      duration: 0,
    };
  }

  const languageInstruction = getLanguageInstruction(targetAudience);

  // Use accurate token counting for context management
  const kbContext = brandKnowledgeBase ? TokenUtils.truncateToTokens(brandKnowledgeBase, 15000) : 'N/A';
  const sourceContext = referenceContent ? TokenUtils.truncateToTokens(referenceContent, 40000) : 'N/A';

  const prompt = promptTemplates.filterSectionContext({
    kbContext,
    sourceContext,
    allKeyPoints,
    allAuthTerms,
    sectionTitle,
    languageInstruction,
  });

  try {
    const response = await aiService.runJson<{
      filteredPoints: string[];
      filteredAuthTerms: string[];
      knowledgeInsights: string[];
    }>(prompt, 'FLASH', {
      schema: {
        type: Type.OBJECT,
        properties: {
          filteredPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
          filteredAuthTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
          knowledgeInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
      promptId: 'context_filter',
    });

    const data = response.data;
    const metrics = { usage: response.usage, cost: response.cost };

    return {
      data: {
        filteredPoints: data.filteredPoints || [],
        filteredAuthTerms: data.filteredAuthTerms || [],
        knowledgeInsights: data.knowledgeInsights || [],
      },
      ...metrics,
      duration: response.duration,
    };
  } catch (e) {
    console.error('Context filter failed', e);
    return {
      data: {
        filteredPoints: allKeyPoints,
        filteredAuthTerms: allAuthTerms,
        knowledgeInsights: [],
      },
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
      duration: Date.now() - startTs,
    };
  }
};
