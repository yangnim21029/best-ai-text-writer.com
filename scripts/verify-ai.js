import assert from 'node:assert/strict';
import { GoogleGenAI } from '@google/genai';

// Simple health check to ensure Gemini embedding works during build/deploy.
// Fails the build if embeddings cannot be fetched.
const main = async () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API;
  assert(apiKey, 'Missing GEMINI_API_KEY (or GOOGLE_GEMINI_API). Set it in Vercel env vars.');

  const client = new GoogleGenAI({ apiKey });

  const res = await client.models.embedContent({
    model: 'gemini-embedding-001',
    contents: [{ parts: [{ text: 'healthcheck' }] }],
  });

  const vec = res?.embeddings?.[0]?.values;
  assert(vec && vec.length > 0, 'No embedding returned from Gemini.');
  console.log(`AI check OK, dim=${vec.length}`);
};

main().catch((err) => {
  console.error('AI check failed:', err?.message || err);
  process.exit(1);
});
