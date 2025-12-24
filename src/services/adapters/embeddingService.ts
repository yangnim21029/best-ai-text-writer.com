import { embedMany } from 'ai';
import { EMBED_MODEL_ID } from '../../config/constants';
import { getVertex } from './aiService';

interface EmbedOptions {
  taskType?: string;
  outputDimensionality?: number;
  signal?: AbortSignal;
}

/**
 * Generates embeddings for a list of strings using Vercel AI SDK 6
 */
export const embedTexts = async (
  texts: string[],
  options: EmbedOptions = {}
): Promise<number[][]> => {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  try {
    const { embeddings } = await embedMany({
      model: getVertex().embeddingModel(EMBED_MODEL_ID),
      values: texts,
      abortSignal: options.signal,
    });

    return embeddings;
  } catch (error) {
    console.error('[EmbeddingService] Failed to generate embeddings:', error);
    throw error;
  }
};

/**
 * Calculates cosine similarity between two vectors
 */
export const cosineSimilarity = (a: number[], b: number[]): number => {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;
  return dot / magnitude;
};