import 'server-only';
import { z } from 'zod';
import { ServiceResponse, AuthorityAnalysis, TargetAudience } from '../../types';
import { aiService } from '../adapters/aiService';
import { promptTemplates } from '../adapters/promptTemplates';
import { getLanguageInstruction, toTokenUsage } from '../adapters/promptService';
import { logger } from '../../utils/logger';

export const analyzeAuthorityTerms = async (
  authorityTerms: string,
  articleTitle: string,
  websiteType: string,
  targetAudience: TargetAudience
): Promise<ServiceResponse<AuthorityAnalysis>> => {
  const startTs = Date.now();

  // Truncate authorityTerms to roughly 2000 chars to prevent timeout/overload
  const truncatedTerms =
    authorityTerms.length > 2000
      ? authorityTerms.slice(0, 2000) + '...(truncated)'
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
      schema: z.object({
        relevantTerms: z.array(z.string()),
        combinations: z.array(z.string()),
      }),
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
    logger.error('nlp_analysis', 'Authority analysis failed', { error: e });
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
