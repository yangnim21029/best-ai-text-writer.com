
import { ServiceResponse, KeywordActionPlan, KeywordData, TargetAudience, ReferenceAnalysis, AuthorityAnalysis } from '../types';
import { calculateCost, getLanguageInstruction, extractRawSnippets } from './promptService';
import { generateContent } from './ai';
import { Type } from "@google/genai";
import { promptRegistry } from './promptRegistry';
import { MODEL } from '../config/constants';

// 1. Analyze Context & Generate Action Plan
export const extractKeywordActionPlans = async (referenceContent: string, keywords: KeywordData[], targetAudience: TargetAudience): Promise<ServiceResponse<KeywordActionPlan[]>> => {
    const startTs = Date.now();

    // 1. Pre-process: Identify snippets locally
    const topTokens = keywords.slice(15);
    const analysisPayload = topTokens.map(k => ({
        word: k.token,
        snippets: extractRawSnippets(referenceContent, k.token)
    })).filter(item => item.snippets.length > 0);

    if (analysisPayload.length === 0) {
        return { data: [], usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: Date.now() - startTs };
    }

    const languageInstruction = getLanguageInstruction(targetAudience);
    const prompt = promptRegistry.build('keywordActionPlan', {
        languageInstruction,
        analysisPayloadString: JSON.stringify(analysisPayload.slice(0, 20), null, 2),
    });

    try {
    const response = await generateContent(
        MODEL.FLASH,
        prompt,
        {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        plans: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    word: { type: Type.STRING },
                                    plan: {
                                        type: Type.ARRAY,
                                        items: { type: Type.STRING },
                                        description: "List of 1-3 short rules on how to use this word in a sentence."
                                    }
                                }
                            }
                        }
                    }
                }
            }
        );

        const result = JSON.parse(response.text || "{}");
        const plans: any[] = result.plans || [];

        const uniquePlans = new Map();
        plans.forEach((p: any) => {
            if (p && p.word && !uniquePlans.has(p.word)) {
                uniquePlans.set(p.word, p);
            }
        });

        const finalPlans = Array.from(uniquePlans.values()).map((p: any) => {
            const original = analysisPayload.find(ap => ap.word === p.word);
            return {
                word: p.word,
                plan: p.plan || [],
                snippets: original ? original.snippets : []
            };
        });

        const metrics = calculateCost(response.usageMetadata, 'FLASH');

        return {
            data: finalPlans,
            ...metrics,
            duration: Date.now() - startTs
        };

    } catch (e) {
        console.error("Action Plan extraction failed", e);
        return { data: [], usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: Date.now() - startTs };
    }
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
        const response = await generateContent(
            MODEL.FLASH,
            prompt,
            {
                responseMimeType: 'application/json',
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
                        keyInformationPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "General industry facts and knowledge" },
                        brandExclusivePoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Brand specific USPs, pricing, or unique features" },
                        replacementRules: { type: Type.ARRAY, items: { type: Type.STRING } }, // Legacy
                        competitorBrands: { type: Type.ARRAY, items: { type: Type.STRING } },
                        competitorProducts: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        );

        const data = JSON.parse(response.text || "{}");
        const metrics = calculateCost(response.usageMetadata, 'FLASH');

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
                brandExclusivePoints: data.brandExclusivePoints || [], // NEW
                replacementRules: combinedRules,
                competitorBrands: data.competitorBrands || [],
                competitorProducts: data.competitorProducts || []
            },
            ...metrics,
            duration: Date.now() - startTs
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

