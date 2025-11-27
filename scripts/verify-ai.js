import assert from 'node:assert/strict';
import { VertexAI } from '@google-cloud/vertexai';

const normalizePrivateKey = (key) => key?.replace(/\\n/g, '\n').replace(/\\r/g, '\r');

// Simple health check to ensure Vertex Gemini text generation works during build/deploy.
// Fails the build if the model cannot be reached.
const main = async () => {
  const project = process.env.GOOGLE_PROJECT_ID;
  const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

  assert(project && clientEmail && privateKey, 'Missing Vertex credentials (GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY).');

  const vertex_ai = new VertexAI({
    project,
    location,
    googleAuthOptions: {
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
    },
  });

  const model = vertex_ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const res = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: 'healthcheck' }] }],
  });

  const text = res?.response?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('');
  assert(text && text.length > 0, 'No response text from Vertex Gemini.');
  console.log(`AI check OK, sample="${text.slice(0, 60)}${text.length > 60 ? '...' : ''}"`);
};

main().catch((err) => {
  console.error('AI check failed:', err?.message || err);
  process.exit(1);
});
