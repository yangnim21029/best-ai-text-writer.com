import { ArticleConfig, SectionAnalysis } from '../../types';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { useAppStore } from '@/store/useAppStore';
import { mergeTurboSections } from '../../services/generation/contentDisplayService';

import { cleanHeadingText, stripLeadingHeading, throttle } from '../../utils/parsingUtils';
import { appendAnalysisLog } from '../../services/generation/generationLogger';
import {
  distributeContextAction,
  planImagesAction,
  generateImageAction
} from '@/app/actions/generation';
import pLimit from 'p-limit';

const isStopped = () => useGenerationStore.getState().isStopped;

const resolveHeading = (
  title: string,
  isUsingCustomOutline: boolean,
  headingOptimizations: any[]
): string => {
  const normalizedTitle = cleanHeadingText(title);
  if (isUsingCustomOutline || headingOptimizations.length === 0) return normalizedTitle;

  const candidate = headingOptimizations.find((opt) => {
    const before = cleanHeadingText(opt.h2_before);
    const after = cleanHeadingText(opt.h2_after);
    return before === normalizedTitle || after === normalizedTitle;
  });

  if (!candidate) return normalizedTitle;

  const scoredOptions = (candidate.h2_options || [])
    .map((opt: any) => ({
      text: cleanHeadingText(opt.text || ''),
      score: typeof opt.score === 'number' ? opt.score : undefined,
    }))
    .filter((opt: any) => opt.text && typeof opt.score === 'number')
    .sort((a: any, b: any) => (b.score ?? -Infinity) - (a.score ?? -Infinity));

  const fallback = cleanHeadingText(candidate.h2_after || candidate.h2_before || normalizedTitle);
  return cleanHeadingText(scoredOptions[0]?.text || fallback || normalizedTitle);
};

