import { ServiceResponse, TargetAudience } from '../../types';
import { getLanguageInstruction } from './promptService';
import { aiService } from './aiService';
import { promptTemplates } from './promptTemplates';
import { Type } from './schemaTypes';
import { TokenUtils } from '../../utils/tokenUtils';

export interface ContextMapping {
    title: string;
    relevantContext: string;
}

export const distributeSectionContexts = async (
    referenceContent: string,
    sections: { title: string }[],
    targetAudience: TargetAudience
): Promise<ServiceResponse<ContextMapping[]>> => {
    const startTs = Date.now();

    // 1. Validation: If content is small, no need to distribute.
    // Unless we want to force strict filtering. Let's optimize for standard cases.
    if (!referenceContent || referenceContent.trim().length < 500) {
        return {
            data: sections.map(s => ({ title: s.title, relevantContext: referenceContent || '' })),
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: 0
        };
    }

    // 2. Prepare Inputs
    const languageInstruction = getLanguageInstruction(targetAudience);
    // Truncate overly large source to avoid context window explosion on the distribution step itself
    // usage: ~55k tokens is fine for Flash 1.5/2.0
    const truncatedSource = TokenUtils.truncateToTokens(referenceContent, 80000);
    const sectionTitles = sections.map(s => s.title);

    const prompt = promptTemplates.distributeContext({
        sourceContent: truncatedSource,
        sectionTitles,
        languageInstruction
    });

    try {
        const response = await aiService.runJson<{ mapping: ContextMapping[] }>(
            prompt,
            'FLASH',
            {
                schema: {
                    type: Type.OBJECT,
                    properties: {
                        mapping: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    relevantContext: { type: Type.STRING }
                                }
                            }
                        }
                    }
                },
                promptId: 'context_distribute'
            }
        );

        const mappings = response.data?.mapping || [];

        // Fallback: If a section is missing from the mapping, give it empty context or full? 
        // Empty is safer to prevent hallucination overlapping.
        const completedMappings = sections.map(section => {
            const found = mappings.find(m => m.title === section.title);
            return {
                title: section.title,
                relevantContext: found?.relevantContext || ''
            };
        });

        return {
            data: completedMappings,
            usage: response.usage,
            cost: response.cost,
            duration: response.duration
        };

    } catch (error) {
        console.error('Context Distribution Failed:', error);
        // Fallback: If AI fails, return EMPTY context to avoid blocking generation, 
        // OR return full context (but that defeats the purpose). 
        // Let's return full context as safe fallback, but logged error.
        return {
            data: sections.map(s => ({ title: s.title, relevantContext: referenceContent })),
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: Date.now() - startTs
        };
    }
};
