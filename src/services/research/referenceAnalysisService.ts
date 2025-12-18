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
    const languageInstruction = getLanguageInstruction(targetAudience);

    // Prepare Prompts
    // Using full content as requested by the user
    const structurePrompt = promptTemplates.narrativeStructure({ content: referenceContent, targetAudience, languageInstruction });
    const voicePrompt = promptTemplates.voiceStrategy({ content: referenceContent, targetAudience, languageInstruction });

    try {
        // Run Parallel Analysis
        const [structRes, voiceRes] = await Promise.all([
            // 1. Structure Analysis
            aiService.runJson<any>(structurePrompt, 'FLASH', {
                type: Type.OBJECT,
                properties: {
                    h1Title: { type: Type.STRING },
                    introText: { type: Type.STRING },
                    keyInformationPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
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
                                suppress: { type: Type.ARRAY, items: { type: Type.STRING } },
                                augment: { type: Type.ARRAY, items: { type: Type.STRING } },
                                sentenceStartFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
                                sentenceEndFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
                            },
                            required: ["title", "narrativePlan", "coreQuestion", "writingMode", "keyFacts"]
                        }
                    }
                },
                required: ["h1Title", "introText", "structure", "keyInformationPoints"]
            }),
            // 2. Voice & Strategy Analysis
            aiService.runJson<any>(voicePrompt, 'FLASH', {
                type: Type.OBJECT,
                properties: {
                    generalPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                    conversionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                    brandExclusivePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    competitorBrands: { type: Type.ARRAY, items: { type: Type.STRING } },
                    competitorProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
                    regionVoiceDetect: { type: Type.STRING },
                    humanWritingVoice: { type: Type.STRING }
                },
                required: ["generalPlan", "conversionPlan", "brandExclusivePoints", "regionVoiceDetect", "humanWritingVoice"]
            })
        ]);

        const structData = structRes.data;
        const voiceData = voiceRes.data;

        console.log('[RefAnalysis] Raw AI Structure Data:', JSON.stringify(structData, null, 2));
        console.log('[RefAnalysis] Raw AI Voice Data:', JSON.stringify(voiceData, null, 2));

        // Filter excluded sections
        const filteredStructure = (structData.structure || []).filter((item: any) => {
            if (item.exclude === true) {
                console.log(`[RefAnalysis] AI Excluded section: "${item.title}" - Reason: ${item.excludeReason || 'irrelevant'}`);
                return false;
            }
            // HARDCODED FALLBACK: Exclude common navigational sections that AI might miss
            const navKeywords = ['目錄', '導覽', '清單', '引言', '延伸閱讀', '相關文章', 'Table of Contents', 'TOC', 'Introduction'];
            if (navKeywords.some(kw => item.title.includes(kw) && (item.title.length < 15))) {
                console.log(`[RefAnalysis] Auto-Excluding navigational section: "${item.title}"`);
                return false;
            }
            return true;
        });

        const normalizedStructure = filteredStructure.map((item: any) => {
            const normalized = {
                ...item,
                subheadings: Array.isArray(item.subheadings) ? item.subheadings : [],
                keyFacts: Array.isArray(item.keyFacts) ? item.keyFacts : [],
                uspNotes: Array.isArray(item.uspNotes) ? item.uspNotes : [],
                suppress: Array.isArray(item.suppress) ? item.suppress : [],
                augment: Array.isArray(item.augment) ? item.augment : [],
                narrativePlan: Array.isArray(item.narrativePlan) ? item.narrativePlan : [],
                sentenceStartFeatures: Array.isArray(item.sentenceStartFeatures) ? item.sentenceStartFeatures : [],
                sentenceEndFeatures: Array.isArray(item.sentenceEndFeatures) ? item.sentenceEndFeatures : [],
            };

            // STRICT VALIDATION: If a section is included, it MUST have a plan and facts
            if (normalized.narrativePlan.length === 0 || normalized.keyFacts.length === 0) {
                console.error(`[RefAnalysis] Section "${item.title}" failed validation: Missing Narrative Plan or Key Facts.`);
                throw new Error(`Invalid Narrative Structure: Section "${item.title}" is missing required content (Plan/Facts).`);
            }

            return normalized;
        });

        const combinedRules = [
            ...(voiceData.competitorBrands || []),
            ...(voiceData.competitorProducts || [])
        ];

        // Combine Token Usage & Cost
        const totalUsage = {
            inputTokens: (structRes.usage?.inputTokens || 0) + (voiceRes.usage?.inputTokens || 0),
            outputTokens: (structRes.usage?.outputTokens || 0) + (voiceRes.usage?.outputTokens || 0),
            totalTokens: (structRes.usage?.totalTokens || 0) + (voiceRes.usage?.totalTokens || 0),
        };

        const totalCost = {
            inputCost: (structRes.cost?.inputCost || 0) + (voiceRes.cost?.inputCost || 0),
            outputCost: (structRes.cost?.outputCost || 0) + (voiceRes.cost?.outputCost || 0),
            totalCost: (structRes.cost?.totalCost || 0) + (voiceRes.cost?.totalCost || 0),
        };

        return {
            data: {
                h1Title: structData.h1Title || '',
                introText: structData.introText || '',
                structure: normalizedStructure,
                keyInformationPoints: structData.keyInformationPoints || [],

                // From Voice Analysis
                generalPlan: voiceData.generalPlan || [],
                conversionPlan: voiceData.conversionPlan || [],
                brandExclusivePoints: voiceData.brandExclusivePoints || [],
                replacementRules: combinedRules,
                competitorBrands: voiceData.competitorBrands || [],
                competitorProducts: voiceData.competitorProducts || [],
                regionVoiceDetect: voiceData.regionVoiceDetect,
                humanWritingVoice: voiceData.humanWritingVoice
            },
            usage: totalUsage,
            cost: totalCost,
            duration: Date.now() - startTs
        };

    } catch (e: any) {
        console.error("Structure analysis failed", e);
        const errorUsage = toTokenUsage(0); // Simplified error handling
        const errorCost = { inputCost: 0, outputCost: 0, totalCost: 0 };
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
