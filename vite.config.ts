import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// 只引入 Vertex AI SDK
import { VertexAI } from '@google-cloud/vertexai';

/**
 * 處理 Private Key 的換行符號問題
 */
function normalizePrivateKey(privateKey: string) {
  if (!privateKey) return privateKey;
  return privateKey
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/^"|"$/g, ''); // 移除前後可能的引號
}

/**
 * 讀取 Vertex 憑證
 */
function loadVertexCredentials(env: Record<string, string>): any {
  const projectId = env.GOOGLE_PROJECT_ID || env.GOOGLE_VERTEX_PROJECT_ID;
  const clientEmail = env.GOOGLE_CLIENT_EMAIL || env.GOOGLE_VERTEX_CLIENT_EMAIL;
  const privateKey = env.GOOGLE_PRIVATE_KEY || env.GOOGLE_VERTEX_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: normalizePrivateKey(privateKey)
    };
  }
  return null;
}

/**
 * 提取文字內容 (針對 Vertex AI 格式)
 */
function extractText(result: any): string {
  if (!result) return '';
  if (result.response?.candidates?.[0]?.content?.parts) {
    return result.response.candidates[0].content.parts.map((p: any) => p.text).join('');
  }
  // 備用檢查
  if (result.candidates?.[0]?.content?.parts) {
    return result.candidates[0].content.parts.map((p: any) => p.text).join('');
  }
  return '';
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || env.API_PROXY_TARGET || '';

  return {
    server: {
      port: Number(env.VITE_PORT) || 5173,
      host: '0.0.0.0',
      proxy: apiProxyTarget ? {
        '/api': { target: apiProxyTarget, changeOrigin: true, secure: false }
      } : undefined
    },
    plugins: [
      react(),
      !apiProxyTarget && {
        name: 'api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const setCors = () => {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            };

            // ==========================================
            //  /api/embed (Vertex AI Only)
            // ==========================================
            if (req.url?.startsWith('/api/embed') && (req.method === 'POST' || req.method === 'OPTIONS')) {
              setCors();
              if (req.method === 'OPTIONS') { res.statusCode = 200; res.end(); return; }

              try {
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                req.on('end', async () => {
                  try {
                    const { texts, taskType, outputDimensionality, model } = JSON.parse(body);

                    if (!Array.isArray(texts) || texts.length === 0) {
                      res.statusCode = 400;
                      res.end(JSON.stringify({ error: 'texts array is required' }));
                      return;
                    }

                    const credentials = loadVertexCredentials(env);
                    if (!credentials) {
                      throw new Error("Missing Vertex AI Credentials (GOOGLE_PROJECT_ID, CLIENT_EMAIL, PRIVATE_KEY)");
                    }

                    const modelId = model || 'text-embedding-004';
                    const location = env.GOOGLE_VERTEX_LOCATION || 'us-central1';

                    const vertex = new VertexAI({
                      project: credentials.project_id,
                      location,
                      googleAuthOptions: {
                        projectId: credentials.project_id,
                        credentials: {
                          client_email: credentials.client_email,
                          private_key: credentials.private_key
                        },
                        scopes: ['https://www.googleapis.com/auth/cloud-platform']
                      }
                    });

                    // Access GoogleAuth from the Vertex client to fetch a token
                    const token = await (vertex as any).googleAuth.getAccessToken();
                    if (!token) {
                      throw new Error('Failed to obtain access token for embeddings');
                    }

                    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${credentials.project_id}/locations/${location}/publishers/google/models/${modelId}:predict`;

                    const parameters: any = {};
                    if (taskType) parameters.taskType = taskType;
                    if (outputDimensionality) parameters.outputDimensionality = outputDimensionality;

                    const payload = {
                      instances: texts.map((text: string) => ({ content: text })),
                      ...(Object.keys(parameters).length ? { parameters } : {})
                    };

                    const resp = await fetch(endpoint, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                      },
                      body: JSON.stringify(payload)
                    });

                    if (!resp.ok) {
                      const detail = await resp.text();
                      throw new Error(`Embedding request failed (${resp.status}): ${detail}`);
                    }

                    const data = await resp.json();
                    const predictions = data?.predictions || [];
                    const embeddings = predictions.map((pred: any) => {
                      if (Array.isArray(pred?.embeddings)) {
                        return pred.embeddings[0]?.values || [];
                      }
                      if (pred?.embeddings?.values) return pred.embeddings.values;
                      if (pred?.values) return pred.values;
                      return [];
                    });

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ embeddings }));
                  } catch (error: any) {
                    console.error('Embed API Error:', error);
                    res.statusCode = 500;
                    res.end(JSON.stringify({ error: error.message }));
                  }
                });
              } catch (e) { res.statusCode = 500; res.end(); }
              return;
            }

            // ==========================================
            //  /api/generate (Vertex AI Only)
            // ==========================================
            if (req.url?.startsWith('/api/generate') && req.method === 'POST') {
              setCors();
              if (req.method === 'OPTIONS') { res.statusCode = 200; res.end(); return; }

              try {
                let body = '';
                req.on('data', chunk => body += chunk.toString());
                req.on('end', async () => {
                  try {
                    const { model, contents, config } = JSON.parse(body);
                    const credentials = loadVertexCredentials(env);

                    if (!credentials) {
                      throw new Error("Missing Vertex AI Credentials");
                    }

                    const vertex = new VertexAI({
                      project: credentials.project_id,
                      location: env.GOOGLE_VERTEX_LOCATION || 'us-central1',
                      googleAuthOptions: {
                        credentials: {
                          client_email: credentials.client_email,
                          private_key: credentials.private_key
                        }
                      }
                    });

                    const generativeModel = vertex.getGenerativeModel({
                      model: model || 'gemini-1.5-flash',
                      generationConfig: config
                    });

                    const result = await generativeModel.generateContent({ contents });

                    const text = extractText(result);
                    const usageMetadata = result.response?.usageMetadata;
                    const candidates = result.response?.candidates;

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ text, usageMetadata, candidates }));

                  } catch (error: any) {
                    console.error('Generate API Error:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ error: error.message }));
                  }
                });
              } catch (e) { res.statusCode = 500; res.end(); }
            } else {
              next();
            }
          });
        }
      }
    ].filter(Boolean),
    resolve: { alias: { '@': path.resolve(__dirname, '.') } }
  };
});
