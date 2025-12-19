import { ServiceResponse, TargetAudience } from '../../types';
import { calculateCost, getLanguageInstruction } from './promptService';
import { Type } from './schemaTypes';
import { aiService } from './aiService';

// Smart Context Filter with Knowledge Base Support (Stronger RAG)
export const filterSectionContext = async (
    sectionTitle: string,
    allKeyPoints: string[],
    allAuthTerms: string[],
    brandKnowledgeBase: string | undefined,
    referenceContent: string | undefined, // NEW: RAG Source
    targetAudience: TargetAudience
): Promise<ServiceResponse<{ filteredPoints: string[], filteredAuthTerms: string[], knowledgeInsights: string[] }>> => {

    const startTs = Date.now();
    const hasKnowledge = (brandKnowledgeBase && brandKnowledgeBase.trim().length > 10) || (referenceContent && referenceContent.trim().length > 10);

    if (!hasKnowledge && allKeyPoints.length <= 5 && allAuthTerms.length <= 5) {
        return {
            data: { filteredPoints: allKeyPoints, filteredAuthTerms: allAuthTerms, knowledgeInsights: [] },
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: 0
        };
    }

    const languageInstruction = getLanguageInstruction(targetAudience);

    const prompt = `
    I am writing a specific section titled: "${sectionTitle}".
    
    I have:
    1. A database of "Key Information Points".
    2. A database of "Authority Terms".
    3. A "BRAND KNOWLEDGE BASE" (Guidelines/Specs).
    4. "SOURCE MATERIAL" (Original content/articles).
    
    TASK:
    1. **Filter Data**: Select ONLY the Key Points and Authority Terms strictly relevant to "${sectionTitle}".
    2. **Agentic Retrieval**: 
       - Read the "BRAND KNOWLEDGE BASE" and "SOURCE MATERIAL".
       - Extract 3-5 specific constraints, facts, or technical details that MUST be applied to this specific section "${sectionTitle}".
       - Focus on concrete details (percentages, specs, quotes, unique facts) found in the Source Material.
       - If nothing is relevant, return empty list.
    
    ${languageInstruction}
    
    DATABASE:
    Key Points: ${JSON.stringify(allKeyPoints)}
    Authority Terms: ${JSON.stringify(allAuthTerms)}
    
    BRAND KNOWLEDGE BASE:
    ${brandKnowledgeBase ? brandKnowledgeBase.substring(0, 50000) : "N/A"}

    SOURCE MATERIAL:
    ${referenceContent ? referenceContent.substring(0, 200000) : "N/A"}
    `;

    try {
        const response = await aiService.runText(prompt, 'FLASH', {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    filteredPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    filteredAuthTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
                    knowledgeInsights: { type: Type.ARRAY, items: { type: Type.STRING } },
                }
            }
        });

        const data = JSON.parse(response.text || "{}");
        const metrics = calculateCost(response.usage, 'FLASH');

        return {
            data: {
                filteredPoints: data.filteredPoints || [],
                filteredAuthTerms: data.filteredAuthTerms || [],
                knowledgeInsights: data.knowledgeInsights || []
            },
            ...metrics,
            duration: response.duration
        };
    } catch (e) {
        console.error("Context filter failed", e);
        return {
            data: { filteredPoints: allKeyPoints, filteredAuthTerms: allAuthTerms, knowledgeInsights: [] },
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: Date.now() - startTs
        };
    }
};