// Analyze Authority Terms with Website Context
export const analyzeAuthorityTerms = async (authorityInput: string, topic: string, websiteType: string, targetAudience: TargetAudience): Promise<ServiceResponse<AuthorityAnalysis | null>> => {
    const startTs = Date.now();
    if (!authorityInput || !authorityInput.trim()) {
        return { data: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: 0 };
    }

    const languageInstruction = getLanguageInstruction(targetAudience);

    const prompt = `
    I have a list of "Authority Attribute Terms" (Brand specs, ingredients, certifications, etc.), a target Article Topic, and a description of the Website Type.
    
    ${languageInstruction}

    WEBSITE / BRAND CONTEXT:
    "${websiteType}"
    
    TOPIC:
    "${topic}"
    
    TASK:
    1. **Filter**: Extract ONLY the terms from the list that are highly relevant to the Topic and Website Context. Ignore irrelevant ones.
    2. **Shorten**: Ensure output terms are **strictly 1-2 English words** or **2-4 Chinese characters** (e.g., "FDA Approved", "無痛", "美國進口"). No long phrases.
    3. **Strategize**: Create 3 specific "Combination Strategies" (Action Plans) on how to weave these terms into the article to maximize credibility.
    
    RAW AUTHORITY TERMS LIST:
    ${authorityInput.substring(0, 5000)}
    `;

    try {
        const response = await generateContent(
            MODEL.FLASH,
            prompt,
            {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        relevantTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
                        combinations: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        );

        const data = JSON.parse(response.text || "{}");
        const metrics = calculateCost(response.usageMetadata, 'FLASH');

        return {
            data: {
                relevantTerms: data.relevantTerms || [],
                combinations: data.combinations || []
            },
            ...metrics,
            duration: Date.now() - startTs
        };

    } catch (e) {
        console.error("Authority analysis failed", e);
        return { data: null, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: Date.now() - startTs };
    }
};

export const extractWebsiteTypeAndTerm = async (content: string): Promise<ServiceResponse<{ websiteType: string, authorityTerms: string }>> => {
    const startTs = Date.now();

    const prompt = `
    Analyze the following website content.
    
    TASK 1: Identify "Website / Brand Context" (e.g., High-End Skincare, Tech SaaS, Travel Blog).
    
    TASK 2: List 20 "Authority Attribute Terms" based on the identified Context.
    
    **STRICT CONSTRAINT:** 
    The terms must be extremely short and punchy.
    - English: 1-2 words max (e.g., "FDA Approved", "Dermatologist Tested", "Organic").
    - Chinese: 2-4 characters max (e.g., "專業認證", "醫生推薦", "純天然").
    
    PROMPT INSTRUCTION: "List 20 short, authoritative terms commonly found in this [Website Context]."
    
    CONTENT: ${content.substring(0, 500)}
    `;

    try {
        const response = await generateContent(
            MODEL.FLASH,
            prompt,
            {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        websiteType: { type: Type.STRING },
                        authorityTerms: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                }
            }
        );

        const data = JSON.parse(response.text || "{}");
        const metrics = calculateCost(response.usageMetadata, 'FLASH');

        return {
            data: {
                websiteType: data.websiteType || "",
                authorityTerms: (data.authorityTerms || []).join(', ')
            },
            ...metrics,
            duration: Date.now() - startTs
        };
    } catch (e) {
        console.error("Brand info extraction failed", e);
        return {
            data: { websiteType: "", authorityTerms: "" },
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: Date.now() - startTs
        };
    }
};

// Smart Context Filter with Knowledge Base Support (Stronger RAG)
export const filterSectionContext = async (
    sectionTitle: string,
    allKeyPoints: string[],
    allAuthTerms: string[],
    brandKnowledgeBase: string | undefined,
    targetAudience: TargetAudience
): Promise<ServiceResponse<{ filteredPoints: string[], filteredAuthTerms: string[], knowledgeInsights: string[] }>> => {

    const startTs = Date.now();
    const hasKnowledge = brandKnowledgeBase && brandKnowledgeBase.trim().length > 10;

    // Optimization: If data is small and no KB, skip
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
    
    TASK:
    1. **Filter Data**: Select ONLY the Key Points and Authority Terms strictly relevant to "${sectionTitle}".
    2. **Agentic Retrieval**: Read the "BRAND KNOWLEDGE BASE". Extract 3-5 specific bullet points (Do's, Don'ts, Specs, Tone) that MUST be applied to this specific section.
       - If nothing is relevant in the KB for this section, return empty list.
    
    ${languageInstruction}
    
    DATABASE:
    Key Points: ${JSON.stringify(allKeyPoints)}
    Authority Terms: ${JSON.stringify(allAuthTerms)}
    
    BRAND KNOWLEDGE BASE:
    ${brandKnowledgeBase ? brandKnowledgeBase.substring(0, 30000) : "N/A"}
    `;

    try {
        const response = await generateContent(
            MODEL.FLASH,
            prompt,
            {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        filteredPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                        filteredAuthTerms: { type: Type.ARRAY, items: { type: Type.STRING } },
                        knowledgeInsights: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Specific rules or facts extracted from Brand Knowledge Base for this section."
                        }
                    }
                }
            }
        );

        const data = JSON.parse(response.text || "{}");
        const metrics = calculateCost(response.usageMetadata, 'FLASH');

        return {
            data: {
                filteredPoints: data.filteredPoints || [],
                filteredAuthTerms: data.filteredAuthTerms || [],
                knowledgeInsights: data.knowledgeInsights || []
            },
            ...metrics,
            duration: Date.now() - startTs
        };

    } catch (e) {
        console.warn("Context filtering failed, falling back to all data", e);
        return {
            data: { filteredPoints: allKeyPoints, filteredAuthTerms: allAuthTerms, knowledgeInsights: [] },
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: Date.now() - startTs
        };
    }
};
