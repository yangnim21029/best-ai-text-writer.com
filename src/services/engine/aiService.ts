import { genAIClient, buildAiUrl } from './genAIClient';
import { MODEL } from '../../config/constants';
import { calculateCost } from './promptService';
import { TokenUsage, CostBreakdown, AIRequestConfig, AIResponse } from '../../types';
import { useAppStore } from '../../store/useAppStore';

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
    schema?: any
  ): Promise<{ data: T; usage: TokenUsage; cost: CostBreakdown; duration: number }> {
    const start = Date.now();
    const model = this.getModel(modelKey);
    const config: AIRequestConfig = {
      responseMimeType: 'application/json',
      responseSchema: schema,
    };

    try {
      const response = await genAIClient.request({
        model,
        contents: prompt,
        config,
      });

      const { usage, cost } = calculateCost(response.usageMetadata, modelKey);

      let data: T;
      if (response.object) {
        data = response.object as T;
      } else {
        try {
          // Robust JSON extraction: Find the first '{' and last '}'
          const text = response.text;
          const firstBrace = text.indexOf('{');
          const lastBrace = text.lastIndexOf('}');

          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const jsonStr = text.substring(firstBrace, lastBrace + 1);
            data = JSON.parse(jsonStr) as T;
          } else {
            // Fallback to original cleaning logic
            const cleanText = text.replace(/```(?:json)?\n?|\n?```/gi, '').trim();
            data = JSON.parse(cleanText) as T;
          }
        } catch (e) {
          throw new Error(`Failed to parse JSON response: ${response.text.substring(0, 200)}...`);
        }
      }

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

  /**
   * Run a JSON generation request with Google Search Grounding enabled
   * Use this for queries that need real-time web information (e.g., finding local brand alternatives)
   */
  async runJsonWithSearch<T>(
    prompt: string,
    modelKey: LlmModelKey = 'FLASH',
    schema?: any
  ): Promise<{ data: T; usage: TokenUsage; cost: CostBreakdown; duration: number }> {
    const start = Date.now();
    const model = this.getModel(modelKey);
    const config: AIRequestConfig = {
      responseMimeType: 'application/json',
      responseSchema: schema,
      providerOptions: {
        vertex: {
          useSearchGrounding: true,
        },
      },
    };

    try {
      const response = await genAIClient.request({
        model,
        contents: prompt,
        config,
      });

      const { usage, cost } = calculateCost(response.usageMetadata, modelKey);

      let data: T;
      if (response.object) {
        data = response.object as T;
      } else {
        try {
          // Robust JSON extraction: Find the first '{' and last '}'
          const text = response.text;
          const firstBrace = text.indexOf('{');
          const lastBrace = text.lastIndexOf('}');

          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const jsonStr = text.substring(firstBrace, lastBrace + 1);
            data = JSON.parse(jsonStr) as T;
          } else {
            // Fallback to original cleaning logic
            const cleanText = text.replace(/```(?:json)?\n?|\n?```/gi, '').trim();
            data = JSON.parse(cleanText) as T;
          }
        } catch (e) {
          throw new Error(`Failed to parse JSON response: ${response.text.substring(0, 200)}...`);
        }
      }

      return {
        data,
        usage,
        cost,
        duration: Date.now() - start,
      };
    } catch (error) {
      console.error(`[AIService] runJsonWithSearch failed for ${modelKey}`, error);
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
