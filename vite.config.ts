import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { GoogleGenAI } from '@google/genai';

/**
 * Parse Google credentials JSON string with error handling
 */
function parseGoogleCredentialsJson(jsonString: string): any {
  if (!jsonString) return null;

  try {
    let cleanedJson = jsonString;

    // Try original parse
    try {
      const parsed = JSON.parse(cleanedJson);
      if (parsed?.private_key) {
        parsed.private_key = normalizePrivateKey(parsed.private_key);
      }
      return parsed;
    } catch {
      // Remove outer quotes and retry
      if (
        (cleanedJson.startsWith('"') && cleanedJson.endsWith('"')) ||
        (cleanedJson.startsWith("'") && cleanedJson.endsWith("'"))
      ) {
        cleanedJson = cleanedJson.slice(1, -1);

        // Fix common escape issues
        cleanedJson = cleanedJson
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\\/g, '\\');
      }

      // Handle actual newlines in private_key
      cleanedJson = cleanedJson.replace(
        /"private_key":"([^"]*?)"/g,
        (_match, privateKeyContent) => {
          const fixedPrivateKey = privateKeyContent
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\t/g, '\\t');
          return `"private_key":"${fixedPrivateKey}"`;
        }
      );

      const parsed = JSON.parse(cleanedJson);
      if (parsed?.private_key) {
        parsed.private_key = normalizePrivateKey(parsed.private_key);
      }
      return parsed;
    }
  } catch (error) {
    console.error('Failed to parse Google credentials JSON:', error);
    return null;
  }
}

/**
 * Ensure \n and \r sequences inside the private key are properly expanded
 * when they come from a .env file.
 */
function normalizePrivateKey(privateKey: string) {
  if (!privateKey) return privateKey;
  return privateKey
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r');
}

/**
 * Pull credentials from a JSON blob or individual .env variables
 */
function loadVertexCredentials(env: Record<string, string>): any {
  const jsonFromEnv = parseGoogleCredentialsJson(env.GOOGLE_VERTEX_API_CONFIG_JSON);
  if (jsonFromEnv?.project_id && jsonFromEnv?.client_email && jsonFromEnv?.private_key) {
    return jsonFromEnv;
  }

  const projectId = env.GOOGLE_VERTEX_PROJECT_ID;
  const clientEmail = env.GOOGLE_VERTEX_CLIENT_EMAIL;
  const privateKey = env.GOOGLE_VERTEX_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return {
      project_id: projectId,
      client_email: clientEmail,
      private_key: normalizePrivateKey(privateKey)
    };
  }

  return null;
}

function loadGeminiApiKey(env: Record<string, string>): string | null {
  return env.GOOGLE_GEMINI_API || env.GEMINI_API_KEY || null;
}

