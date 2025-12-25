'use client';

import React from 'react';
import { useGenerationStore } from '@/store/useGenerationStore';
import { SectionStreamer } from './SectionStreamer';

export const GenerationOrchestrator: React.FC = () => {
  const { streamingQueue, removeFromStreamingQueue, lastConfig } = useGenerationStore();

  if (streamingQueue.length === 0) return null;

  return (
    <>
      {streamingQueue.map((item) => (
        <SectionStreamer
          key={item.id}
          id={item.id}
          index={item.index}
          body={item.body}
          onDone={() => {
            removeFromStreamingQueue(item.id);
          }}
        />
      ))}
    </>
  );
};
