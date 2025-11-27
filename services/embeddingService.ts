const EMBEDDING_MODEL = 'gemini-embedding-001';

interface EmbedOptions {
  taskType?: string;
  outputDimensionality?: number;
}

interface EmbedResponse {
  embeddings: number[][];
}

export const embedTexts = async (
  texts: string[],
  options: EmbedOptions = {}
): Promise<number[][]> => {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const response = await fetch('/api/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      texts,
      taskType: options.taskType || 'SEMANTIC_SIMILARITY',
      outputDimensionality: options.outputDimensionality,
      model: EMBEDDING_MODEL
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to fetch embeddings: ${response.status} ${detail || ''}`.trim());
  }

  const data: EmbedResponse = await response.json();
  return data.embeddings || [];
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