function extractTextFromCandidate(candidate: any): string {
  if (!candidate) return '';
  const parts = candidate.content?.parts;
  if (Array.isArray(parts)) {
    return parts
      .map((part: any) => part?.text || '')
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

function extractText(result: any): string {
  if (!result) return '';
  if (typeof result.text === 'function') return result.text();
  if (typeof result.text === 'string') return result.text;

  if (result.response) {
    if (typeof result.response.text === 'function') return result.response.text();
    if (typeof result.response.text === 'string') return result.response.text;
    const textFromResponseCandidates = extractTextFromCandidate(result.response.candidates?.[0]);
    if (textFromResponseCandidates) return textFromResponseCandidates;
  }

  const textFromCandidates = extractTextFromCandidate(result.candidates?.[0]);
  if (textFromCandidates) return textFromCandidates;

  return '';
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET ||
    env.API_PROXY_TARGET ||
    '';

  return {
    server: {
      port: Number(env.VITE_PORT) || 5173,
      host: '0.0.0.0',
      proxy: apiProxyTarget ? {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false
        }
      } : undefined
    },
    plugins: [
      react(),
      // 若未設置代理目標，開發環境直接在 Vite 內處理 /api/generate 與 /api/embed
      !apiProxyTarget && {
        name: 'api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const setCors = () => {
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            };

            if (req.url?.startsWith('/api/embed') && (req.method === 'POST' || req.method === 'OPTIONS')) {
              setCors();

              if (req.method === 'OPTIONS') {
                res.statusCode = 200;
                res.end();
                return;
              }

              try {
                let body = '';
                req.on('data', chunk => {
                  body += chunk.toString();
                });

                req.on('end', async () => {
                  try {
                    const { texts, taskType, outputDimensionality, model } = JSON.parse(body);

                    if (!Array.isArray(texts) || texts.length === 0) {
                      res.statusCode = 400;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({ error: 'texts array is required' }));
                      return;
                    }

                    const geminiApiKey = loadGeminiApiKey(env);
                    const credentials = loadVertexCredentials(env);

                    let ai;
                    if (geminiApiKey) {
                      ai = new GoogleGenAI({
                        apiKey: geminiApiKey
                      });
                    } else if (credentials) {
                      if (!credentials.project_id && !credentials.projectId) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                          error: '憑證缺少 project id'
                        }));
                        return;
                      }
                      if (!credentials.client_email || !credentials.private_key) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                          error: '憑證缺少 client_email 或 private_key'
                        }));
                        return;
                      }

                      ai = new GoogleGenAI({
                        vertexai: true,
                        project: credentials.project_id || credentials.projectId,
                        location: env.GOOGLE_VERTEX_LOCATION || 'us-central1',
                        googleAuth: {
                          credentials: {
                            client_email: credentials.client_email,
                            private_key: credentials.private_key,
                          }
                        }
                      });
                    } else {
                      res.statusCode = 500;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({
                        error: '缺少 Vertex 憑證，且未設定 GOOGLE_GEMINI_API/GEMINI_API_KEY'
                      }));
                      return;
                    }

                    const contentsPayload = texts.map((text: string) => ({
                      parts: [{ text }]
                    }));

                    const embedResponse = await ai.models.embedContent({
                      model: model || 'gemini-embedding-001',
                      contents: contentsPayload,
                      config: {
                        taskType: taskType || 'SEMANTIC_SIMILARITY',
                        ...(outputDimensionality ? { outputDimensionality } : {})
                      }
                    });

                    const embeddings = Array.isArray(embedResponse.embeddings)
                      ? embedResponse.embeddings.map((e: any) => e?.values || [])
                      : [];

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({ embeddings }));
                  } catch (error: any) {
                    console.error('Embedding Error:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      error: error.message || 'Internal Server Error',
                      details: error.toString()
                    }));
                  }
                });
              } catch (error: any) {
                console.error('Request handling error:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  error: error.message || 'Internal Server Error'
                }));
              }
              return;
            }

            if (req.url?.startsWith('/api/generate') && req.method === 'POST') {
              setCors();

              if (req.method === 'OPTIONS') {
                res.statusCode = 200;
                res.end();
                return;
              }

              try {
                let body = '';
                req.on('data', chunk => {
                  body += chunk.toString();
                });

                req.on('end', async () => {
                  try {
                    const { model, contents, config } = JSON.parse(body);

                    const geminiApiKey = loadGeminiApiKey(env);
                    const credentials = loadVertexCredentials(env);

                    let ai;
                    if (geminiApiKey) {
                      ai = new GoogleGenAI({
                        apiKey: geminiApiKey
                      });
                    } else if (credentials) {
                      if (!credentials.project_id && !credentials.projectId) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                          error: '憑證缺少 project id'
                        }));
                        return;
                      }
                      if (!credentials.client_email || !credentials.private_key) {
                        res.statusCode = 500;
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify({
                          error: '憑證缺少 client_email 或 private_key'
                        }));
                        return;
                      }

                      ai = new GoogleGenAI({
                        vertexai: true,
                        project: credentials.project_id || credentials.projectId,
                        location: env.GOOGLE_VERTEX_LOCATION || 'us-central1',
                        googleAuth: {
                          credentials: {
                            client_email: credentials.client_email,
                            private_key: credentials.private_key,
                          }
                        }
                      });
                    } else {
                      res.statusCode = 500;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify({
                        error: '缺少 Vertex 憑證，且未設定 GOOGLE_GEMINI_API/GEMINI_API_KEY'
                      }));
                      return;
                    }

                    const result = await ai.models.generateContent({
                      model: model || 'gemini-2.5-flash',
                      contents,
                      config
                    });

                    const text = extractText(result);
                    const usageMetadata = result.usageMetadata;
                    const candidates = result.candidates;

                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      text,
                      usageMetadata,
                      candidates
                    }));
                  } catch (error: any) {
                    console.error('Vertex AI Error:', error);
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                      error: error.message || 'Internal Server Error',
                      details: error.toString()
                    }));
                  }
                });
              } catch (error: any) {
                console.error('Request handling error:', error);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  error: error.message || 'Internal Server Error'
                }));
              }
            } else {
              next();
            }
          });
        }
      }
    ].filter(Boolean),
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
          }
        }
      }
    }
  };
});
