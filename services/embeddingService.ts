import { EMBED_MODEL_ID } from '../config/constants';
import { buildAiUrl } from './genAIClient';

interface EmbedOptions {
  taskType?: string;
  outputDimensionality?: number;
  signal?: AbortSignal;
}

interface EmbedResponse {
  embeddings?: number[][];
  embedding?: number[];
  data?: { embeddings?: number[][]; embedding?: number[] } | number[] | Array<{ embeddings?: number[][]; embedding?: number[] }>;
}

const asVector = (value: any): number[] | null => {
  if (!Array.isArray(value)) return null;
  return value as number[];
};

const asMatrix = (value: any): number[][] | null => {
  if (!Array.isArray(value)) return null;
  const vectors = value.map((entry: any) => asVector(entry)).filter(Boolean) as number[][];
  return vectors.length ? vectors : null;
};

const extractEmbeddings = (payload: EmbedResponse): number[][] => {
  if (!payload) return [];

  const direct = asMatrix(payload.embeddings);
  if (direct) return direct;

  const dataField: any = payload.data;

  const nested = asMatrix(dataField?.embeddings);
  if (nested) return nested;

  if (Array.isArray(dataField)) {
    const vectors = dataField
      .map((entry: any) => asMatrix(entry?.embeddings)?.[0] || asVector(entry?.embedding) || asVector(entry))
      .filter(Boolean) as number[][];
    if (vectors.length) return vectors;
  }

  const single = asVector(payload.embedding) || asVector(dataField?.embedding) || asVector(dataField);
  return single ? [single] : [];
};

export const embedTexts = async (
  texts: string[],
  options: EmbedOptions = {}
): Promise<number[][]> => {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const providerOptions: any = {};
  if (options.taskType) providerOptions.taskType = options.taskType;
  if (options.outputDimensionality) providerOptions.outputDimensionality = options.outputDimensionality;

  const body: any = {
    texts,
    model: EMBED_MODEL_ID,
  };

  if (options.taskType) body.taskType = options.taskType;
  if (options.outputDimensionality) body.outputDimensionality = options.outputDimensionality;

  if (Object.keys(providerOptions).length > 0) {
    body.providerOptions = { google: providerOptions };
  }

  const response = await fetch(buildAiUrl('/embed'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...(options.signal ? { signal: options.signal } : {}),
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!response.ok) {
    const detail = isJson ? await response.json().catch(() => undefined) : await response.text();
    const message = typeof detail === 'string' ? detail : (detail as any)?.error || JSON.stringify(detail || '');
    throw new Error(`Failed to fetch embeddings: ${response.status} ${message || ''}`.trim());
  }

  const payload: EmbedResponse = isJson ? await response.json() : { embeddings: [] };
  const embeddings = extractEmbeddings(payload);

  if (!embeddings.length) {
    throw new Error('Embedding response did not include vectors');
  }

  if (embeddings.length !== texts.length) {
    return texts.map((_, idx) => embeddings[idx] || []);
  }

  return embeddings;
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
