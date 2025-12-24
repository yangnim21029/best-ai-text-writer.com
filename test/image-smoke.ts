import dotenv from 'dotenv';
import path from 'path';
import { GoogleAuth } from 'google-auth-library';

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const project = process.env.GOOGLE_VERTEX_PROJECT;
const location = 'us-central1'; // 圖片生成強制使用區域
const credentials = process.env.GOOGLE_VERTEX_CREDENTIALS;

const run = async () => {
  if (!project || !credentials) {
    throw new Error('Please set GOOGLE_VERTEX_PROJECT and GOOGLE_VERTEX_CREDENTIALS');
  }

  console.log(`→ Testing Nanobanana Image Generation [${project}/${location}]`);

  // 1. Get Auth
  const auth = new GoogleAuth({
    credentials: JSON.parse(credentials.trim().replace(/^'|'$/g, '')),
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const accessToken = tokenResponse.token;

  // 2. Call API with fallback
  const locations = ['us-central1', 'us-east4', 'asia-northeast1'];
  const models = ['gemini-3-flash-preview', 'imagen-3.0-generate-001'];
  
  for (const loc of locations) {
    for (const modelId of models) {
      const url = `https://${loc}-aiplatform.googleapis.com/v1/projects/${project}/locations/${loc}/publishers/google/models/${modelId}:predict`;
      console.log(`→ Trying ${modelId} in ${loc}...`);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [{ prompt: "A simple clean modern icon of a banana, minimalist style, white background" }],
          parameters: { sampleCount: 1, aspectRatio: "1:1" },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const base64 = data.predictions?.[0]?.bytesBase64;
        if (base64) {
          console.log(`✓ SUCCESS with ${modelId} in ${loc}!`);
          return;
        }
      } else {
        console.log(`✗ FAILED ${modelId} in ${loc}: ${res.status}`);
      }
    }
  }
  
  throw new Error('All models failed');
};

run().catch(console.error);
