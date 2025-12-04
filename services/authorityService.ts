import { ServiceResponse, AuthorityAnalysis, TargetAudience } from '../types';
import { aiService } from './aiService';
import { promptTemplates } from './promptTemplates';
import { Type } from './schemaTypes';
import { getLanguageInstruction, toTokenUsage } from './promptService';

export const analyzeAuthorityTerms = async (
    authorityTerms: string,
    articleTitle: string,
    websiteType: string,
    targetAudience: TargetAudience
): Promise<ServiceResponse<AuthorityAnalysis>> => {
    const startTs = Date.now();

    // Use the registry to build the prompt
    const languageInstruction = getLanguageInstruction(targetAudience);
    const prompt = promptTemplates.authorityAnalysis({ authorityTerms, title: articleTitle, websiteType, languageInstruction });

    try {
        const response = await aiService.runJson<AuthorityAnalysis>(prompt, 'FLASH', {
            type: Type.OBJECT,
            properties: {
                relevantTerms: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Filtered high-relevance authority terms"
                },
                combinations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Strategic ways to combine these terms"
                }
            }
        });

        return {
            data: response.data,
            usage: toTokenUsage(response.usage),
            cost: response.cost,
            duration: response.duration
        };

    } catch (e) {
        console.error("Authority analysis failed", e);
        const usage = toTokenUsage((e as any)?.usage);
        return {
            data: {
                relevantTerms: [],
                combinations: []
            },
            usage,
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: Date.now() - startTs
        };
    }
};
