import 'server-only';
import { createVertex } from '@ai-sdk/google-vertex';
import { generateText, generateObject, LanguageModel } from 'ai';
import { MODEL } from '../../config/constants';
import { calculateCost } from './promptService';
import { TokenUsage, CostBreakdown, AIRequestConfig } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { serverEnv } from '../../config/env';

export type LlmModelKey = keyof typeof MODEL;

// 1. Initialize Vertex AI Provider
export const vertex = createVertex({
  project: serverEnv.GOOGLE_VERTEX_PROJECT,
  location: serverEnv.GOOGLE_VERTEX_LOCATION,
  googleAuthOptions: {
    credentials: serverEnv.GOOGLE_VERTEX_CREDENTIALS
      ? JSON.parse(serverEnv.GOOGLE_VERTEX_CREDENTIALS)
      : undefined,
  },
});

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
   * Run a text generation request using Vercel AI SDK 6
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
   * Run a JSON generation request using Vercel AI SDK 6 (generateObject)
   */
  async runJson<T>(
    prompt: string,
    modelKey: LlmModelKey = 'FLASH',
    options: { schema?: any; useSearch?: boolean; promptId?: string } = {}
  ): Promise<{ data: T; usage: TokenUsage; cost: CostBreakdown; duration: number }> {
    const start = Date.now();
    const model = this.getModel(modelKey);

    try {
      // Vertex search grounding is currently best handled via provider-specific features 
      // or through generateText with tools if needed. 
      // For standard schema-based JSON, generateObject is preferred.
      const { object, usage } = await generateObject({
        model,
        prompt,
        schema: options.schema,
        // search grounding is not directly in core generateObject for all providers yet
        // but we can pass it if the provider supports it in its specific options.
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

// --- Shared Utils ---

export const parseSchemaResponse = <T>(
  response: { data: T; usage: TokenUsage; cost: CostBreakdown; duration: number },
  fallback?: T
): { data: T; usage: TokenUsage; cost: CostBreakdown; duration: number } => {
  if (!response.data && fallback) {
    return { ...response, data: fallback };
  }
  return response;
};

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