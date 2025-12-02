import { refineHeadings } from '../../services/headingRefinerService';
import { useGenerationStore } from '../../store/useGenerationStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useMetricsStore } from '../../store/useMetricsStore';
import { cleanHeadingText } from '../../utils/textUtils';

const isStopped = () => useGenerationStore.getState().isStopped;

export const refineAllHeadings = async (
    sectionHeadings: string[],
    sectionsToGenerate: { title: string }[],
    fullConfig: { title: string; targetAudience: any },
    renderProgressSections: () => string
) => {
    const generationStore = useGenerationStore.getState();
    const analysisStore = useAnalysisStore.getState();
    const metricsStore = useMetricsStore.getState();

    if (isStopped()) return;
    console.log('[Heading Refinement] Starting...');
    generationStore.setGenerationStep('refining_headings');

    const headingsInput = sectionHeadings.map((h, idx) => cleanHeadingText(h || sectionsToGenerate[idx]?.title));
    if (headingsInput.length === 0) return;

    console.log('[Heading Refinement] Processing', headingsInput.length, 'headings');
    try {
        const refineRes = await refineHeadings(
            fullConfig.title || "Article",
            headingsInput,
            fullConfig.targetAudience
        );
        console.log('[Heading Refinement] Completed successfully');

        const refinedList = headingsInput.map((before, idx) => {
            const match = refineRes.data?.find((h: any) => cleanHeadingText(h.before) === before) || refineRes.data?.[idx];
            return cleanHeadingText(match?.after || match?.before || before);
        });

        // Persist structured heading optimizations for UI
        const normalizedForUi = (refineRes.data || []).map((item: any, idx: number) => {
            const h2Before = cleanHeadingText(item.h2_before || item.before || headingsInput[idx] || '');
            const h2After = cleanHeadingText(item.h2_after || item.after || item.before || headingsInput[idx] || '');
            const h3List = Array.isArray(item.h3) ? item.h3 : [];
            return {
                h2_before: h2Before,
                h2_after: h2After,
                h2_reason: item.h2_reason || item.reason || '',
                h2_options: Array.isArray(item.h2_options)
                    ? item.h2_options.map((opt: any) => ({
                        text: cleanHeadingText(opt.text || ''),
                        reason: opt.reason || '',
                        score: typeof opt.score === 'number' ? opt.score : undefined
                    }))
                    : undefined,
                needs_manual: item.needs_manual || false,
                h3: h3List
                    .filter((h: any) => h && (h.h3_before || h.h3_after))
                    .map((h: any) => ({
                        h3_before: cleanHeadingText(h.h3_before || h.before || ''),
                        h3_after: cleanHeadingText(h.h3_after || h.after || h.h3_before || ''),
                        h3_reason: h.h3_reason || h.reason || '',
                    }))
            };
        });

        analysisStore.setHeadingOptimizations(normalizedForUi);

        // Update the headings array in place (caller must pass a mutable array or we return new one)
        // Since we are passing sectionHeadings, we should probably return the new list or update it.
        // In the original code, it mutated the array: sectionHeadings[index] = heading;

        refinedList.forEach((heading, index) => {
            if (index < sectionHeadings.length) {
                sectionHeadings[index] = heading;
            }
        });

        metricsStore.addCost(refineRes.cost.totalCost, refineRes.usage.totalTokens);
        generationStore.setContent(renderProgressSections());

        return refinedList;
    } catch (err) {
        console.error('[Heading Refinement] FAILED:', err);
        // Continue with original headings on failure
        return sectionHeadings;
    }
};
