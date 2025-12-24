import assert from 'node:assert/strict';
import 'dotenv/config';
import { createVertex } from '@ai-sdk/google-vertex';
import { generateText } from 'ai';

const logSkip = (reason: string) => console.warn(`AI check skipped: ${reason}`);

const main = async () => {
  if (process.env.SKIP_AI_CHECK === '1') {
    return logSkip('SKIP_AI_CHECK=1');
  }

  const project = process.env.GOOGLE_VERTEX_PROJECT;
  const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
  const credentials = process.env.GOOGLE_VERTEX_CREDENTIALS;
  const modelId = process.env.AI_CHECK_MODEL || 'gemini-1.5-flash';
  const prompt = process.env.AI_CHECK_PROMPT || 'healthcheck';

  if (!project) {
    return logSkip('GOOGLE_VERTEX_PROJECT not provided');
  }

  console.log(`Verifying Vertex AI [${project}/${location}] with model: ${modelId}...`);

  const vertex = createVertex({
    project,
    location,
    googleAuthOptions: {
      credentials: credentials ? JSON.parse(credentials) : undefined,
    },
  });

  const { text } = await generateText({
    model: vertex(modelId),
    prompt,
  });

  assert(text !== undefined, 'Vertex AI responded without text');
  console.log(
    `Vertex AI OK: "${String(text).slice(0, 60)}${String(text).length > 60 ? '...' : ''}"`
  );
};

main().catch((err) => {
  console.error('AI check failed:', err?.message || err);
  process.exit(1);
});