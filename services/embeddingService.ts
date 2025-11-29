import { buildAiUrl } from './genAIClient';

const EMBEDDING_MODEL = 'gemini-embedding-001';

interface EmbedOptions {
  taskType?: string;
  outputDimensionality?: number;
}

interface EmbedResponse {
  embeddings?: number[][];
  embedding?: number[];
  data?: { embedding?: number[] } | number[] | Array<{ embedding?: number[] }>;
}

const extractEmbedding = (payload: EmbedResponse): number[] => {
  if (!payload) return [];

  if (Array.isArray(payload.embeddings) && Array.isArray(payload.embeddings[0])) {
    return payload.embeddings[0] as number[];
  }

  if (Array.isArray(payload.embedding)) {
    return payload.embedding;
  }

  if (Array.isArray(payload.data)) {
    if (Array.isArray(payload.data[0])) return payload.data[0] as number[];
    if ((payload.data[0] as any)?.embedding) return (payload.data[0] as any).embedding as number[];
  }

  if (payload.data && (payload.data as any).embedding) {
    return (payload.data as any).embedding as number[];
  }

  return [];
};

export const embedTexts = async (
  texts: string[],
  options: EmbedOptions = {}
): Promise<number[][]> => {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const runSingle = async (text: string): Promise<number[]> => {
    const providerOptions: any = {};
    if (options.taskType) providerOptions.taskType = options.taskType;
    if (options.outputDimensionality) providerOptions.outputDimensionality = options.outputDimensionality;

    const body: any = { text, model: EMBEDDING_MODEL };
    if (Object.keys(providerOptions).length > 0) {
      body.providerOptions = { google: providerOptions };
    }

    const response = await fetch(buildAiUrl('/embed'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Failed to fetch embeddings: ${response.status} ${detail || ''}`.trim());
    }

    const data: EmbedResponse = await response.json();
    return extractEmbedding(data);
  };

  return await Promise.all(texts.map((text) => runSingle(text)));
};

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
