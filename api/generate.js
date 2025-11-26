
import { GoogleGenAI } from "@google/genai";

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

        // Read credentials from environment variables
        const projectId = process.env.VERTEX_PROJECT_ID;
        const clientEmail = process.env.VERTEX_CLIENT_EMAIL;
        const privateKey = process.env.VERTEX_PRIVATE_KEY;

        if (!projectId || !clientEmail || !privateKey) {
            return res.status(500).json({
                error: 'Missing Vertex AI credentials in environment variables'
            });
        }

        // Initialize Vertex AI Client
        const ai = new GoogleGenAI({
            vertexAI: true,
            project: projectId,
            location: 'us-central1',
            googleAuth: {
                credentials: {
                    client_email: clientEmail,
                    private_key: privateKey.replace(/\\n/g, '\n'), // Handle escaped newlines
                }
            }
        });

        // Use the new SDK method signature
        const result = await ai.models.generateContent({
            model: model || 'gemini-2.5-flash',
            contents: contents,
            config: config
        });

        // The new SDK returns the response directly or in a property?
        // Usually result.text is a getter or property.
        // Let's try to access text safely.
        const text = result.text ? result.text() : "";
        const usageMetadata = result.usageMetadata;
        const candidates = result.candidates;

        return res.status(200).json({
            text,
            usageMetadata,
            candidates
        });

    } catch (error) {
        console.error('Vertex AI Error:', error);
        return res.status(500).json({
            error: error.message || 'Internal Server Error',
            details: error.toString()
        });
    }
}
