import { AI_BASE_URL, EMBED_ENDPOINT, EMBED_MODEL_ID, postJson } from './config';

const texts = [
  'Briefly explain vector search.',
  'When should I reduce embedding dimensions?',
  'How does cosine similarity work?',
];

const main = async () => {
  if (!AI_BASE_URL) {
    console.error('Please set AI_BASE_URL (or VITE_AI_BASE_URL) in your .env');
    process.exit(1);
  }

  const endpoint = `${AI_BASE_URL}${EMBED_ENDPOINT}`;
  console.log(`→ POST ${endpoint}`);

  const data = await postJson<{ embeddings?: number[][] }>(EMBED_ENDPOINT, {
    texts,
    model: EMBED_MODEL_ID,
  });

  const embeddings = data.embeddings ?? [];
  console.log('Batch size:', embeddings.length);
  embeddings.forEach((vec, idx) => {
    const vector = Array.isArray(vec) ? vec : [];
    console.log(`#${idx + 1} length:`, vector.length, 'first 3:', vector.slice(0, 3));
  });
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
