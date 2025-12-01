import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArticleConfig } from '../types';
import { generateSectionContent, refineSectionHeadings } from '../services/contentGenerationService';
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


const cleanHeadingText = (value: string | undefined): string => {
    return (value || '')
        .replace(/^#+\s*/, '')
        .replace(/["“”]/g, '')
        .trim();
};

const stripLeadingHeading = (content: string): string => {
    if (!content) return '';
    // Remove a leading H1/H2/H3 tag or markdown heading to avoid duplicates after we inject headings ourselves.
    const withoutHtmlHeading = content.replace(/^\s*<h[1-6][^>]*>.*?<\/h[1-6]>\s*/i, '');
    const withoutMdHeading = withoutHtmlHeading.replace(/^\s*#{1,6}\s.*(\r?\n|$)/, '');
    return withoutMdHeading.trim();
};

const runGeneration = async (config: ArticleConfig) => {
    const generationStore = useGenerationStore.getState();
    const analysisStore = useAnalysisStore.getState();
    const metricsStore = useMetricsStore.getState();
    const appendAnalysisLog = (msg: string) => {
        // Only append logs to content during the analysis phase
        if (useGenerationStore.getState().status === 'analyzing') {
            generationStore.setContent(prev => {
                const next = typeof prev === 'string' ? prev : '';
                return next ? `${next}\n${msg}` : msg;
            });
        } else {
            console.log(`[Background Log]: ${msg}`);
        }
    };
    const summarizeList = (items: string[], max: number = 5) => {
        const slice = items.slice(0, max);
        const more = items.length > max ? ` +${items.length - max}` : '';
        return slice.join(', ') + more;
    };

    // Reset State
    resetGenerationState();
    generationStore.setStatus('analyzing');
    analysisStore.setScrapedImages(config.scrapedImages || []);
    analysisStore.setTargetAudience(config.targetAudience);
    analysisStore.setArticleTitle(config.title || '');
    appendAnalysisLog('Starting analysis...');

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
                appendAnalysisLog('Parsing product brief and CTA...');
                const parseRes = await parseProductContext(config.productRawText);
                console.log(`[Timer] Product Context Parse: ${parseRes.duration}ms`);
                parsedProductBrief = parseRes.data;
                appendAnalysisLog('Product brief parsed.');
                metricsStore.addCost(parseRes.cost.totalCost, parseRes.usage.totalTokens);
            }

            if (parsedProductBrief && parsedProductBrief.productName) {
                if (isStopped()) return { brief: parsedProductBrief, mapping: [] };
                generationStore.setGenerationStep('mapping_product');
                appendAnalysisLog('Mapping pain points to product features...');
                const mapRes = await generateProblemProductMapping(parsedProductBrief, fullConfig.targetAudience);
                console.log(`[Timer] Product Mapping: ${mapRes.duration}ms`);
                generatedMapping = mapRes.data;
                analysisStore.setProductMapping(generatedMapping);
                if (generatedMapping.length > 0) {
                    const example = generatedMapping[0];
                    appendAnalysisLog(`Product-feature mapping ready (${generatedMapping.length}). e.g., ${example.painPoint} → ${example.productFeature}`);
                } else {
                    appendAnalysisLog('Product-feature mapping ready (no matches found).');
                }
                metricsStore.addCost(mapRes.cost.totalCost, mapRes.usage.totalTokens);
            }

            analysisStore.setActiveProductBrief(parsedProductBrief);
            return { brief: parsedProductBrief, mapping: generatedMapping };
        };

        // Task 2: NLP & Keyword Planning
        const keywordTask = async () => {
            if (isStopped()) return;
            generationStore.setGenerationStep('nlp_analysis');
            appendAnalysisLog('Running NLP keyword scan...');
            const keywords = await analyzeText(fullConfig.referenceContent);
            const topTokens = summarizeList(keywords.map(k => k.token), 6);
            appendAnalysisLog(`NLP scan found ${keywords.length} keywords. Top: ${topTokens}`);

            if (keywords.length > 0 && !isStopped()) {
                generationStore.setGenerationStep('planning_keywords');
                try {
                    appendAnalysisLog('Planning keyword strategy...');
                    const planRes = await extractKeywordActionPlans(fullConfig.referenceContent, keywords, fullConfig.targetAudience);
                    console.log(`[Timer] Keyword Action Plan: ${planRes.duration}ms`);
                    analysisStore.setKeywordPlans(planRes.data);
                    const planWords = summarizeList(planRes.data.map(p => p.word), 6);
                    appendAnalysisLog(`Keyword plan ready (${planRes.data.length}). Focus: ${planWords}`);
                    metricsStore.addCost(planRes.cost.totalCost, planRes.usage.totalTokens);
                } catch (e) {
                    console.warn("Action Plan extraction failed", e);
                    appendAnalysisLog('Keyword planning failed (continuing).');
                }
            }
        };

        // Task 3: Structure & Authority (run concurrently)
        const structureTask = async () => {
            if (isStopped()) return;
            generationStore.setGenerationStep('extracting_structure');
            appendAnalysisLog('Extracting reference structure and authority signals...');
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
            appendAnalysisLog(`Structure extracted (${structRes.data?.structure?.length || 0} sections).`);
            appendAnalysisLog('Authority terms mapped.');
            if (structRes.data?.structure?.length) {
                const sectionTitles = summarizeList(structRes.data.structure.map((s: any) => s.title), 6);
                appendAnalysisLog(`Sections: ${sectionTitles}`);
            }
            if (authRes.data?.relevantTerms?.length) {
                appendAnalysisLog(`Authority terms: ${summarizeList(authRes.data.relevantTerms, 6)}`);
            }

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
            appendAnalysisLog('Analyzing source images and visual identity...');

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
                appendAnalysisLog(`✓ Visual style extracted: ${styleRes.data}`);
                metricsStore.addCost(styleRes.cost.totalCost, styleRes.usage.totalTokens);
            } catch (e) {
                console.warn("Failed to extract visual style", e);
                appendAnalysisLog('Visual style extraction skipped.');
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
        appendAnalysisLog('Analysis stage completed. Preparing to write...');

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
        generationStore.setContent('');

        const sectionBodies: string[] = new Array(sectionsToGenerate.length).fill("");
        const sectionHeadings: string[] = sectionsToGenerate.map((s) => cleanHeadingText(s.title));
        const allKeyPoints = refAnalysisData?.keyInformationPoints || [];
        let currentCoveredPoints: string[] = [];
        let totalInjectedCount = 0;

        const generatorConfig = {
            ...fullConfig,
            productBrief: parsedProductBrief,
            referenceAnalysis: refAnalysisData,
            authorityAnalysis: authAnalysisData,
        };

        const getHeading = (idx: number) => cleanHeadingText(sectionHeadings[idx] || sectionsToGenerate[idx]?.title || `Section ${idx + 1}`);

        const renderSectionBlock = (idx: number, bodyOverride?: string) => {
            const heading = getHeading(idx);
            const body = typeof bodyOverride === 'string' ? bodyOverride : sectionBodies[idx];
            if (body) return `## ${heading}\n\n${body}`;
            return `## ${heading}\n\n_(Writing...)_`;
        };

        const renderTurboSections = () => mergeTurboSections(
            sectionsToGenerate,
            sectionBodies.map((body, idx) => body ? renderSectionBlock(idx, body) : "")
        );

        const renderProgressSections = () => sectionBodies
            .map((_, idx) => renderSectionBlock(idx))
            .join('\n\n');

        const refineAllHeadings = async () => {
            if (isStopped()) return;
            console.log('[Heading Refinement] Starting...');
            generationStore.setGenerationStep('refining_headings');
            const headingsInput = sectionHeadings.map((h, idx) => cleanHeadingText(h || sectionsToGenerate[idx]?.title));
            if (headingsInput.length === 0) return;
            console.log('[Heading Refinement] Processing', headingsInput.length, 'headings');
            try {
                const refineRes = await refineSectionHeadings(
                    fullConfig.title || "Article",
                    headingsInput,
                    fullConfig.targetAudience
                );
                console.log('[Heading Refinement] Completed successfully');
                const refinedList = headingsInput.map((before, idx) => {
                    const match = refineRes.data?.find((h: any) => cleanHeadingText(h.before) === before) || refineRes.data?.[idx];
                    return cleanHeadingText(match?.after || match?.before || before);
                });
                refinedList.forEach((heading, index) => {
                    sectionHeadings[index] = heading;
                });
                metricsStore.addCost(refineRes.cost.totalCost, refineRes.usage.totalTokens);
                generationStore.setContent(renderProgressSections());
            } catch (err) {
                console.error('[Heading Refinement] FAILED:', err);
                // Continue with original headings on failure
            }
        };

        // --- PARALLEL EXECUTION (TURBO MODE) ---
        if (config.turboMode) {
            const outlineSourceLabel = isUsingCustomOutline
                ? `**User Custom Outline**`
                : `**AI Narrative Structure (Outline)**`;

            const initialDisplay = `> 📑 **Active Blueprint:** ${outlineSourceLabel}\n\n`;
            generationStore.setContent(initialDisplay);

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
                        sectionBodies[i] = stripLeadingHeading(res.data.content);
                        console.log(`[Timer - Turbo] Section '${section.title}': ${res.duration}ms`);

                        generationStore.setContent(renderTurboSections());
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
                    generationStore.setContent(renderTurboSections());
                }
            });

            await Promise.all(promises);

            if (!isStopped()) {
                generationStore.setContent(renderProgressSections());
                await refineAllHeadings();
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
                        sectionBodies[i] = stripLeadingHeading(res.data.content);
                        generationStore.setContent(renderProgressSections());

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
                    sectionBodies[i] = ''; // Suppress error message in content
                    generationStore.setContent(renderProgressSections());
                }
            }

            if (!isStopped()) {
                await refineAllHeadings();
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
