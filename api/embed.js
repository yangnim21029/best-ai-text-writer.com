import { VertexAI } from "@google-cloud/vertexai";

/**
 * 處理 Private Key 的換行符號問題
 * .env 檔案中的 \n 常被讀取為字串 "\\n"，需要轉換回真正的換行符號
 */
function normalizePrivateKey(privateKey) {
    if (!privateKey) return privateKey;
    return privateKey
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r');
}

export default async function handler(req, res) {
    // 1. 設定 CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { texts, taskType, outputDimensionality, model } = req.body || {};

        if (!Array.isArray(texts) || texts.length === 0) {
            return res.status(400).json({ error: 'texts array is required' });
        }

        // 2. 讀取並檢查 Vertex AI 憑證
        // 支援多種常見的環境變數命名方式
        const projectId = process.env.GOOGLE_PROJECT_ID
            || process.env.GOOGLE_VERTEX_PROJECT_ID
            || process.env.GOOGLE_CLOUD_PROJECT
            || process.env.GCP_PROJECT;

        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_VERTEX_CLIENT_EMAIL;
        const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_VERTEX_PRIVATE_KEY;
        const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';

        // 嚴格檢查：如果缺少任何一個憑證，直接報錯，不讓 SDK 去猜測
        if (!projectId || !clientEmail || !privateKeyRaw) {
            console.error("Missing Credentials:", {
                hasProjectId: !!projectId,
                hasClientEmail: !!clientEmail,
                hasPrivateKey: !!privateKeyRaw
            });
            return res.status(500).json({
                error: 'Missing Vertex AI credentials. Please check GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL, and GOOGLE_PRIVATE_KEY in your environment variables.'
            });
        }

        // 3. 初始化 Vertex AI Client
        // 關鍵：明確傳入 googleAuthOptions，這會阻止 SDK 去找檔案
        const vertex = new VertexAI({
            project: projectId,
            location: location,
            googleAuthOptions: {
                credentials: {
                    client_email: clientEmail,
                    private_key: normalizePrivateKey(privateKeyRaw)
                }
            }
        });

        // 4. 取得模型並執行 Embedding
        // 如果前端沒傳 model，預設使用 text-embedding-004 (目前 Vertex 最推薦的)
        const modelId = model || 'text-embedding-004';
        const generativeModel = vertex.getGenerativeModel({ model: modelId });

        const basePayload = {
            taskType: taskType || 'SEMANTIC_SIMILARITY',
            ...(outputDimensionality ? { outputDimensionality } : {})
        };

        // Vertex AI 雖然有 batch 支援，但簡單起見或避免 Payload 過大，這裡使用 Promise.all 並行處理
        // 如果 texts 數量非常大 (>100)，建議分批處理 (chunking)
        const embeddings = await Promise.all(
            texts.map(async (text) => {
                try {
                    const resp = await generativeModel.embedContent({
                        ...basePayload,
                        content: {
                            role: 'user',
                            parts: [{ text }]
                        }
                    });
                    return resp?.embedding?.values || [];
                } catch (err) {
                    console.error(`Error embedding text: "${text.substring(0, 20)}..."`, err.message);
                    return []; // 失敗時回傳空陣列，避免整個請求掛掉
                }
            })
        );

        return res.status(200).json({ embeddings });

    } catch (error) {
        console.error('Vertex AI Embedding Error:', error);
        return res.status(500).json({
            error: error.message || 'Internal Server Error',
            details: error.toString()
        });
    }
}