import 'server-only';
import { createVertex } from '@ai-sdk/google-vertex';
import { generateText, generateObject, LanguageModel } from 'ai';
import { MODEL } from '../../config/constants';
import { calculateCost } from './promptService';
import { TokenUsage, CostBreakdown, AIRequestConfig } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { serverEnv } from '../../config/env';
import { z } from 'zod';

export type LlmModelKey = keyof typeof MODEL;

// 1. Initialize Vertex AI Provider
const getVertexProvider = () => {
  const project = serverEnv.GOOGLE_VERTEX_PROJECT;
  const location = serverEnv.GOOGLE_VERTEX_LOCATION || 'global';
  
  let credentials;
  const rawCreds = serverEnv.GOOGLE_VERTEX_CREDENTIALS;
  
  if (rawCreds) {
    try {
      const cleaned = rawCreds.trim().replace(/^'|'$/g, '');
      credentials = JSON.parse(cleaned);
    } catch (e) {
      console.error('[AIService] Failed to parse GOOGLE_VERTEX_CREDENTIALS JSON');
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AIService] Vertex Provider: Project=${project || 'NOT_FOUND'}, Location=${location}`);
  }

  return createVertex({
    project,
    location,
    googleAuthOptions: {
      credentials,
    },
  });
};

export const vertex = getVertexProvider();

class AIService {
  private getModelId(key: LlmModelKey): string {
    const settings = useAppStore.getState();
    if (key === 'FLASH') return settings.modelFlash;
    if (key === 'IMAGE_PREVIEW') return settings.modelImage;
    return MODEL[key];
  }

  private getModel(key: LlmModelKey): LanguageModel {
    const modelId = this.getModelId(key);
    return vertex(modelId);
  }

  /**
   * Run a text generation request
   */
  async runText(
    prompt: string,
    modelKey: LlmModelKey = 'FLASH',
    config?: AIRequestConfig
  ): Promise<{ text: string; usage: TokenUsage; cost: CostBreakdown; duration: number }> {
    const start = Date.now();
    const model = this.getModel(modelKey);

    try {
      const { text, usage } = await generateText({
        model,
        prompt,
        temperature: config?.temperature,
        headers: {
          'x-prompt-id': config?.promptId || 'unnamed_task',
        },
      });

      const normalizedUsage = {
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        totalTokens: usage.totalTokens ?? 0,
      };

      const { cost } = calculateCost(normalizedUsage, modelKey);

      return {
        text,
        usage: normalizedUsage,
        cost,
        duration: Date.now() - start,
      };
    } catch (error) {
      console.error(`[AIService] runText failed for ${modelKey}`, error);
      throw error;
    }
  }

  /**
   * Run a JSON generation request using Vercel AI SDK 6
   * IMPORTANT: 'options.schema' must be a Zod schema.
   */
  async runJson<T>(
    prompt: string,
    modelKey: LlmModelKey = 'FLASH',
    options: { schema?: z.ZodType<T>; useSearch?: boolean; promptId?: string } = {}
  ): Promise<{ data: T; usage: TokenUsage; cost: CostBreakdown; duration: number }> {
    const start = Date.now();
    const model = this.getModel(modelKey);

    if (!options.schema) {
      throw new Error('[AIService] runJson requires a schema (ZodType).');
    }

    try {
      const { object, usage } = await generateObject({
        model,
        prompt,
        schema: options.schema,
      });

      const normalizedUsage = {
        inputTokens: usage.inputTokens ?? 0,
        outputTokens: usage.outputTokens ?? 0,
        totalTokens: usage.totalTokens ?? 0,
      };

      const { cost } = calculateCost(normalizedUsage, modelKey);

      return {
        data: object as T,
        usage: normalizedUsage,
        cost,
        duration: Date.now() - start,
      };
    } catch (error) {
      console.error(`[AIService] runJson failed for ${modelKey}`, error);
      throw error;
    }
  }

  /**
   * Convert plain text to Markdown using AI
   */
  async convertToMarkdown(
    content: string,
    onSuccess?: (markdown: string) => void
  ): Promise<string> {
    try {
      const { promptTemplates } = await import('./promptTemplates');
      const prompt = promptTemplates.convertToMarkdown({ content });

      const response = await this.runText(prompt, 'FLASH');
      const markdown = response.text;

      if (onSuccess) {
        onSuccess(markdown);
      }

      return markdown;
    } catch (error) {
      console.error('[AIService] convertToMarkdown failed', error);
      throw error;
    }
  }
}

export const aiService = new AIService();

export const trackCost = (
  metricsStore: { addCost: (cost: number, tokens: number) => void },
  ...responses: { cost: CostBreakdown; usage: TokenUsage }[]
) => {
  let totalCost = 0;
  let totalTokens = 0;

  responses.forEach((r) => {
    if (r && r.cost && r.usage) {
      totalCost += r.cost.totalCost || 0;
      totalTokens += r.usage.totalTokens ?? 0;
    }
  });

  if (!isNaN(totalCost) && !isNaN(totalTokens)) {
    metricsStore.addCost(totalCost, totalTokens);
  }

  return { totalCost, totalTokens };
};
