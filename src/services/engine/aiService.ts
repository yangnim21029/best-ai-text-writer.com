import { genAIClient, buildAiUrl } from './genAIClient';
import { MODEL } from '../../config/constants';
import { calculateCost } from './promptService';
import { TokenUsage, CostBreakdown, AIRequestConfig, AIResponse } from '../../types';
import { useAppStore } from '../../store/useAppStore';

import { JsonUtils } from '../../utils/jsonUtils';

export type LlmModelKey = keyof typeof MODEL;

class AIService {
  private getModel(key: LlmModelKey): string {
    const settings = useAppStore.getState();
    if (key === 'FLASH') return settings.modelFlash;
    if (key === 'IMAGE_PREVIEW') return settings.modelImage;
    return MODEL[key];
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
      const response = await genAIClient.request({
        model,
        contents: prompt,
        config,
        promptId: config?.promptId,
      });

      const { usage, cost } = calculateCost(response.usageMetadata, modelKey);

      return {
        text: response.text,
        usage,
        cost,
        duration: Date.now() - start,
      };
    } catch (error) {
      console.error(`[AIService] runText failed for ${modelKey}`, error);
      throw error;
    }
  }

  /**
   * Run a JSON generation request
   */
  async runJson<T>(
    prompt: string,
    modelKey: LlmModelKey = 'FLASH',
    options: { schema?: any; useSearch?: boolean; promptId?: string } = {}
  ): Promise<{ data: T; usage: TokenUsage; cost: CostBreakdown; duration: number }> {
    const start = Date.now();
    const model = this.getModel(modelKey);
    const config: AIRequestConfig = {
      responseMimeType: 'application/json',
      responseSchema: options.schema,
    };

    if (options.useSearch) {
      config.providerOptions = {
        vertex: {
          useSearchGrounding: true,
        },
      };
    }

    try {
      const response = await genAIClient.request({
        model,
        contents: prompt,
        config,
        promptId: options.promptId,
      });

      const { usage, cost } = calculateCost(response.usageMetadata, modelKey);

      const data = response.object
        ? (response.object as T)
        : JsonUtils.robustParse<T>(response.text);

      return {
        data,
        usage,
        cost,
        duration: Date.now() - start,
      };
    } catch (error) {
      console.error(`[AIService] runJson failed for ${modelKey}`, error);
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
