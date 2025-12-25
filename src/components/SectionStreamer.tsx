'use client';

import React, { useEffect } from 'react';
import { experimental_useObject as useObject } from '@ai-sdk/react';
import { sectionSchema } from '@/schemas/sectionSchema';
import { useGenerationStore } from '@/store/useGenerationStore';
import { stripLeadingHeading } from '@/utils/parsingUtils';

interface SectionStreamerProps {
  id: string;
  index: number;
  body: any; // The request body for prepareSectionPrompt
  onDone: (result: any) => void;
}

export const SectionStreamer: React.FC<SectionStreamerProps> = ({
  id,
  index,
  body,
  onDone,
}) => {
  const generationStore = useGenerationStore();
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

  const finalize = (finalObject: any) => {
    const sectionContent = stripLeadingHeading(finalObject.content || '');

    const result = {
      ...finalObject,
      id,
      content: sectionContent,
      rawContent: finalObject.content,
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
