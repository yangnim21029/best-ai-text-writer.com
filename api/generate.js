
import { GoogleGenAI } from "@google/genai";

/**
 * Parse Google credentials JSON string with error handling
 */
function parseGoogleCredentialsJson(jsonString) {
    if (!jsonString) return null;

    try {
        let cleanedJson = jsonString;

        // Try original parse
        try {
            return JSON.parse(cleanedJson);
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

            return JSON.parse(cleanedJson);
        }
    } catch (error) {
        console.error('Failed to parse Google credentials JSON:', error);
        return null;
    }
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

        // Parse credentials from GOOGLE_VERTEX_API_CONFIG_JSON
        const credentialsJson = process.env.GOOGLE_VERTEX_API_CONFIG_JSON;

        if (!credentialsJson) {
            return res.status(500).json({
                error: 'Missing GOOGLE_VERTEX_API_CONFIG_JSON environment variable'
            });
        }

        const credentials = parseGoogleCredentialsJson(credentialsJson);

        if (!credentials) {
            return res.status(500).json({
                error: 'Failed to parse GOOGLE_VERTEX_API_CONFIG_JSON'
            });
        }

        // Validate required fields
        if (!credentials.project_id || !credentials.client_email || !credentials.private_key) {
            return res.status(500).json({
                error: 'Invalid credentials: missing required fields (project_id, client_email, private_key)'
            });
        }

        // Initialize Vertex AI Client
        const ai = new GoogleGenAI({
            vertexAI: true,
            project: credentials.project_id,
            location: process.env.GOOGLE_VERTEX_LOCATION || 'us-central1',
            googleAuth: {
                credentials: {
                    client_email: credentials.client_email,
                    private_key: credentials.private_key,
                }
            }
        });

        // Generate content
        const result = await ai.models.generateContent({
            model: model || 'gemini-2.5-flash',
            contents: contents,
            config: config
        });

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
