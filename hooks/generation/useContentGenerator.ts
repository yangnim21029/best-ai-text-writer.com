import { ArticleConfig, SectionAnalysis } from '../../types';
import { useGenerationStore } from '../../store/useGenerationStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useMetricsStore } from '../../store/useMetricsStore';
import { generateSectionContent } from '../../services/contentGenerationService';
import { mergeTurboSections } from '../../services/turboRenderer';
import { refineAllHeadings } from './useHeadingRefiner';

import { cleanHeadingText, stripLeadingHeading } from '../../utils/textUtils';
import { planImagesForArticle, generateImage } from '../../services/imageService';
import { appendAnalysisLog } from './generationLogger';

const isStopped = () => useGenerationStore.getState().isStopped;

export const runContentGeneration = async (
    config: ArticleConfig,
    analysisResults: {
        productResult: any;
        structureResult: any;
    }
) => {
    const generationStore = useGenerationStore.getState();
    const analysisStore = useAnalysisStore.getState();
    const metricsStore = useMetricsStore.getState();

    const { productResult, structureResult } = analysisResults;
    const parsedProductBrief = productResult?.brief;
    const productMappingData = productResult?.mapping || [];
    const refAnalysisData = structureResult?.structRes.data;
    const authAnalysisData = structureResult?.authRes.data;

    // 1. Determine Sections
    let sectionsToGenerate: (Partial<SectionAnalysis> & { title: string; specificPlan?: string[] })[] = [];
    let isUsingCustomOutline = false;

    if (config.sampleOutline && config.sampleOutline.trim().length > 0) {
        const lines = config.sampleOutline.split('\n').map(line => line.trim()).filter(line => line.length > 0);
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
        ...config,
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

    const getKeywordPlans = () => useAnalysisStore.getState().keywordPlans || [];

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
            const futureTitles = allTitles.slice(i + 1);
            const analysisPlan = refAnalysisData?.structure.find((s: any) => s.title === section.title)?.narrativePlan;
            const specificPlan = section.specificPlan || analysisPlan;

            const loopConfig = { ...generatorConfig, productMapping: productMappingData };
            const dummyPreviousContent = i > 0 ? [`[Preceding Section: ${allTitles[i - 1]}]`] : [];

            try {
                const res = await generateSectionContent(
                    loopConfig,
                    section.title,
                    specificPlan,
                    refAnalysisData?.generalPlan,
                    getKeywordPlans(),
                    dummyPreviousContent,
                    futureTitles,
                    authAnalysisData,
                    allKeyPoints,
                    [],
                    0,
                    section
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
            await refineAllHeadings(sectionHeadings, sectionsToGenerate, config, renderProgressSections);
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
                const analysisPlan = refAnalysisData?.structure.find((s: any) => s.title === section.title)?.narrativePlan;
                const specificPlan = section.specificPlan || analysisPlan;
                const loopConfig = { ...generatorConfig, productMapping: productMappingData };

                const res = await generateSectionContent(
                    loopConfig,
                    section.title,
                    specificPlan,
                    refAnalysisData?.generalPlan,
                    getKeywordPlans(),
                    previousTitles,
                    futureTitles,
                    authAnalysisData,
                    allKeyPoints,
                    currentCoveredPoints,
                    totalInjectedCount,
                    section
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
            await refineAllHeadings(sectionHeadings, sectionsToGenerate, config, renderProgressSections);
        }
    }

    if (!isStopped()) {
        // --- IMAGE GENERATION PHASE ---
        generationStore.setGenerationStep('generating_images');
        const fullContent = sectionBodies.join('\n\n');

        try {
            appendAnalysisLog('Planning visual assets...');
            const imagePlans = await planImagesForArticle(
                fullContent,
                analysisStore.scrapedImages,
                config.targetAudience,
                analysisStore.visualStyle
            );

            console.log(`[Images] Planned ${imagePlans.data.length} images`);
            appendAnalysisLog(`Visual plan ready: ${imagePlans.data.length} images.`);
            metricsStore.addCost(imagePlans.cost.totalCost, imagePlans.usage.totalTokens);

            // Generate images in parallel (limit concurrency if needed, but for now all at once is fine for small batches)
            const imagePromises = imagePlans.data.map(async (plan) => {
                if (isStopped()) return;
                try {
                    const label = plan.category || plan.insertAfter || plan.id;
                    appendAnalysisLog(`Generating image: ${label}...`);
                    const imgRes = await generateImage(plan.generatedPrompt);

                    if (imgRes.data) {
                        // In a real app, you'd save this to a store or insert it into the content.
                        // For now, we'll just log it and maybe append it to the end or store it.
                        // TODO: Store generated images in a store for the UI to display or insert.
                        console.log(`[Images] Generated: ${plan.id}`);
                        metricsStore.addCost(imgRes.cost.totalCost, imgRes.usage.totalTokens);
                    }
                } catch (e) {
                    console.error(`Failed to generate image ${plan.id}`, e);
                }
            });

            await Promise.all(imagePromises);
            appendAnalysisLog('Image generation completed.');

        } catch (e) {
            console.error("Image generation phase failed", e);
            appendAnalysisLog('Image generation failed.');
        }

        generationStore.setGenerationStep('finalizing');
        setTimeout(() => {
            generationStore.setStatus('completed');
            generationStore.setGenerationStep('idle');
        }, 1000);
    }
};
