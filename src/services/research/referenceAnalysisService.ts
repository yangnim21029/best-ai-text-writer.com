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
    const voicePrompt = promptTemplates.voiceStrategy({ content: referenceContent, targetAudience, languageInstruction });

    try {
        // --- STAGE 0: Voice & Strategy Analysis (Can run in parallel with Stage 1) ---
        const voiceResPromise = aiService.runJson<any>(voicePrompt, 'FLASH', {
            type: Type.OBJECT,
            properties: {
                generalPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                conversionPlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                brandExclusivePoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                competitorBrands: { type: Type.ARRAY, items: { type: Type.STRING } },
                competitorProducts: { type: Type.ARRAY, items: { type: Type.STRING } },
                regionVoiceDetect: { type: Type.STRING },
                humanWritingVoice: { type: Type.STRING },
                toneSensation: { type: Type.STRING },
                entryPoint: { type: Type.STRING }
            },
            required: ["generalPlan", "conversionPlan", "brandExclusivePoints", "regionVoiceDetect", "humanWritingVoice"]
        });

        // --- STAGE 1: Skeleton Extraction ---
        console.log('[RefAnalysis] Stage 1: Skeleton Extraction...');
        const outlinePrompt = promptTemplates.extractOutline({ content: referenceContent, targetAudience, languageInstruction });
        const outlineRes = await aiService.runJson<any>(outlinePrompt, 'FLASH', {
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
                            subheadings: { type: Type.ARRAY, items: { type: Type.STRING } },
                            exclude: { type: Type.BOOLEAN },
                            excludeReason: { type: Type.STRING }
                        },
                        required: ["title"]
                    }
                }
            },
            required: ["h1Title", "introText", "structure", "keyInformationPoints"]
        });

        const outlineData = outlineRes.data;
        console.log('[RefAnalysis] Outline Data:', JSON.stringify(outlineData, null, 2));

        // Filter excluded sections for deep analysis
        const sectionsToAnalyze = (outlineData.structure || []).filter((item: any) => {
            if (item.exclude === true) return false;
            const navKeywords = ['目錄', '導覽', '清單', '引言', '延伸閱讀', '相關文章', 'Table of Contents', 'TOC', 'Introduction'];
            if (navKeywords.some(kw => item.title.includes(kw) && (item.title.length < 15))) return false;
            return true;
        });

        // --- STAGE 2: Deep Narrative Logic Analysis ---
        console.log(`[RefAnalysis] Stage 2: Deep Logic Analysis for ${sectionsToAnalyze.length} sections...`);
        const logicPrompt = promptTemplates.analyzeNarrativeLogic({
            content: referenceContent,
            outlineJson: JSON.stringify(sectionsToAnalyze),
            targetAudience,
            languageInstruction
        });

        const [logicRes, voiceRes] = await Promise.all([
            aiService.runJson<any>(logicPrompt, 'FLASH', {
                type: Type.OBJECT,
                properties: {
                    structure: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                narrativePlan: { type: Type.ARRAY, items: { type: Type.STRING } },
                                logicalFlow: { type: Type.STRING },
                                coreFocus: { type: Type.STRING },
                                keyFacts: { type: Type.ARRAY, items: { type: Type.STRING } },
                                coreQuestion: { type: Type.STRING },
                                difficulty: { type: Type.STRING },
                                writingMode: { type: Type.STRING },
                                uspNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
                                suppress: { type: Type.ARRAY, items: { type: Type.STRING } },
                                augment: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ["title", "narrativePlan", "logicalFlow", "keyFacts", "coreQuestion", "coreFocus"]
                        }
                    }
                },
                required: ["structure"]
            }),
            voiceResPromise
        ]);

        const logicData = logicRes.data;
        const voiceData = voiceRes.data;

        // --- DATA MERGING ---
        const normalizedStructure = logicData.structure.map((logicItem: any) => {
            // Find original skeleton item to get subheadings
            const skeletonItem = outlineData.structure.find((s: any) => s.title === logicItem.title);

            return {
                ...logicItem,
                subheadings: skeletonItem?.subheadings || [],
                uspNotes: logicItem.uspNotes || [],
                suppress: logicItem.suppress || [],
                augment: logicItem.augment || [],
                difficulty: logicItem.difficulty || 'easy',
                writingMode: logicItem.writingMode || 'direct'
            };
        });

        const combinedRules = [
            ...(voiceData.competitorBrands || []),
            ...(voiceData.competitorProducts || [])
        ];

        // Total usage including all 3 calls (Outline, Logic, Voice)
        const totalUsage = {
            inputTokens: (outlineRes.usage?.inputTokens || 0) + (logicRes.usage?.inputTokens || 0) + (voiceRes.usage?.inputTokens || 0),
            outputTokens: (outlineRes.usage?.outputTokens || 0) + (logicRes.usage?.outputTokens || 0) + (voiceRes.usage?.outputTokens || 0),
            totalTokens: (outlineRes.usage?.totalTokens || 0) + (logicRes.usage?.totalTokens || 0) + (voiceRes.usage?.totalTokens || 0),
        };

        const totalCost = {
            inputCost: (outlineRes.cost?.inputCost || 0) + (logicRes.cost?.inputCost || 0) + (voiceRes.cost?.inputCost || 0),
            outputCost: (outlineRes.cost?.outputCost || 0) + (logicRes.cost?.outputCost || 0) + (voiceRes.cost?.outputCost || 0),
            totalCost: (outlineRes.cost?.totalCost || 0) + (logicRes.cost?.totalCost || 0) + (voiceRes.cost?.totalCost || 0),
        };

        return {
            data: {
                h1Title: outlineData.h1Title || '',
                introText: outlineData.introText || '',
                structure: normalizedStructure,
                keyInformationPoints: outlineData.keyInformationPoints || [],
                generalPlan: voiceData.generalPlan || [],
                conversionPlan: voiceData.conversionPlan || [],
                brandExclusivePoints: voiceData.brandExclusivePoints || [],
                replacementRules: combinedRules,
                competitorBrands: voiceData.competitorBrands || [],
                competitorProducts: voiceData.competitorProducts || [],
                regionVoiceDetect: voiceData.regionVoiceDetect,
                humanWritingVoice: voiceData.humanWritingVoice,
                toneSensation: voiceData.toneSensation,
                entryPoint: voiceData.entryPoint
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
