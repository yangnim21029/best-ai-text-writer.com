import { GoogleGenAI } from "@google/genai";
import { VertexAI } from "@google-cloud/vertexai";

function normalizePrivateKey(privateKey) {
    if (!privateKey) return privateKey;
    return privateKey
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r');
}

function loadGeminiApiKey() {
    return process.env.GOOGLE_GEMINI_API || process.env.GEMINI_API_KEY || null;
}

function loadVertexCredentials() {
    const projectId = process.env.GOOGLE_PROJECT_ID
        || process.env.GOOGLE_VERTEX_PROJECT_ID
        || process.env.GOOGLE_CLOUD_PROJECT
        || process.env.GCP_PROJECT;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || process.env.GOOGLE_VERTEX_CLIENT_EMAIL;
    const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_VERTEX_PRIVATE_KEY);
    const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';

    if (projectId) {
        return { projectId, clientEmail, privateKey, location };
    }
    return null;
}

function buildClient() {
    const vertexCreds = loadVertexCredentials();
    if (vertexCreds && vertexCreds.clientEmail && vertexCreds.privateKey) {
        return new GoogleGenAI({
            vertexai: true,
            project: vertexCreds.projectId,
            location: vertexCreds.location,
            googleAuth: {
                credentials: {
                    client_email: vertexCreds.clientEmail,
                    private_key: vertexCreds.privateKey
                }
            }
        });
    }

    const apiKey = loadGeminiApiKey();
    if (apiKey) {
        return new GoogleGenAI({ apiKey });
    }

    return null;
}

export default async function handler(req, res) {
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

        const client = buildClient();
        if (!client) {
            return res.status(500).json({
                error: 'Missing Vertex credentials (GOOGLE_PROJECT_ID/GOOGLE_VERTEX_PROJECT_ID, GOOGLE_CLIENT_EMAIL/GOOGLE_VERTEX_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY/GOOGLE_VERTEX_PRIVATE_KEY) and GOOGLE_GEMINI_API/GEMINI_API_KEY is not set'
            });
        }

        const modelId = model || 'gemini-embedding-001';
        const basePayload = {
            taskType: taskType || 'SEMANTIC_SIMILARITY',
            ...(outputDimensionality ? { outputDimensionality } : {})
        };
        let embeddings = [];

        // Prefer explicit Vertex AI (service account or ADC)
        if (client === null && loadVertexCredentials()?.projectId) {
            const vertexCreds = loadVertexCredentials();
            const vertex = new VertexAI({
                project: vertexCreds.projectId,
                location: vertexCreds.location || 'us-central1',
                ...(vertexCreds.clientEmail && vertexCreds.privateKey
                    ? { googleAuthOptions: { credentials: { client_email: vertexCreds.clientEmail, private_key: vertexCreds.privateKey } } }
                    : {})
            });
            const embedModel = vertex.getGenerativeModel({ model: modelId });
            embeddings = await Promise.all(
                texts.map(async (text) => {
                    const resp = await embedModel.embedContent({
                        ...basePayload,
                        content: {
                            role: 'user',
                            parts: [{ text }]
                        }
                    });
                    return resp?.embedding?.values || [];
                })
            );
        } else if (client) {
            const supportsBatch = typeof client.models?.batchEmbedContents === 'function';

            if (supportsBatch) {
                const requests = texts.map((text) => ({
                    content: {
                        role: 'user',
                        parts: [{ text }]
                    },
                    model: modelId,
                    ...basePayload
                }));

                const response = await client.models.batchEmbedContents({ model: modelId, requests });
                embeddings = Array.isArray(response.embeddings)
                    ? response.embeddings.map((e) => e?.values || [])
                    : [];
            } else {
                embeddings = await Promise.all(
                    texts.map(async (text) => {
                        const resp = await client.models.embedContent({
                            model: modelId,
                            ...basePayload,
                            content: {
                                role: 'user',
                                parts: [{ text }]
                            }
                        });
                        return resp?.embedding?.values || resp?.data?.embedding?.values || [];
                    })
                );
            }
        } else {
            return res.status(500).json({
                error: 'Missing Vertex credentials (GOOGLE_PROJECT_ID/GOOGLE_VERTEX_PROJECT_ID, GOOGLE_CLIENT_EMAIL/GOOGLE_VERTEX_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY/GOOGLE_VERTEX_PRIVATE_KEY) and GOOGLE_GEMINI_API/GEMINI_API_KEY is not set'
            });
        }

        return res.status(200).json({ embeddings });
    } catch (error) {
        console.error('Embedding Error:', error);
        return res.status(500).json({
            error: error.message || 'Internal Server Error',
            details: error.toString()
        });
    }
}