const determineSections = (
  config: ArticleConfig,
  refAnalysisData: any
): { sections: any[]; isCustom: boolean } => {
  if (config.sampleOutline && config.sampleOutline.trim().length > 0) {
    const lines = config.sampleOutline
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    return { sections: lines.map((title) => ({ title })), isCustom: true };
  }

  if (refAnalysisData?.structure && refAnalysisData.structure.length > 0) {
    return { sections: [...refAnalysisData.structure], isCustom: false };
  }

  return {
    sections: [
      { title: 'Introduction' },
      { title: 'Core Concepts' },
      { title: 'Benefits' },
      { title: 'Applications' },
      { title: 'Conclusion' },
    ],
    isCustom: false,
  };
};

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
  const { sections: sectionsToGenerate, isCustom: isUsingCustomOutline } = determineSections(config, refAnalysisData);

  generationStore.setStatus('streaming');
  generationStore.setGenerationStep('writing_content');
  generationStore.setContent('');
  generationStore.setSectionResults([]);

  const headingOptimizations = analysisStore.headingOptimizations || [];
  const sectionHeadings: string[] = sectionsToGenerate.map((s) =>
    resolveHeading(s.title, isUsingCustomOutline, headingOptimizations)
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

  const getHeading = (idx: number) =>
    cleanHeadingText(
      sectionHeadings[idx] || sectionsToGenerate[idx]?.title || `Section ${idx + 1}`
    );

  const renderSectionBlock = (idx: number, bodyOverride?: string) => {
    const heading = getHeading(idx);
    const body = typeof bodyOverride === 'string' ? bodyOverride : '';
    // If body is present, show header + body.
    if (body) return `## ${heading}\n\n${body}`;
    // If no body, we now return heading only if we want to show "it's about to write this", 
    // BUT the new requirements say "just like writing", so maybe we don't even show the header until content starts?
    // Let's stick to showing the header with a small indicator OR just the header.
    // However, the caller logic (renderTurboSections) filters out empty ones now.
    return '';
  };

  const renderTurboSections = () => {
    const results = useGenerationStore.getState().sectionResults;
    // Only render sections that have content or are the immediate next one being worked on
    const relevantSections = sectionsToGenerate.filter((s, idx) => {
      const id = `${idx}-${s.title}`;
      const result = results.find((r) => r.id === id);
      // Show if it has content, or if it's the very first one and nothing exists yet
      if (result?.content) return true;
      // Also show if it's the *current* target but has no content yet (optionally)
      // For now, let's strictly show only what has content to mimic "writing from scratch"
      // But we might want to show the header of the *current* section just before it starts
      return false;
    });

    // Fallback: If nothing has content yet, show the first section's header to avoid empty screen
    let displaySections = relevantSections;
    if (results.length > 0 && relevantSections.length === 0) {
      // Find the active one
      const active = results.find(r => !r.content); // first one without content?
      if (active) {
        // Check index
        const idx = sectionsToGenerate.findIndex(s => active.id.includes(s.title));
        if (idx !== -1) return renderSectionBlock(idx, '');
      }
    }

    return mergeTurboSections(
      sectionsToGenerate,
      sectionsToGenerate.map((s, idx) => {
        const id = `${idx}-${s.title}`;
        const result = results.find((r) => r.id === id);

        // Logic: ONLY return string if it has content.
        // If content is empty, return empty string so it doesn't appear in the merged output
        return result?.content ? renderSectionBlock(idx, result.content) : '';
      })
    );
  };

  const renderProgressSections = () => {
    const results = useGenerationStore.getState().sectionResults;
    return sectionsToGenerate
      .map((s, idx) => {
        const id = `${idx}-${s.title}`;
        const result = results.find((r) => r.id === id);
        // Only show if content exists
        return result?.content
          ? renderSectionBlock(idx, result.content)
          : '';
      })
      .filter(Boolean)
      .join('\n\n');
  };

  const renderFinalContent = () => {
    const results = useGenerationStore.getState().sectionResults;
    return sectionsToGenerate
      .map((s, idx) => {
        const heading = getHeading(idx);
        const id = `${idx}-${s.title}`;
        const result = results.find((r) => r.id === id);
        const content = result?.content || '';
        if (!content) return ''; // Skip empty
        return `## ${heading}\n\n${content}`;
      })
      .filter(Boolean)
      .join('\n\n');
  };

  // Performance: Throttle the UI update to avoid React overhead during high-concurrency generation
  const throttledUpdateUI = throttle(() => {
    generationStore.setContent(renderTurboSections());
  }, 100);

  // Subscribe to store changes to update the main content during streaming
  const unsubscribe = useGenerationStore.subscribe((state, prevState) => {
    if (state.sectionResults !== prevState.sectionResults) {
      throttledUpdateUI();
    }
  });

  const getKeywordPlans = () => useAnalysisStore.getState().keywordPlans || [];

  const limit = pLimit(4); // Concurrency limit for stability

  // generationStore.setContent(initialDisplay); 
  // We want to start clean, so we don't set any initial "Blueprint" text anymore.
  generationStore.setContent('');

  // 2. Context Distribution
  let contextMap: Record<number, string> = {};
  if (!isStopped()) {
    try {
      const distributionResult = await distributeContextAction(
        config.referenceContent || '',
        sectionsToGenerate,
        config.targetAudience
      );
      if (distributionResult?.data) {
        // Convert ContextMapping[] to Record<number, string>
        contextMap = distributionResult.data.reduce((acc: Record<number, string>, curr: any) => {
          const idx = sectionsToGenerate.findIndex((s) => s.title === curr.title);
          if (idx !== -1) acc[idx] = curr.relevantContext;
          return acc;
        }, {});
        appendAnalysisLog(`Distributed context to ${Object.keys(contextMap).length} sections.`);
      }
    } catch (err) {
      console.warn('Context distribution failed', err);
    }
  }

  // 3. Generation Loop
  const promises = sectionsToGenerate.map((section, idx) =>
    limit(async () => {
      if (isStopped()) return;

      const id = `${idx}-${section.title}`;

      // Initialize placeholder result
      generationStore.addSectionResult({
        id,
        title: section.title,
        content: '',
        usedPoints: [],
        injectedCount: 0,
      });

      // Find matching analysis data if available
      const sectionData = refAnalysisData?.structure
        ? refAnalysisData.structure.find((s: any) => s.title === section.title) || {}
        : {};

      const body = {
        config: generatorConfig,
        sectionTitle: section.title,
        specificPlan: sectionData.narrativePlan,
        generalPlan: refAnalysisData?.generalPlan,
        keywordPlans: getKeywordPlans(),
        authorityAnalysis: authAnalysisData,
        keyInfoPoints: allKeyPoints,
        sectionMeta: sectionData,
        context: contextMap[idx] || '',
        previousSections: [], // TODO: implement if needed
        futureSections: [], // TODO: implement if needed
      };

      // Ensure item is not already in queue (sanity check)
      generationStore.removeFromStreamingQueue(id);

      generationStore.addToStreamingQueue({
        id,
        index: idx,
        body,
      });

      // Wait for completion via store subscription (more efficient than setInterval)
      await new Promise<void>((resolve) => {
        const unmount = useGenerationStore.subscribe((state) => {
          const isDone = state.completedSections.includes(id);
          if (isDone || state.isStopped) {
            unmount();
            resolve();
          }
        });

        // Safety check in case it's already done
        if (useGenerationStore.getState().completedSections.includes(id) || useGenerationStore.getState().isStopped) {
          unmount();
          resolve();
        }
      });
    })
  );

  await Promise.all(promises);

  // Ensure the final state is rendered without artifacts
  const finalContent = renderFinalContent();
  generationStore.setContent(finalContent);

  if (!isStopped()) {
    appendAnalysisLog('Skipping auto image planning (manual only).');

    generationStore.setGenerationStep('finalizing');
    generationStore.setStatus('completed');
    generationStore.setGenerationStep('idle');
  }

  unsubscribe();
};
