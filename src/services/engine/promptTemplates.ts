import { contentPrompts } from './prompts/content';
import { researchPrompts } from './prompts/research';
import { visualPrompts } from './prompts/visual';
import { regionalPrompts } from './prompts/regional';

export type PromptBuilderPayload = Record<string, any>;
export type PromptBuilder<T extends PromptBuilderPayload = PromptBuilderPayload> = (
  payload: T
) => string;

/**
 * Aggregator for all AI prompts.
 * Maintains backward compatibility with the existing promptTemplates structure
 * while delegating the actual prompt logic to domain-specific files.
 */
export const promptTemplates = {
  // Content Generation Prompts
  ...contentPrompts,

  // Research & Product Analysis Prompts
  ...researchPrompts,

  // Visual Identity & Image Prompts
  ...visualPrompts,

  // Regional & Localization Prompts (Aggregated from Template + Service)
  ...regionalPrompts,
};

export type PromptTemplateKey = keyof typeof promptTemplates;
