import { ServiceResponse, ReferenceAnalysis, TargetAudience } from '../types';
import { calculateCost, getLanguageInstruction } from './promptService';
import { Type } from './schemaTypes';
import { runLlm } from './llmOrchestrator';



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
    const res = await runLlm({
        prompt,
        model: 'FLASH',
        responseMimeType: 'application/json',
        config: {
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    websiteType: { type: Type.STRING },
                    authorityTerms: { type: Type.STRING },
                }
            }
        }
    });

    // Backend returns validated object when schema is used
    const data = res.object || (res.text ? JSON.parse(res.text) : {});
    return {
        data: { websiteType: data.websiteType || '', authorityTerms: data.authorityTerms || '' },
        usage: res.usage,
        cost: res.cost,
        duration: res.duration,
    };
};

// Extract Structure and General Strategy (Includes Replacement Rules)
export const analyzeReferenceStructure = async (referenceContent: string, targetAudience: TargetAudience): Promise<ServiceResponse<ReferenceAnalysis>> => {
    const startTs = Date.now();
    const languageInstruction = getLanguageInstruction(targetAudience);

    const prompt = `
    Analyze the following Reference Content.
    
    ${languageInstruction}
    
    TASK 1: Analyze the structure. Break the article down into main sections (H2/H3). The titles should be in the Target Language.
    TASK 2: For EACH section, write a specific "Narrative Action Plan". How did the author write *this specific part*? (e.g., "Started with a rhetorical question," "Used a bullet list for benefits").
    TASK 3: Create a "General Action Plan" (3 key points) on how to mimic this author's overall voice.
    TASK 4: Create a "Conversion & Value Strategy" (3 key points). How does this author present the *Value* or *Benefits*?
    
    TASK 5: **INFORMATION EXTRACTION & CLASSIFICATION (CRITICAL)**
    Extract all unique facts and concepts, but CLASSIFY them into two lists:
    A. **Key Information Points (General)**: Industry facts, scientific principles, general educational info. (e.g., "Laser wavelength affects depth", "Vitamin C is an antioxidant").
    B. **Brand Exclusive Points (USP)**: Specific claims about the specific company/brand/product mentioned in the text. (e.g., "TopGlow uses Gen 4 machines", "Our treatment takes only 10 mins", "We have FDA approval for X").

    TASK 6: **COMPETITOR RECONNAISSANCE**.
           Identify specific **Brand Names** (e.g., "EVRbeauty", "Tesla") and **Product Models** (e.g., "GentleLase", "Model S") mentioned in the text that are NOT general terms.
           - competitorBrands: The name of the company.
           - competitorProducts: The specific machine, cream, or service model.

    REFERENCE CONTENT:
    ${referenceContent.substring(0, 30000)} 
    `;

    try {
        const response = await runLlm({
            prompt,
            model: 'FLASH',
            responseMimeType: 'application/json',
            config: {
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        structure: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    narrativePlan: { type: Type.ARRAY, items: { type: Type.STRING } }
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
                }
            }
        });

        // Backend returns validated object when schema is used
        const data = response.object || (response.text ? JSON.parse(response.text) : {});
        const metrics = calculateCost(response.usage, 'FLASH');

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
            ...metrics,
            duration: response.duration
        };
    } catch (e) {
        console.error("Structure analysis failed", e);
        return {
            data: { structure: [], generalPlan: [], conversionPlan: [], keyInformationPoints: [], brandExclusivePoints: [], competitorBrands: [], competitorProducts: [] },
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: Date.now() - startTs
        };
    }
};
