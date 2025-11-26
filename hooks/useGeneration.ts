import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAppStore } from '../store/useAppStore';
import { ArticleConfig } from '../types';
import { generateSectionContent } from '../services/geminiService';
import { analyzeText } from '../services/nlpService';
import { extractKeywordActionPlans, analyzeReferenceStructure, analyzeAuthorityTerms } from '../services/extractionService';
import { generateProblemProductMapping, parseProductContext } from '../services/productService';
import { analyzeImageWithAI, analyzeVisualStyle } from '../services/imageService';
import { buildTurboPlaceholder, mergeTurboSections } from '../services/turboRenderer';

const runGeneration = async (config: ArticleConfig, store: ReturnType<typeof useAppStore.getState>) => {
        // Reset State
        store.resetGeneration();
        store.setStatus('analyzing');
        store.setScrapedImages(config.scrapedImages || []);
        store.setTargetAudience(config.targetAudience);

        // Inject global Brand Knowledge from store if not provided (or merge?)
        // In App.tsx it was passed from state. Here we can read it.
        const fullConfig = {
            ...config,
            brandKnowledge: store.brandKnowledge
        };

        try {
            // --- ASYNC OPTIMIZATION: Define Parallel Tasks ---

            // Task 1: Product Context
            const productTask = async () => {
                let parsedProductBrief = config.productBrief;
                let generatedMapping: any[] = [];

                if (!parsedProductBrief && config.productRawText && config.productRawText.length > 5) {
                    if (useAppStore.getState().isStopped) return { mapping: [] };
                    store.setGenerationStep('parsing_product');
                    const parseRes = await parseProductContext(config.productRawText);
                    console.log(`[Timer] Product Context Parse: ${parseRes.duration}ms`);
                    parsedProductBrief = parseRes.data;
                    store.addCost(parseRes.cost.totalCost, parseRes.usage.totalTokens);
                }

                if (parsedProductBrief && parsedProductBrief.productName) {
                    if (useAppStore.getState().isStopped) return { brief: parsedProductBrief, mapping: [] };
                    store.setGenerationStep('mapping_product');
                    const mapRes = await generateProblemProductMapping(parsedProductBrief, fullConfig.targetAudience);
                    console.log(`[Timer] Product Mapping: ${mapRes.duration}ms`);
                    generatedMapping = mapRes.data;
                    store.setProductMapping(generatedMapping);
                    store.addCost(mapRes.cost.totalCost, mapRes.usage.totalTokens);
                }

                store.setActiveProductBrief(parsedProductBrief);
                return { brief: parsedProductBrief, mapping: generatedMapping };
            };

            // Task 2: NLP & Keyword Planning
            const keywordTask = async () => {
                if (useAppStore.getState().isStopped) return;
                store.setGenerationStep('nlp_analysis');
                const keywords = await analyzeText(fullConfig.referenceContent);

                if (keywords.length > 0 && !useAppStore.getState().isStopped) {
                    store.setGenerationStep('planning_keywords');
                    try {
                        const planRes = await extractKeywordActionPlans(fullConfig.referenceContent, keywords, fullConfig.targetAudience);
                        console.log(`[Timer] Keyword Action Plan: ${planRes.duration}ms`);
                        store.setKeywordPlans(planRes.data);
                        store.addCost(planRes.cost.totalCost, planRes.usage.totalTokens);
                    } catch (e) {
                        console.warn("Action Plan extraction failed", e);
                    }
                }
            };

            // Task 3: Structure & Authority
            const structureTask = async () => {
                if (useAppStore.getState().isStopped) return;
                store.setGenerationStep('extracting_structure');
                const structPromise = analyzeReferenceStructure(fullConfig.referenceContent, fullConfig.targetAudience);
                const authPromise = analyzeAuthorityTerms(
                    fullConfig.authorityTerms || '',
                    fullConfig.title,
                    fullConfig.websiteType || 'General Professional Website',
                    fullConfig.targetAudience
                );

                const [structRes, authRes] = await Promise.all([structPromise, authPromise]);
                console.log(`[Timer] Structure Analysis: ${structRes.duration}ms`);
                console.log(`[Timer] Authority Analysis: ${authRes.duration}ms`);

                store.addCost(structRes.cost.totalCost, structRes.usage.totalTokens);
                store.addCost(authRes.cost.totalCost, authRes.usage.totalTokens);

                store.setRefAnalysis(structRes.data);
                store.setAuthAnalysis(authRes.data);

                return { structRes, authRes };
            };

            // Task 4: Image Analysis & Visual Style
            const visualTask = async () => {
                if (useAppStore.getState().isStopped) return;
                store.setGenerationStep('analyzing_visuals');

                const initialImages = config.scrapedImages || [];
                const imagesToAnalyze = initialImages.slice(0, 5);
                let analyzedImages = [...initialImages];

                if (imagesToAnalyze.length > 0) {
                    for (let i = 0; i < imagesToAnalyze.length; i++) {
                        if (useAppStore.getState().isStopped) break;
                        const img = imagesToAnalyze[i];
                        if (img.url) {
                            try {
                                const res = await analyzeImageWithAI(img.url);
                                analyzedImages[i] = { ...analyzedImages[i], aiDescription: res.data };
                                store.addCost(res.cost.totalCost, res.usage.totalTokens);
                            } catch (e) {
                                console.warn(`Failed to analyze image ${img.url}`, e);
                            }
                        }
                    }
                    store.setScrapedImages(analyzedImages);
                }

                try {
                    const styleRes = await analyzeVisualStyle(analyzedImages, fullConfig.websiteType || "Modern Business");
                    store.setVisualStyle(styleRes.data);
                    store.addCost(styleRes.cost.totalCost, styleRes.usage.totalTokens);
                } catch (e) {
                    console.warn("Failed to extract visual style", e);
                }
            };

            // --- EXECUTE PARALLEL ---
            const [productResult, _, structureResult, __] = await Promise.all([
                productTask(),
                keywordTask(),
                structureTask(),
                visualTask()
            ]);

            if (useAppStore.getState().isStopped) return;

            // --- PREPARE WRITING LOOP ---
            const parsedProductBrief = productResult.brief;
            const productMappingData = productResult.mapping;
            const refAnalysisData = structureResult?.structRes.data;
            const authAnalysisData = structureResult?.authRes.data;

            let sectionsToGenerate: { title: string; specificPlan?: string[] }[] = [];
            let isUsingCustomOutline = false;

            if (fullConfig.sampleOutline && fullConfig.sampleOutline.trim().length > 0) {
                const lines = fullConfig.sampleOutline.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                sectionsToGenerate = lines.map(title => ({ title }));
                isUsingCustomOutline = true;
            } else if (refAnalysisData?.structure && refAnalysisData.structure.length > 0) {
                sectionsToGenerate = refAnalysisData.structure;
                isUsingCustomOutline = false;
            } else {
                sectionsToGenerate = [
                    { title: "Introduction" },
                    { title: "Core Concepts" },
                    { title: "Benefits" },
                    { title: "Applications" },
                    { title: "Conclusion" }
                ];
            }

            store.setStatus('streaming');
            store.setGenerationStep('writing_content');
            // store.setShowInput(false); // Let UI decide

            const sectionResults: string[] = new Array(sectionsToGenerate.length).fill("");
            const allKeyPoints = refAnalysisData?.keyInformationPoints || [];
            let currentCoveredPoints: string[] = [];
            let totalInjectedCount = 0;

            const generatorConfig = {
                ...fullConfig,
                productBrief: parsedProductBrief,
                referenceAnalysis: refAnalysisData,
                authorityAnalysis: authAnalysisData,
            };

            // --- PARALLEL EXECUTION (TURBO MODE) ---
            if (config.turboMode) {
                const outlineSourceLabel = isUsingCustomOutline
                    ? `<span class="text-blue-600">User Custom Outline</span>`
                    : `<span class="text-indigo-600">AI Narrative Structure (Outline)</span>`;

                const initialDisplay = buildTurboPlaceholder(sectionsToGenerate, outlineSourceLabel);
                store.setContent(initialDisplay);

                const promises = sectionsToGenerate.map(async (section, i) => {
                    if (useAppStore.getState().isStopped) return;

                    const allTitles = sectionsToGenerate.map(s => s.title);
                    const previousTitles = allTitles.slice(0, i);
                    const futureTitles = allTitles.slice(i + 1);
                    const analysisPlan = refAnalysisData?.structure.find(s => s.title === section.title)?.narrativePlan;
                    const specificPlan = section.specificPlan || analysisPlan;

                    const loopConfig = { ...generatorConfig, productMapping: productMappingData };
                    const dummyPreviousContent = i > 0 ? [`[Preceding Section: ${previousTitles[i - 1]}]`] : [];

                    try {
                        const res = await generateSectionContent(
                            loopConfig,
                            section.title,
                            specificPlan,
                            refAnalysisData?.generalPlan,
                            store.keywordPlans, // Read from store
                            dummyPreviousContent,
                            futureTitles,
                            authAnalysisData,
                            allKeyPoints,
                            [],
                            0
                        );

                        if (!useAppStore.getState().isStopped) {
                            sectionResults[i] = res.data.content;
                            console.log(`[Timer - Turbo] Section '${section.title}': ${res.duration}ms`);

                            store.setContent(mergeTurboSections(sectionsToGenerate, sectionResults));
                            store.addCost(res.cost.totalCost, res.usage.totalTokens);

                            if (res.data.usedPoints && res.data.usedPoints.length > 0) {
                                store.setCoveredPoints(prev => {
                                    const newUnique = res.data.usedPoints.filter(p => !prev.includes(p));
                                    return [...prev, ...newUnique];
                                });
                            }
                        }
                    } catch (err) {
                        console.error(`Parallel gen error for ${section.title}`, err);
                        sectionResults[i] = `\n\n> **Error generating section: ${section.title}**\n\n`;
                        const sectionDisplays = sectionResults.map((c, idx) => c || `> ...Waiting: ${sectionsToGenerate[idx].title}`).join('\n\n');
                        store.setContent(headerBanner + sectionDisplays);
                    }
                });

                await Promise.all(promises);

                if (!useAppStore.getState().isStopped) {
                    store.setContent(sectionResults.join('\n\n'));
                }

            } else {
                // --- SEQUENTIAL EXECUTION ---
                for (let i = 0; i < sectionsToGenerate.length; i++) {
                    if (useAppStore.getState().isStopped) break;

                    const section = sectionsToGenerate[i];
                    const allTitles = sectionsToGenerate.map(s => s.title);
                    const previousTitles = allTitles.slice(0, i);
                    const futureTitles = allTitles.slice(i + 1);

                    try {
                        const analysisPlan = refAnalysisData?.structure.find(s => s.title === section.title)?.narrativePlan;
                        const specificPlan = section.specificPlan || analysisPlan;
                        const loopConfig = { ...generatorConfig, productMapping: productMappingData };

                        const res = await generateSectionContent(
                            loopConfig,
                            section.title,
                            specificPlan,
                            refAnalysisData?.generalPlan,
                            store.keywordPlans,
                            previousTitles,
                            futureTitles,
                            authAnalysisData,
                            allKeyPoints,
                            currentCoveredPoints,
                            totalInjectedCount
                        );
                        console.log(`[Timer] Section '${section.title}': ${res.duration}ms`);
                        store.addCost(res.cost.totalCost, res.usage.totalTokens);

                        if (!useAppStore.getState().isStopped) {
                            sectionResults[i] = res.data.content;
                            store.setContent(sectionResults.filter(s => s).join('\n\n'));

                            if (res.data.usedPoints && res.data.usedPoints.length > 0) {
                                currentCoveredPoints = [...currentCoveredPoints, ...res.data.usedPoints];
                                store.setCoveredPoints(currentCoveredPoints);
                            }
                            if (res.data.injectedCount) {
                                totalInjectedCount += res.data.injectedCount;
                            }
                        }
                    } catch (err) {
                        console.error(`Failed to generate section: ${section.title}`, err);
                        sectionResults[i] = `\n\n> **Error generating section: ${section.title}**\n\n`;
                        store.setContent(sectionResults.filter(s => s).join('\n\n'));
                    }
                }
            }

            if (!useAppStore.getState().isStopped) {
                store.setGenerationStep('finalizing');
                setTimeout(() => {
                    store.setStatus('completed');
                    store.setGenerationStep('idle');
                }, 1000);
            }
        } catch (err: any) {
            console.error(err);
            store.setError(err.message || "An unexpected error occurred during generation.");
            store.setStatus('error');
            store.setGenerationStep('idle');
        }
};

export const useGeneration = () => {
    const store = useAppStore();

    const mutation = useMutation({
        mutationFn: (config: ArticleConfig) => runGeneration(config, useAppStore.getState()),
    });

    const generate = useCallback(async (config: ArticleConfig) => {
        await mutation.mutateAsync(config);
    }, [mutation]);

    const stop = useCallback(() => {
        store.stopGeneration();
    }, [store]);

    return { generate, stop, status: mutation.status };
};
