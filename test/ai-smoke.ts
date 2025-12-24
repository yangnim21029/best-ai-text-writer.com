import 'dotenv/config';
import { createVertex } from '@ai-sdk/google-vertex';
import { generateObject } from 'ai';
import { z } from 'zod';

const project = process.env.GOOGLE_VERTEX_PROJECT;
const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
const credentials = process.env.GOOGLE_VERTEX_CREDENTIALS;
const modelId = process.env.AI_WRITER_MODEL || 'gemini-1.5-pro';

const run = async () => {
  if (!project) {
    throw new Error('Please set GOOGLE_VERTEX_PROJECT');
  }

  console.log(`→ Verifying Vertex AI [${project}/${location}] (model=${modelId})`);

  const vertex = createVertex({
    project,
    location,
    googleAuthOptions: {
      credentials: credentials ? JSON.parse(credentials) : undefined,
    },
  });

  const { object, usage } = await generateObject({
    model: vertex(modelId),
    prompt: 'Return a tiny JSON summary with ok=true and a 1-line status message.',
    schema: z.object({
      ok: z.boolean(),
      summary: z.string(),
    }),
  });

  if (!object || object.ok !== true) {
    throw new Error(`Unexpected result: ${JSON.stringify(object)}`);
  }

  console.log('✓ AI reachable (Vertex AI)');
  console.log('  summary:', object.summary);
  console.log('  usage:', JSON.stringify(usage));
};

run().catch((err) => {
  console.error('✗ AI smoke test failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});