import { ServiceResponse, AuthorityAnalysis, TargetAudience } from '../../types';
import { aiService } from '../engine/aiService';
import { promptTemplates } from '../engine/promptTemplates';
import { Type } from '../engine/schemaTypes';
import { getLanguageInstruction, toTokenUsage } from '../engine/promptService';

export const analyzeAuthorityTerms = async (
  authorityTerms: string,
  articleTitle: string,
  websiteType: string,
  targetAudience: TargetAudience
): Promise<ServiceResponse<AuthorityAnalysis>> => {
  const startTs = Date.now();

  // Truncate authorityTerms to roughly 3000 chars to prevent timeout/overload
  const truncatedTerms =
    authorityTerms.length > 3000
      ? authorityTerms.slice(0, 3000) + '...(truncated)'
      : authorityTerms;

  // Use the registry to build the prompt
  const languageInstruction = getLanguageInstruction(targetAudience);
  const prompt = promptTemplates.authorityAnalysis({
    authorityTerms: truncatedTerms,
    title: articleTitle,
    websiteType,
    languageInstruction,
  });

  try {
  const response = await aiService.runJson<AuthorityAnalysis>(prompt, 'FLASH', {
    schema: {
      type: Type.OBJECT,
      properties: {
        relevantTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
        combinations: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
    },
    promptId: 'authority_analysis',
  });

    return {
      data: {
        relevantTerms: response.data.relevantTerms || [],
        combinations: response.data.combinations || [],
      },
      usage: toTokenUsage(response.usage),
      cost: response.cost,
      duration: response.duration,
    };
  } catch (e) {
    console.error('Authority analysis failed', e);
    const usage = toTokenUsage((e as any)?.usage);
    return {
      data: {
        relevantTerms: [],
        combinations: [],
      },
      usage,
      cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
      duration: Date.now() - startTs,
    };
  }
};
