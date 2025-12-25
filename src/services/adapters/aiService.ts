import 'server-only';
import { createVertex } from '@ai-sdk/google-vertex';
import { generateText, streamText, Output, LanguageModel } from 'ai';
import { MODEL } from '../../config/constants';
import { calculateCost } from './promptService';
import { TokenUsage, CostBreakdown, AIRequestConfig } from '../../types';
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

export const getVertex = () => {
  if (!vertex) throw new Error('[AIService] Vertex provider not initialized (server-only)');
  return vertex;
};

class AIService {
  private getModel(key: LlmModelKey): LanguageModel {
    return vertex(MODEL[key]);
  }

  /**
   * Run a text generation request (Standard text output)
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

      const { usage: normalizedUsage, cost } = calculateCost(usage, modelKey);

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
   * Run a structured JSON generation request (Standard v4+ output: Output.object)
   */
  async runJson<T>(
    prompt: string,
    modelKey: LlmModelKey = 'FLASH',
    options: { schema: z.ZodType<T>; promptId?: string; temperature?: number }
  ): Promise<{ data: T; usage: TokenUsage; cost: CostBreakdown; duration: number }> {
    const start = Date.now();
    const model = this.getModel(modelKey);

    try {
      const { output, usage } = await generateText({
        model,
        prompt,
        output: Output.object({ schema: options.schema }),
        temperature: options.temperature,
        headers: {
          'x-prompt-id': options.promptId || 'unnamed_json_task',
        },
      });

      const { usage: normalizedUsage, cost } = calculateCost(usage, modelKey);

      return {
        data: output as T,
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
   * Stream a structured JSON generation request (Modern v4+ output: Output.object)
   */
  async streamJson<T>(
    prompt: string,
    modelKey: LlmModelKey = 'FLASH',
    options: { schema: z.ZodType<T>; promptId?: string }
  ) {
    const model = this.getModel(modelKey);

    const safePromptId = (options.promptId || 'unnamed_stream_task')
      .replace(/[^\x00-\x7F]/g, '_');

    return streamText({
      model,
      prompt,
      output: Output.object({ schema: options.schema }),
      headers: {
        'x-prompt-id': safePromptId,
      },
      onFinish({ usage, finishReason }) {
        if (process.env.NODE_ENV === 'development') {
          const { cost } = calculateCost(usage, modelKey);
          console.log(`[AIService] Stream finished. Reason: ${finishReason}, Cost: $${cost.totalCost.toFixed(4)}`);
        }
      },
      onError({ error }) {
        console.error(`[AIService] Stream error for ${modelKey}:`, error);
      }
    });
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
