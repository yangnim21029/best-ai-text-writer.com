import { VertexAI } from '@google-cloud/vertexai';

/**
 * Ensure \n and \r sequences inside the private key are properly expanded
 * when they come from a .env file.
 */
function normalizePrivateKey(privateKey) {
    if (!privateKey) return privateKey;
    let key = privateKey.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    // 新增：移除前後可能多餘的引號
    return key.replace(/^"|"$/g, '');
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

        if (!projectId || !clientEmail || !privateKey) {
            return res.status(500).json({
                error: 'Missing Vertex credentials (GOOGLE_PROJECT_ID, GOOGLE_CLIENT_EMAIL, GOOGLE_PRIVATE_KEY)'
            });
        }

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

        // Vertex AI response structure normalization
        const usageMetadata = resp.response.usageMetadata;
        const candidates = resp.response.candidates;
        const result = resp;

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
