import { ServiceResponse, ReferenceAnalysis, TargetAudience } from '../types';
import { aiClient } from './aiClient';
import { promptRegistry } from './promptRegistry';
import { getLanguageInstruction, toTokenUsage } from './promptService';
import { Type } from './schemaTypes';

export const extractWebsiteTypeAndTerm = async (content: string) => {
    // Lightweight helper for URL scraping flow to infer websiteType & authorityTerms.
    const prompt = `
    Scan the following content and extract:
    1) websiteType: e.g., "Medical Clinic", "Ecommerce", "Blog".
    2) authorityTerms: up to 5 key terms related to brand authority (certifications, ingredients, key specs).
    CONTENT:
    ${content.substring(0, 6000)}
    OUTPUT JSON: { "websiteType": "...", "authorityTerms": "comma separated terms" }
    `;

    // Using runJson for structured output
    return await aiClient.runJson<{ websiteType: string; authorityTerms: string }>(
        prompt,
        'FLASH',
        {
            type: Type.OBJECT,
            properties: {
                websiteType: { type: Type.STRING },
                authorityTerms: { type: Type.STRING },
            }
        }
    );
};

export const analyzeReferenceStructure = async (
    referenceContent: string,
    targetAudience: TargetAudience
): Promise<ServiceResponse<ReferenceAnalysis>> => {
    const startTs = Date.now();

    // Get language instruction for the target audience
    const languageInstruction = getLanguageInstruction(targetAudience);

    // Use the registry to build the prompt with language instruction
    const prompt = promptRegistry.referenceAnalysis(referenceContent, targetAudience, languageInstruction);

    try {
        const response = await aiClient.runJson<any>(prompt, 'FLASH', {
            type: Type.OBJECT,
            properties: {
                structure: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            narrativePlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                            coreQuestion: { type: Type.STRING },
                            difficulty: { type: Type.STRING, description: "easy | medium | unclear" },
                            writingMode: { type: Type.STRING, description: "direct | multi_solutions" },
                            solutionAngles: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                },
                generalPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                conversionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                keyInformationPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                brandExclusivePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                competitorBrands: { type: Type.ARRAY, items: { type: Type.STRING } },
                competitorProducts: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        });

        const data = response.data;

        const combinedRules = [
            ...(data.competitorBrands || []),
            ...(data.competitorProducts || [])
        ];

        return {
            data: {
                structure: data.structure || [],
                generalPlan: data.generalPlan || [],
                conversionPlan: data.conversionPlan || [],
                keyInformationPoints: data.keyInformationPoints || [],
                brandExclusivePoints: data.brandExclusivePoints || [],
                replacementRules: combinedRules,
                competitorBrands: data.competitorBrands || [],
                competitorProducts: data.competitorProducts || []
            },
            usage: toTokenUsage(response.usage),
            cost: response.cost,
            duration: response.duration
        };

    } catch (e: any) {
        console.error("Structure analysis failed", e);
        const errorUsage = toTokenUsage(e?.usage);
        const errorCost = e?.cost || { inputCost: 0, outputCost: 0, totalCost: 0 };
        return {
            data: {
                structure: [],
                generalPlan: [],
                conversionPlan: [],
                keyInformationPoints: [],
                brandExclusivePoints: [],
                replacementRules: [],
                competitorBrands: [],
                competitorProducts: []
            },
            usage: errorUsage,
            cost: errorCost,
            duration: Date.now() - startTs
        };
    }
};
