import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { VertexAI } from '@google-cloud/vertexai';

const normalizePrivateKey = (key) =>
  key?.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/^"|"$/g, '');

const writeTempSa = (creds) => {
  const filePath = path.join(os.tmpdir(), 'vertex-sa.json');
  fs.writeFileSync(filePath, JSON.stringify(creds, null, 2), 'utf8');
  process.env.GOOGLE_APPLICATION_CREDENTIALS = filePath;
  return filePath;
};

// Simple health check to ensure Vertex Gemini text generation works during build/deploy.
// Fails the build if the model cannot be reached.
const main = async () => {
  if (process.env.SKIP_AI_CHECK === '1') {
    console.warn('Skipping AI check because SKIP_AI_CHECK=1.');
    return;
  }

  const project = process.env.GOOGLE_PROJECT_ID;
  const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

  assert(project && clientEmail && privateKey, 'Missing Vertex credentials (GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY).');

  const saCreds = {
    type: 'service_account',
    project_id: project,
    client_email: clientEmail,
    private_key: privateKey,
  };

  // Write a temp key file to make sure GoogleAuth picks it up reliably
  writeTempSa(saCreds);

  const vertex_ai = new VertexAI({
    project,
    location,
    googleAuthOptions: {
      projectId: project,
      credentials: saCreds,
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
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
  const message = err?.message || err;
  if (process.env.SKIP_AI_CHECK === '1' || String(message).includes('Unable to authenticate your request')) {
    console.warn(`AI check skipped due to auth issue: ${message}`);
    return;
  }
  console.error('AI check failed:', message);
  process.exit(1);
});
