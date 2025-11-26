
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
function normalizePrivateKey(privateKey) {
    if (!privateKey) return privateKey;
    return privateKey
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r');
}

/**
 * Pull credentials from a JSON blob or individual .env variables
 */
function loadVertexCredentials() {
    const jsonFromEnv = parseGoogleCredentialsJson(process.env.GOOGLE_VERTEX_API_CONFIG_JSON);
    if (jsonFromEnv?.project_id && jsonFromEnv?.client_email && jsonFromEnv?.private_key) {
        return jsonFromEnv;
    }

    const projectId = process.env.GOOGLE_VERTEX_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_VERTEX_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_VERTEX_PRIVATE_KEY;

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
 * Ensure \n and \r sequences inside the private key are properly expanded
 * when they come from a .env file.
 */
function normalizePrivateKey(privateKey) {
    if (!privateKey) return privateKey;
    return privateKey
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '\r');
}

/**
 * Pull credentials from a JSON blob or individual .env variables
 */
function loadVertexCredentials() {
    const jsonFromEnv = parseGoogleCredentialsJson(process.env.GOOGLE_VERTEX_API_CONFIG_JSON);
    if (jsonFromEnv?.project_id && jsonFromEnv?.client_email && jsonFromEnv?.private_key) {
        return jsonFromEnv;
    }

    const projectId = process.env.GOOGLE_VERTEX_PROJECT_ID;
    const clientEmail = process.env.GOOGLE_VERTEX_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_VERTEX_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
        return {
            project_id: projectId,
            client_email: clientEmail,
            private_key: normalizePrivateKey(privateKey)
        };
    }

    return null;
}

function loadGeminiApiKey() {
    return process.env.GOOGLE_GEMINI_API || process.env.GEMINI_API_KEY || null;
}

function extractTextFromCandidate(candidate) {
    if (!candidate) return '';
    const parts = candidate.content?.parts;
    if (Array.isArray(parts)) {
        return parts
            .map(part => part?.text || '')
            .filter(Boolean)
            .join(' ');
    }
    return '';
}

function extractText(result) {
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

        // 如果提供了 Gemini API key，優先使用 Gemini；否則使用 Vertex 憑證
        const geminiApiKey = loadGeminiApiKey();
        const credentials = loadVertexCredentials();

        let ai;
        if (geminiApiKey) {
            ai = new GoogleGenAI({
                apiKey: geminiApiKey
            });
        } else if (credentials) {
            // Validate required fields
            if (!credentials.project_id && !credentials.projectId) {
                return res.status(500).json({
                    error: 'Invalid credentials: missing required project id'
                });
            }
            if (!credentials.client_email || !credentials.private_key) {
                return res.status(500).json({
                    error: 'Invalid credentials: missing client_email or private_key'
                });
            }

            ai = new GoogleGenAI({
                vertexai: true,
                project: credentials.project_id || credentials.projectId,
                location: process.env.GOOGLE_VERTEX_LOCATION || 'us-central1',
                googleAuth: {
                    credentials: {
                        client_email: credentials.client_email,
                        private_key: credentials.private_key,
                    }
                }
            });
        } else {
            return res.status(500).json({
                error: 'Missing Vertex credentials and GOOGLE_GEMINI_API/GEMINI_API_KEY is not set'
            });
        }

        // Generate content
        const result = await ai.models.generateContent({
            model: model || 'gemini-2.5-flash',
            contents: contents,
            config: config
        });

        const text = extractText(result);
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
