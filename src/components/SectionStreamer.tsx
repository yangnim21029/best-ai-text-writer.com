'use client';

import React, { useEffect } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { sectionSchema } from '@/schemas/sectionSchema';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useAppStore } from '@/store/useAppStore';
import { stripLeadingHeading } from '@/utils/parsingUtils';
import { generateSectionImageAction } from '@/app/actions/generation';
import { useAnalysisStore } from '@/store/useAnalysisStore';

interface SectionStreamerProps {
  id: string;
  index: number;
  body: any; // The request body for prepareSectionPrompt
  onDone: (result: any) => void;
  shouldAutoPlanImages?: boolean;
}

export const SectionStreamer: React.FC<SectionStreamerProps> = ({
  id,
  index,
  body,
  onDone,
  shouldAutoPlanImages,
}) => {
  const generationStore = useGenerationStore();
  const analysisStore = useAnalysisStore();
  const appStore = useAppStore();
  const hasStarted = React.useRef(false);

  const { object, isLoading, error, submit } = useObject({
    api: '/api/ai/section',
    schema: sectionSchema,
    onFinish: ({ object, error }) => {
      if (object) {
        finalize(object);
      }
    },
  });

  // Start streaming on mount
  useEffect(() => {
    if (!hasStarted.current) {
      hasStarted.current = true;
      submit(body);
    }
  }, [body, submit]);

  // Update store in real-time as object streams in
  useEffect(() => {
    if (object) {
      generationStore.updateSectionResult(id, {
        content: object.content || '',
        usedPoints: (object.usedPoints || []) as string[],
        injectedCount: object.injectedCount || 0,
        comment: object.comment,
      });
    }
  }, [object, id]);

  const finalize = async (finalObject: any) => {
    const sectionContent = stripLeadingHeading(finalObject.content || '');
    let finalSectionContent = sectionContent;
    let sectionImageUrl = null;

    // Optional image generation
    if (shouldAutoPlanImages) {
      try {
        const imgRes = await generateSectionImageAction(
          body.sectionTitle,
          sectionContent,
          analysisStore.visualStyle,
          body.config.targetAudience
        );
        if (imgRes.data) {
          sectionImageUrl = imgRes.data;
          const imgHtml = `<img src="${sectionImageUrl}" alt="${body.sectionTitle}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" /><br/>`;
          finalSectionContent = imgHtml + sectionContent;
          appStore.addCost(imgRes.cost.totalCost, imgRes.usage.totalTokens);
        }
      } catch (e) {
        console.error('[SectionStreamer] Image gen failed', e);
      }
    }

    const result = {
      ...finalObject,
      id,
      content: finalSectionContent,
      rawContent: finalObject.content,
      imageUrl: sectionImageUrl,
      usedPoints: (finalObject.usedPoints || []) as string[],
    };

    generationStore.updateSectionResult(id, result);
    generationStore.markSectionCompleted(id); // Signal orchestrator
    onDone(result);
  };

  if (error) {
    console.error(`[SectionStreamer] Error for ${body.sectionTitle}:`, error);
  }

  return null;
};
