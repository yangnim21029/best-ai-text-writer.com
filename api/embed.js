import { VertexAI } from "@google-cloud/vertexai";

/**
 * 處理 Private Key 的換行符號問題
 * .env 檔案中的 \n 常被讀取為字串 "\\n"，需要轉換回真正的換行符號
 */
function normalizePrivateKey(privateKey) {
    if (!privateKey) return privateKey;
    let key = privateKey.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    // 新增：移除前後可能多餘的引號
    return key.replace(/^"|"$/g, '');
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

        // 3. 初始化 Vertex AI 並透過內部 GoogleAuth 取得存取權杖
        const vertex = new VertexAI({
            project: projectId,
            location: location,
            googleAuthOptions: {
                projectId: projectId,
                credentials: {
                    client_email: clientEmail,
                    private_key: normalizePrivateKey(privateKeyRaw)
                },
                scopes: ['https://www.googleapis.com/auth/cloud-platform']
            }
        });

        const token = await vertex.googleAuth.getAccessToken();
        if (!token) {
            throw new Error('Failed to obtain access token for embeddings');
        }

        // 4. 呼叫 Vertex Embedding REST API
        // 如果前端沒傳 model，預設使用 text-embedding-004 (目前 Vertex 最推薦的)
        const modelId = model || 'text-embedding-004';
        const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;

        const parameters = {
            ...(taskType ? { taskType } : {}),
            ...(outputDimensionality ? { outputDimensionality } : {})
        };

        const payload = {
            instances: texts.map(text => ({ content: text })),
            ...(Object.keys(parameters).length ? { parameters } : {})
        };

        const apiResp = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!apiResp.ok) {
            const detail = await apiResp.text();
            throw new Error(`Embedding request failed (${apiResp.status}): ${detail}`);
        }

        const data = await apiResp.json();
        const predictions = data?.predictions || [];
        const embeddings = predictions.map(pred => {
            if (Array.isArray(pred?.embeddings)) return pred.embeddings[0]?.values || [];
            if (pred?.embeddings?.values) return pred.embeddings.values;
            if (pred?.values) return pred.values;
            return [];
        });

        return res.status(200).json({ embeddings });

    } catch (error) {
        console.error('Vertex AI Embedding Error:', error);
        return res.status(500).json({
            error: error.message || 'Internal Server Error',
            details: error.toString()
        });
    }
}
