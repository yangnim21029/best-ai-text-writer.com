import { ArticleConfig, SectionAnalysis } from '../../types';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { useAppStore } from '@/store/useAppStore';
import { generateSectionContent } from '../../services/generation/contentGenerationService';
import { mergeTurboSections } from '../../services/generation/contentDisplayService';

import { cleanHeadingText, stripLeadingHeading } from '../../utils/textUtils';
import { planImagesForArticle, generateImage } from '../../services/generation/imageService';
import { appendAnalysisLog } from './generationLogger';
import { aiService } from '../../services/engine/aiService';

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
  const appStore = useAppStore.getState();

  const { productResult, structureResult } = analysisResults || {};
  const parsedProductBrief = analysisStore.activeProductBrief || productResult?.brief;
  const productMappingData =
    analysisStore.productMapping.length > 0
      ? analysisStore.productMapping
      : productResult?.mapping || [];

  // Prioritize AnalysisStore (which might be Synthesized or Edited)
  const refAnalysisData = analysisStore.refAnalysis || structureResult?.structRes.data;
  const authAnalysisData = analysisStore.authAnalysis || structureResult?.authRes.data;

  // Override reference content if we have a better source (e.g. from store/RAG)
  if (analysisStore.referenceContent) {
    config.referenceContent = analysisStore.referenceContent;
  }

  // 1. Determine Sections
  let sectionsToGenerate: (Partial<SectionAnalysis> & {
    title: string;
    specificPlan?: string[];
  })[] = [];
  let isUsingCustomOutline = false;

  if (config.sampleOutline && config.sampleOutline.trim().length > 0) {
    const lines = config.sampleOutline
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    sectionsToGenerate = lines.map((title) => ({ title }));
    isUsingCustomOutline = true;
  } else if (refAnalysisData?.structure && refAnalysisData.structure.length > 0) {
    sectionsToGenerate = [...refAnalysisData.structure]; // Clone to avoid mutating original
    isUsingCustomOutline = false;
  } else {
    sectionsToGenerate = [
      { title: 'Introduction' },
      { title: 'Core Concepts' },
      { title: 'Benefits' },
      { title: 'Applications' },
      { title: 'Conclusion' },
    ];
  }

  generationStore.setStatus('streaming');
  generationStore.setGenerationStep('writing_content');
  generationStore.setContent('');
  generationStore.setSectionResults([]);

  const headingOptimizations = analysisStore.headingOptimizations || [];
  const shouldUseHeadingAnalysis = !isUsingCustomOutline && headingOptimizations.length > 0;

  const resolveHeadingFromOptimizer = (title: string): string => {
    const normalizedTitle = cleanHeadingText(title);
    if (!shouldUseHeadingAnalysis) return normalizedTitle;

    const candidate = headingOptimizations.find((opt) => {
      const before = cleanHeadingText(opt.h2_before);
      const after = cleanHeadingText(opt.h2_after);
      return before === normalizedTitle || after === normalizedTitle;
    });

    if (!candidate) return normalizedTitle;

    // Pick the highest scoring option from the optimizer; fallback to the suggested H2.
    const scoredOptions = (candidate.h2_options || [])
      .map((opt) => ({
        text: cleanHeadingText(opt.text || ''),
        score: typeof opt.score === 'number' ? opt.score : undefined,
      }))
      .filter((opt) => opt.text && typeof opt.score === 'number')
      .sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity));

    const fallback = cleanHeadingText(candidate.h2_after || candidate.h2_before || normalizedTitle);
    return cleanHeadingText(scoredOptions[0]?.text || fallback || normalizedTitle);
  };

  const sectionBodies: string[] = new Array(sectionsToGenerate.length).fill('');
  const sectionHeadings: string[] = sectionsToGenerate.map((s) =>
    resolveHeadingFromOptimizer(s.title)
  );
  const legacyKeyPoints = [
    ...(Array.isArray(refAnalysisData?.keyInformationPoints)
      ? refAnalysisData.keyInformationPoints
      : []),
    ...(Array.isArray(refAnalysisData?.brandExclusivePoints)
      ? refAnalysisData.brandExclusivePoints
      : []),
  ];

  const structuredKeyPoints = (refAnalysisData?.structure || [])
    .flatMap((s: any) => [
      ...(Array.isArray(s?.keyFacts) ? s.keyFacts : []),
      ...(Array.isArray(s?.uspNotes) ? s.uspNotes : []),
    ])
    .filter(Boolean);

  const allKeyPoints = Array.from(new Set([...structuredKeyPoints, ...legacyKeyPoints])).filter(
    Boolean
  );

  const generatorConfig = {
    ...config,
    productBrief: parsedProductBrief,
    referenceAnalysis: refAnalysisData,
    authorityAnalysis: authAnalysisData,
  };

  const shouldAutoPlanImages = Boolean(config.autoImagePlan);

  const getHeading = (idx: number) =>
    cleanHeadingText(
      sectionHeadings[idx] || sectionsToGenerate[idx]?.title || `Section ${idx + 1}`
    );

  const renderSectionBlock = (idx: number, bodyOverride?: string) => {
    const heading = getHeading(idx);
    const body = typeof bodyOverride === 'string' ? bodyOverride : sectionBodies[idx];
    if (body) return `## ${heading}\n\n${body}`;
    return `## ${heading}\n\n_(Writing...)_`;
  };

  const renderTurboSections = () =>
    mergeTurboSections(
      sectionsToGenerate,
      sectionBodies.map((body, idx) => (body ? renderSectionBlock(idx, body) : ''))
    );

  const renderProgressSections = () =>
    sectionBodies.map((_, idx) => renderSectionBlock(idx)).join('\n\n');

  const getKeywordPlans = () => useAnalysisStore.getState().keywordPlans || [];

  const outlineSourceLabel = isUsingCustomOutline
    ? `**User Custom Outline**`
    : `**AI Narrative Structure (Outline)**`;

  const initialDisplay = `> 📑 **Active Blueprint:** ${outlineSourceLabel}\n\n`;
  generationStore.setContent(initialDisplay);

  const promises = sectionsToGenerate.map(async (section, i) => {
    if (isStopped()) return;

    const allTitles = sectionsToGenerate.map((s) => s.title);
    const futureTitles = allTitles.slice(i + 1);
    const analysisPlan = refAnalysisData?.structure.find(
      (s: any) => s.title === section.title
    )?.narrativePlan;
    const specificPlan = section.specificPlan || analysisPlan;
    const sectionData = refAnalysisData?.structure.find((s: any) => s.title === section.title);
    const sectionPoints = Array.from(
      new Set([
        ...(Array.isArray(section.keyFacts) ? section.keyFacts : []),
        ...(Array.isArray(section.uspNotes) ? section.uspNotes : []),
        ...(Array.isArray(sectionData?.keyFacts) ? sectionData.keyFacts : []),
        ...(Array.isArray(sectionData?.uspNotes) ? sectionData.uspNotes : []),
        ...allKeyPoints,
      ])
    ).filter(Boolean);

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
        sectionPoints,
        [],
        0,
        section
      );

      if (!isStopped()) {
        const sectionContent = stripLeadingHeading(res.data.content);
        sectionBodies[i] = sectionContent;
        console.log(`[Timer - Turbo] Section '${section.title}': ${res.duration}ms`);

        generationStore.addSectionResult({
          ...res.data,
          id: `${i}-${section.title}`,
          content: sectionContent,
          rawContent: res.data.rawContent ? stripLeadingHeading(res.data.rawContent) : undefined,
          refinedContent: res.data.refinedContent
            ? stripLeadingHeading(res.data.refinedContent)
            : undefined,
        });

        generationStore.setContent(renderTurboSections());
        appStore.addCost(res.cost.totalCost, res.usage.totalTokens);

        if (res.data.usedPoints && res.data.usedPoints.length > 0) {
          analysisStore.setCoveredPoints((prev) => {
            const newUnique = res.data.usedPoints.filter((p) => !prev.includes(p));
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
    // Auto-heading refinement disabled in favor of manual toolbar tool
  }

  if (!isStopped()) {
    if (shouldAutoPlanImages) {
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
        appStore.addCost(imagePlans.cost.totalCost, imagePlans.usage.totalTokens);

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
              appStore.addCost(imgRes.cost.totalCost, imgRes.usage.totalTokens);
            }
          } catch (e) {
            console.error(`Failed to generate image ${plan.id}`, e);
          }
        });

        await Promise.all(imagePromises);
        appendAnalysisLog('Image generation completed.');
      } catch (e) {
        console.error('Image generation phase failed', e);
        appendAnalysisLog('Image generation failed.');
      }
    } else {
      appendAnalysisLog('Skipping auto image planning (manual only).');
    }

    // --- REGION LOCALIZATION skipped as requested ---
    generationStore.setGenerationStep('finalizing');
    generationStore.setStatus('completed');
    generationStore.setGenerationStep('idle');
  }
};
