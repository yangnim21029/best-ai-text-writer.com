import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArticleConfig } from '../types';
import { generateSectionContent, generateSectionHeading } from '../services/contentGenerationService';
import { analyzeText } from '../services/nlpService';
import { extractKeywordActionPlans } from '../services/keywordAnalysisService';
import { analyzeReferenceStructure } from '../services/referenceAnalysisService';
import { analyzeAuthorityTerms } from '../services/authorityService';
import { generateProblemProductMapping, parseProductContext } from '../services/productService';
import { analyzeImageWithAI, analyzeVisualStyle } from '../services/imageService';
import { buildTurboPlaceholder, mergeTurboSections } from '../services/turboRenderer';
import { useGenerationStore } from '../store/useGenerationStore';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { useMetricsStore } from '../store/useMetricsStore';
import { resetGenerationState } from '../store/resetGenerationState';

const isStopped = () => useGenerationStore.getState().isStopped;
const turboHeaderBanner = `
    <div class="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-xs font-mono text-slate-500">
        <span class="font-bold text-slate-700">📑 Active Blueprint:</span> <span class="text-blue-600">Turbo Mode</span>
    </div>
`;

const runGeneration = async (config: ArticleConfig) => {
    const generationStore = useGenerationStore.getState();
    const analysisStore = useAnalysisStore.getState();
    const metricsStore = useMetricsStore.getState();

    // Reset State
    resetGenerationState();
    generationStore.setStatus('analyzing');
    analysisStore.setScrapedImages(config.scrapedImages || []);
    analysisStore.setTargetAudience(config.targetAudience);
    analysisStore.setArticleTitle(config.title || '');

    // Inject global Brand Knowledge from store if not provided (or merge?)
    // In App.tsx it was passed from state. Here we can read it.
    const fullConfig = {
        ...config,
        brandKnowledge: analysisStore.brandKnowledge
    };

    try {
        // --- ASYNC OPTIMIZATION: Define Parallel Tasks ---

        // Task 1: Product Context
        const productTask = async () => {
            let parsedProductBrief = config.productBrief;
            let generatedMapping: any[] = [];

            if (!parsedProductBrief && config.productRawText && config.productRawText.length > 5) {
                if (isStopped()) return { mapping: [] };
                generationStore.setGenerationStep('parsing_product');
                const parseRes = await parseProductContext(config.productRawText);
                console.log(`[Timer] Product Context Parse: ${parseRes.duration}ms`);
                parsedProductBrief = parseRes.data;
                metricsStore.addCost(parseRes.cost.totalCost, parseRes.usage.totalTokens);
            }

            if (parsedProductBrief && parsedProductBrief.productName) {
                if (isStopped()) return { brief: parsedProductBrief, mapping: [] };
                generationStore.setGenerationStep('mapping_product');
                const mapRes = await generateProblemProductMapping(parsedProductBrief, fullConfig.targetAudience);
                console.log(`[Timer] Product Mapping: ${mapRes.duration}ms`);
                generatedMapping = mapRes.data;
                analysisStore.setProductMapping(generatedMapping);
                metricsStore.addCost(mapRes.cost.totalCost, mapRes.usage.totalTokens);
            }

            analysisStore.setActiveProductBrief(parsedProductBrief);
            return { brief: parsedProductBrief, mapping: generatedMapping };
        };

        // Task 2: NLP & Keyword Planning
        const keywordTask = async () => {
            if (isStopped()) return;
            generationStore.setGenerationStep('nlp_analysis');
            const keywords = await analyzeText(fullConfig.referenceContent);

            if (keywords.length > 0 && !isStopped()) {
                generationStore.setGenerationStep('planning_keywords');
                try {
                    const planRes = await extractKeywordActionPlans(fullConfig.referenceContent, keywords, fullConfig.targetAudience);
                    console.log(`[Timer] Keyword Action Plan: ${planRes.duration}ms`);
                    analysisStore.setKeywordPlans(planRes.data);
                    metricsStore.addCost(planRes.cost.totalCost, planRes.usage.totalTokens);
                } catch (e) {
                    console.warn("Action Plan extraction failed", e);
                }
            }
        };

        // Task 3: Structure & Authority (run concurrently)
        const structureTask = async () => {
            if (isStopped()) return;
            generationStore.setGenerationStep('extracting_structure');
            const [structRes, authRes] = await Promise.all([
                analyzeReferenceStructure(fullConfig.referenceContent, fullConfig.targetAudience),
                analyzeAuthorityTerms(
                    fullConfig.authorityTerms || '',
                    fullConfig.title,
                    fullConfig.websiteType || 'General Professional Website',
                    fullConfig.targetAudience
                )
            ]);

            console.log(`[Timer] Structure Analysis: ${structRes.duration}ms`);
            console.log(`[Timer] Authority Analysis: ${authRes.duration}ms`);

            metricsStore.addCost(structRes.cost.totalCost, structRes.usage.totalTokens);
            metricsStore.addCost(authRes.cost.totalCost, authRes.usage.totalTokens);

            analysisStore.setRefAnalysis(structRes.data);
            analysisStore.setAuthAnalysis(authRes.data);

            return { structRes, authRes };
        };

        // Task 4: Image Analysis & Visual Style
        const visualTask = async () => {
            if (isStopped()) return;
            generationStore.setGenerationStep('analyzing_visuals');

            const initialImages = config.scrapedImages || [];
            const imagesToAnalyze = initialImages.slice(0, 5);
            let analyzedImages = [...initialImages];

            if (imagesToAnalyze.length > 0) {
                for (let i = 0; i < imagesToAnalyze.length; i++) {
                    if (isStopped()) break;
                    const img = imagesToAnalyze[i];
                    if (img.url) {
                        try {
                            const res = await analyzeImageWithAI(img.url);
                            analyzedImages[i] = { ...analyzedImages[i], aiDescription: res.data };
                            metricsStore.addCost(res.cost.totalCost, res.usage.totalTokens);
                        } catch (e) {
                            console.warn(`Failed to analyze image ${img.url}`, e);
                        }
                    }
                }
                analysisStore.setScrapedImages(analyzedImages);
            }

            try {
                const styleRes = await analyzeVisualStyle(analyzedImages, fullConfig.websiteType || "Modern Business");
                analysisStore.setVisualStyle(styleRes.data);
                metricsStore.addCost(styleRes.cost.totalCost, styleRes.usage.totalTokens);
            } catch (e) {
                console.warn("Failed to extract visual style", e);
            }
        };

        // --- EXECUTE PARALLEL ---
        const productPromise = productTask();
        const keywordPromise = keywordTask();
        const structurePromise = structureTask();
        const visualPromise = visualTask();

        const [productResult, structureResult] = await Promise.all([
            productPromise,
            structurePromise
        ]);

        if (config.turboMode) {
            keywordPromise.catch(err => console.warn('Keyword task failed (turbo background)', err));
            visualPromise.catch(err => console.warn('Visual task failed (turbo background)', err));
        } else {
            await Promise.all([keywordPromise, visualPromise]);
        }

        if (isStopped()) return;

        // --- PREPARE WRITING LOOP ---
        const parsedProductBrief = productResult?.brief;
        const productMappingData = productResult?.mapping || [];
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

        generationStore.setStatus('streaming');
        generationStore.setGenerationStep('writing_content');

        const sectionBodies: string[] = new Array(sectionsToGenerate.length).fill("");
        const sectionHeadings: string[] = new Array(sectionsToGenerate.length).fill("");
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

        const combineSections = () => sectionBodies.map((body, idx) => {
            const heading = sectionHeadings[idx];
            if (heading && body) return `<div><h3>${heading}</h3>\n${body}</div>`;
            if (heading) return `<div><h3>${heading}</h3></div>`;
            return body;
        });

        // --- PARALLEL EXECUTION (TURBO MODE) ---
        if (config.turboMode) {
            const outlineSourceLabel = isUsingCustomOutline
                ? `<span class="text-blue-600">User Custom Outline</span>`
                : `<span class="text-indigo-600">AI Narrative Structure (Outline)</span>`;

            const initialDisplay = buildTurboPlaceholder(sectionsToGenerate, outlineSourceLabel);
            generationStore.setContent(initialDisplay);

            const headingPromises = sectionsToGenerate.map(async (section, i) => {
                if (isStopped()) return;
                try {
                    const analysisPlan = refAnalysisData?.structure.find(s => s.title === section.title)?.narrativePlan;
                    const headingRes = await generateSectionHeading(
                        generatorConfig,
                        section.title,
                        analysisPlan,
                        analysisStore.keywordPlans,
                        allKeyPoints
                    );
                    sectionHeadings[i] = headingRes.data;
                    metricsStore.addCost(headingRes.cost.totalCost, headingRes.usage.totalTokens);
                    const combined = combineSections();
                    generationStore.setContent(mergeTurboSections(sectionsToGenerate, combined));
                } catch (err) {
                    console.warn(`Heading generation failed for ${section.title}`, err);
                }
            });

            const promises = sectionsToGenerate.map(async (section, i) => {
                if (isStopped()) return;

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
                        analysisStore.keywordPlans,
                        dummyPreviousContent,
                        futureTitles,
                        authAnalysisData,
                        allKeyPoints,
                        [],
                        0
                    );

                    if (!isStopped()) {
                        sectionBodies[i] = res.data.content;
                        console.log(`[Timer - Turbo] Section '${section.title}': ${res.duration}ms`);

                        const combined = combineSections();
                        generationStore.setContent(mergeTurboSections(sectionsToGenerate, combined));
                        metricsStore.addCost(res.cost.totalCost, res.usage.totalTokens);

                        if (res.data.usedPoints && res.data.usedPoints.length > 0) {
                            analysisStore.setCoveredPoints(prev => {
                                const newUnique = res.data.usedPoints.filter(p => !prev.includes(p));
                                return [...prev, ...newUnique];
                            });
                        }
                    }
                } catch (err) {
                    console.error(`Parallel gen error for ${section.title}`, err);
                    sectionBodies[i] = ''; // Suppress error message in content
                    const sectionDisplays = combineSections().map((c, idx) => c || `> ...Waiting: ${sectionsToGenerate[idx].title}`).join('\n\n');
                    generationStore.setContent(turboHeaderBanner + sectionDisplays);
                }
            });

            await Promise.all([...headingPromises, ...promises]);

            if (!isStopped()) {
                generationStore.setContent(combineSections().join('\n\n'));
            }

        } else {
            // --- SEQUENTIAL EXECUTION ---
            for (let i = 0; i < sectionsToGenerate.length; i++) {
                if (isStopped()) break;

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
                        analysisStore.keywordPlans,
                        previousTitles,
                        futureTitles,
                        authAnalysisData,
                        allKeyPoints,
                        currentCoveredPoints,
                        totalInjectedCount
                    );
                    console.log(`[Timer] Section '${section.title}': ${res.duration}ms`);
                    metricsStore.addCost(res.cost.totalCost, res.usage.totalTokens);

                    if (!isStopped()) {
                        sectionResults[i] = res.data.content;
                        generationStore.setContent(sectionResults.filter(s => s).join('\n\n'));

                        if (res.data.usedPoints && res.data.usedPoints.length > 0) {
                            currentCoveredPoints = [...currentCoveredPoints, ...res.data.usedPoints];
                            analysisStore.setCoveredPoints(currentCoveredPoints);
                        }
                        if (res.data.injectedCount) {
                            totalInjectedCount += res.data.injectedCount;
                        }
                    }
                } catch (err) {
                    console.error(`Failed to generate section: ${section.title}`, err);
                    sectionResults[i] = ''; // Suppress error message in content
                    generationStore.setContent(sectionResults.filter(s => s).join('\n\n'));
                }
            }
        }

        if (!isStopped()) {
            generationStore.setGenerationStep('finalizing');
            setTimeout(() => {
                generationStore.setStatus('completed');
                generationStore.setGenerationStep('idle');
            }, 1000);
        }
    } catch (err: any) {
        console.error(err);
        generationStore.setError(err.message || "An unexpected error occurred during generation.");
        generationStore.setStatus('error');
        generationStore.setGenerationStep('idle');
    }
};

export const useGeneration = () => {
    const mutation = useMutation({
        mutationFn: (config: ArticleConfig) => runGeneration(config),
    });

    const generate = useCallback(async (config: ArticleConfig) => {
        await mutation.mutateAsync(config);
    }, [mutation]);

    const stop = useCallback(() => {
        useGenerationStore.getState().stopGeneration();
    }, []);

    return { generate, stop, status: mutation.status };
};
