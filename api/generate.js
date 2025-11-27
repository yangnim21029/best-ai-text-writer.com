import { VertexAI } from '@google-cloud/vertexai';
import { GoogleGenAI } from "@google/genai";

/**
 * Ensure \n and \r sequences inside the private key are properly expanded
 * when they come from a .env file.
 */
function normalizePrivateKey(privateKey) {
    if (!privateKey) return privateKey;
    return privateKey
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r');
}

function loadGeminiApiKey() {
    return process.env.GOOGLE_GEMINI_API || process.env.GEMINI_API_KEY || null;
}

function extractText(result) {
    if (!result) return '';

    // Handle Vertex AI response structure
    if (result.response) {
        if (Array.isArray(result.response.candidates) && result.response.candidates.length > 0) {
            const candidate = result.response.candidates[0];
            if (candidate.content && Array.isArray(candidate.content.parts)) {
                return candidate.content.parts.map(p => p.text).join('');
            }
        }
    }

    // Handle Google GenAI response structure
    if (typeof result.text === 'function') return result.text();
    if (typeof result.text === 'string') return result.text;

    const candidates = result.candidates || (result.response && result.response.candidates);
    if (candidates && candidates[0]) {
        const parts = candidates[0].content?.parts;
        if (Array.isArray(parts)) {
            return parts.map(part => part?.text || '').join('');
        }
    }

    return '';
}

export default async function handler(req, res) {
    // CORS headers
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
        const { model, contents, config } = req.body;

        // Check for Vertex credentials first (User preference)
        const projectId = process.env.GOOGLE_PROJECT_ID;
        const location = process.env.GOOGLE_VERTEX_LOCATION || 'us-central1';
        const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
        const privateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);

        let result;
        let usageMetadata;
        let candidates;

        if (projectId && clientEmail && privateKey) {
            const vertex_ai = new VertexAI({
                project: projectId,
                location: location,
                googleAuthOptions: {
                    credentials: {
                        client_email: clientEmail,
                        private_key: privateKey
                    }
                }
            });

            const generativeModel = vertex_ai.getGenerativeModel({
                model: model || 'gemini-1.5-flash',
                generationConfig: config
            });

            const resp = await generativeModel.generateContent({
                contents: contents
            });

            result = resp;
            // Vertex AI response structure normalization
            usageMetadata = resp.response.usageMetadata;
            candidates = resp.response.candidates;

        } else {
            // Fallback to Gemini API Key
            const geminiApiKey = loadGeminiApiKey();
            if (geminiApiKey) {
                const ai = new GoogleGenAI({ apiKey: geminiApiKey });
                const genModel = ai.getGenerativeModel({
                    model: model || 'gemini-1.5-flash',
                    generationConfig: config
                });

                result = await genModel.generateContent({ contents });
                usageMetadata = result.usageMetadata;
                candidates = result.candidates;
            } else {
                return res.status(500).json({
                    error: 'Missing Vertex credentials (GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY) and GOOGLE_GEMINI_API/GEMINI_API_KEY is not set'
                });
            }
        }

        const text = extractText(result);

        return res.status(200).json({
            text,
            usageMetadata,
            candidates
        });

    } catch (error) {
        console.error('Vertex/Gemini Error:', error);
        return res.status(500).json({
            error: error.message || 'Internal Server Error',
            details: error.toString()
        });
    }
}
