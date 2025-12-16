import { ServiceResponse, ReferenceAnalysis, TargetAudience } from '../../types';
import { aiService } from '../engine/aiService';
import { promptTemplates } from '../engine/promptTemplates';
import { getLanguageInstruction, toTokenUsage } from '../engine/promptService';
import { Type } from '../engine/schemaTypes';

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
    return await aiService.runJson<{ websiteType: string; authorityTerms: string }>(
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
    const prompt = promptTemplates.referenceStructure({ content: referenceContent, targetAudience, languageInstruction });

    try {
        const response = await aiService.runJson<any>(prompt, 'FLASH', {
            type: Type.OBJECT,
            properties: {
                h1Title: { type: Type.STRING },
                introText: { type: Type.STRING },
                structure: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            narrativePlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                            coreQuestion: { type: Type.STRING },
                            difficulty: { type: Type.STRING, description: "easy | medium | unclear" },
                            exclude: { type: Type.BOOLEAN },
                            excludeReason: { type: Type.STRING },
                            writingMode: { type: Type.STRING, description: "direct | multi_solutions" },
                            solutionAngles: { type: Type.ARRAY, items: { type: Type.STRING } },
                            subheadings: { type: Type.ARRAY, items: { type: Type.STRING } },
                            keyFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
                            uspNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
                            isChecklist: { type: Type.BOOLEAN },
                            // shiftPlan removed
                            suppress: { type: Type.ARRAY, items: { type: Type.STRING } },
                            augment: { type: Type.ARRAY, items: { type: Type.STRING } },
                        }
                    }
                },
                generalPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                conversionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                keyInformationPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                brandExclusivePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                competitorBrands: { type: Type.ARRAY, items: { type: Type.STRING } },
                competitorProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
                regionVoiceDetect: { type: Type.STRING },
                humanWritingVoice: { type: Type.STRING }
            }
        });

        const data = response.data;

        // Filter out excluded sections (marked as irrelevant like "目錄", unrelated sidebars)
        // Note: difficulty=unclear sections are kept - they just need more content handling
        const filteredStructure = (data.structure || []).filter((item: any) => {
            if (item.exclude === true) {
                console.log(`[RefAnalysis] Excluding section: "${item.title}" - Reason: ${item.excludeReason || 'irrelevant'}`);
                return false;
            }
            return true;
        });

        const normalizedStructure = filteredStructure.map((item: any) => ({
            ...item,
            subheadings: Array.isArray(item.subheadings) ? item.subheadings : [],
            keyFacts: Array.isArray(item.keyFacts) ? item.keyFacts : [],
            uspNotes: Array.isArray(item.uspNotes) ? item.uspNotes : [],
            // shiftPlan removed
            suppress: Array.isArray(item.suppress) ? item.suppress : [],
            augment: Array.isArray(item.augment) ? item.augment : [],
        }));

        const combinedRules = [
            ...(data.competitorBrands || []),
            ...(data.competitorProducts || [])
        ];

        return {
            data: {
                h1Title: data.h1Title || '',
                introText: data.introText || '',
                structure: normalizedStructure,
                generalPlan: data.generalPlan || [],
                conversionPlan: data.conversionPlan || [],
                keyInformationPoints: data.keyInformationPoints || [],
                brandExclusivePoints: data.brandExclusivePoints || [],
                replacementRules: combinedRules,
                competitorBrands: data.competitorBrands || [],
                competitorProducts: data.competitorProducts || [],
                regionVoiceDetect: data.regionVoiceDetect,
                humanWritingVoice: data.humanWritingVoice
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
