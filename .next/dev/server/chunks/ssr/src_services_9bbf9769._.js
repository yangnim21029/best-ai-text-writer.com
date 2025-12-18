module.exports = [
"[project]/src/services/engine/promptService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateCost",
    ()=>calculateCost,
    "extractRawSnippets",
    ()=>extractRawSnippets,
    "getLanguageInstruction",
    ()=>getLanguageInstruction,
    "normalizeTokenUsage",
    ()=>normalizeTokenUsage,
    "toTokenUsage",
    ()=>toTokenUsage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/constants.ts [app-ssr] (ecmascript)");
;
const asNumber = (...values)=>{
    for (const value of values){
        const num = typeof value === 'string' ? Number(value) : value;
        if (typeof num === 'number' && Number.isFinite(num)) {
            return num;
        }
    }
    return 0;
};
const pickUsageContainer = (usage)=>{
    if (!usage) return null;
    // Prefer totalUsage when present (Vercel AI SDK format)
    if (usage.totalUsage || usage.usage) {
        return usage.totalUsage || usage.usage;
    }
    // Sometimes usage is nested under data/metadata
    if (usage.data?.totalUsage || usage.data?.usage) {
        return usage.data.totalUsage || usage.data.usage;
    }
    if (usage.metadata?.totalUsage || usage.metadata?.usage) {
        return usage.metadata.totalUsage || usage.metadata.usage;
    }
    return usage;
};
const normalizeTokenUsage = (usage)=>{
    const source = pickUsageContainer(usage) || {};
    let inputTokens = asNumber(source.inputTokens, source.promptTokens, source.prompt_tokens, source.input_tokens, source.promptTokenCount, source.inputTokenCount, source.tokens?.inputTokens, source.tokens?.promptTokens);
    let outputTokens = asNumber(source.outputTokens, source.completionTokens, source.output_tokens, source.completion_tokens, source.candidatesTokenCount, source.outputTokenCount, source.tokens?.outputTokens, source.tokens?.completionTokens);
    let totalTokens = asNumber(source.totalTokens, source.total_tokens, source.totalTokenCount, source.tokens?.totalTokens);
    if (!totalTokens) {
        totalTokens = inputTokens + outputTokens;
    } else if (!inputTokens && outputTokens && totalTokens >= outputTokens) {
        inputTokens = totalTokens - outputTokens;
    } else if (!outputTokens && inputTokens && totalTokens >= inputTokens) {
        outputTokens = totalTokens - inputTokens;
    } else if (!inputTokens && !outputTokens) {
        inputTokens = totalTokens;
    }
    return {
        inputTokens,
        outputTokens,
        totalTokens
    };
};
const calculateCost = (usage, modelType)=>{
    const normalized = normalizeTokenUsage(usage);
    const rates = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PRICING"][modelType];
    const inputCost = normalized.inputTokens * rates.input;
    const outputCost = normalized.outputTokens * rates.output;
    return {
        usage: normalized,
        cost: {
            inputCost,
            outputCost,
            totalCost: inputCost + outputCost
        }
    };
};
const toTokenUsage = (usage)=>normalizeTokenUsage(usage);
const getLanguageInstruction = (audience)=>{
    switch(audience){
        case 'zh-HK':
            return `
          **OUTPUT LANGUAGE:** Traditional Chinese (Hong Kong).
          - Use Hong Kong specific vocabulary (e.g., '質素' instead of '品質', '互聯網' instead of '網際網路', '智能手機').
          - Style should be natural for Hong Kong readers (Standard Written Chinese with HK nuances).
          - **STRICTLY FORBIDDEN:** Spoken Cantonese particles (e.g., 嘅, 係, 咗, 佢, 咁) unless explicitly requested.
          - Maintain a professional written tone (Standard Written Chinese).

          `;
        case 'zh-MY':
            return `
          **OUTPUT LANGUAGE:** Simplified Chinese (Malaysia).
          - Use Simplified characters.
          - Use Malaysia-specific Chinese vocabulary and context where applicable (e.g., '巴刹' for market, '巴士' for bus, local currency references if needed).
          - Tone: Relatable to Malaysian Chinese readers.

          `;
        case 'zh-TW':
        default:
            return `
          **OUTPUT LANGUAGE:** Traditional Chinese (Taiwan).
          - Use Taiwan specific vocabulary (e.g., '品質', '網際網路', '計程車').
          - Style should be natural for Taiwanese readers.
          - **STRICTLY FORBIDDEN:** Cantonese particles (e.g., 嘅, 係, 咗, 佢, 咁) and Hong Kong specific vocabulary (e.g., '質素').
          - Ensure the tone is standard written Chinese suitable for Taiwan.

          `;
    }
};
const extractRawSnippets = (text, keyword, contextWindowChars = 100)=>{
    if (!text || !keyword) return [];
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = [];
    let match;
    // Limit processing to prevent hang on massive texts
    let count = 0;
    const MAX_LOOPS = 50;
    while((match = regex.exec(text)) !== null && count < MAX_LOOPS){
        count++;
        const start = Math.max(0, match.index - contextWindowChars);
        const end = Math.min(text.length, match.index + keyword.length + contextWindowChars);
        // Clean up whitespace
        const snippet = "..." + text.substring(start, end).replace(/\s+/g, ' ').trim() + "...";
        matches.push(snippet);
    }
    // Deduplicate snippets
    const uniqueMatches = Array.from(new Set(matches));
    // Return max 3 snippets to avoid token overflow and UI clutter
    return uniqueMatches.slice(0, 3);
};
}),
"[project]/src/services/engine/genAIClient.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GenAIClient",
    ()=>GenAIClient,
    "buildAiUrl",
    ()=>buildAiUrl,
    "env",
    ()=>env,
    "genAIClient",
    ()=>genAIClient,
    "getAiHeaders",
    ()=>getAiHeaders
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/constants.ts [app-ssr] (ecmascript)");
;
const DEFAULT_RETRY = {
    attempts: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AI_DEFAULTS"].RETRY_ATTEMPTS,
    delayMs: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AI_DEFAULTS"].RETRY_DELAY_MS
};
const DEFAULT_TIMEOUT = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AI_DEFAULTS"].TIMEOUT_MS;
const env = process.env;
const isBrowser = ("TURBOPACK compile-time value", "undefined") !== 'undefined';
// In Next.js, we'll use the local API route (/api/ai) as a proxy
// This avoids CORS issues and keeps the AI token secure on the server.
const AI_BASE_URL = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : env.AI_BASE_URL || '';
const AI_PATH = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : env.AI_PATH || '/ai';
const buildAiUrl = (path)=>{
    const prefix = ("TURBOPACK compile-time truthy", 1) ? AI_PATH.startsWith('/') ? AI_PATH : `/${AI_PATH}` : "TURBOPACK unreachable";
    return `${AI_BASE_URL}${prefix}${path}`;
};
const getAiHeaders = ()=>{
    const token = env.VITE_AI_TOKEN || env.AI_TOKEN;
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};
const extractTextFromCandidates = (candidates)=>{
    if (!Array.isArray(candidates)) return '';
    for (const candidate of candidates){
        const parts = candidate?.content?.parts;
        if (Array.isArray(parts)) {
            const text = parts.map((p)=>p?.text || '').filter(Boolean).join('');
            if (text) return text;
        }
    }
    return '';
};
const buildPrompt = (contents)=>{
    if (!contents) return '';
    if (typeof contents === 'string') return contents;
    if (Array.isArray(contents)) {
        const parts = [];
        for (const item of contents){
            if (typeof item === 'string') {
                parts.push(item);
            } else if (item?.parts?.length) {
                const joined = item.parts.map((p)=>p?.text || '').filter(Boolean).join('');
                if (joined) parts.push(joined);
            } else if (item?.text) {
                parts.push(item.text);
            }
        }
        return parts.join('\n\n');
    }
    if (contents?.parts?.length) {
        return contents.parts.map((p)=>p?.text || '').filter(Boolean).join('');
    }
    if (contents?.text) return contents.text;
    try {
        return JSON.stringify(contents);
    } catch  {
        return '';
    }
};
const extractTextFromUIMessage = (message)=>{
    const content = message?.content;
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content.map((part)=>{
            if (typeof part === 'string') return part;
            if (typeof part?.text === 'string') return part.text;
            if (typeof part?.value === 'string') return part.value;
            if (typeof part?.data?.text === 'string') return part.data.text;
            return '';
        }).filter(Boolean).join('');
    }
    return '';
};
const parseSseTextContent = (raw)=>{
    if (typeof raw !== 'string') return null;
    if (!raw.includes('data:')) return null;
    const chunks = raw.split(/data:\s*/).slice(1);
    if (chunks.length === 0) return null;
    let text = '';
    let usageMetadata;
    let object;
    for (const chunk of chunks){
        const line = chunk.split(/\n/)[0].trim();
        if (!line || line === '[DONE]') continue;
        let evt;
        try {
            evt = JSON.parse(line);
        } catch  {
            continue;
        }
        const type = evt.type || evt.event || evt.kind;
        if (type === 'text-delta') {
            const delta = evt.textDelta ?? evt.delta ?? evt.text;
            if (typeof delta === 'string') text += delta;
        } else if (type === 'message') {
            const msgText = extractTextFromUIMessage(evt.message);
            if (msgText) text += msgText;
            usageMetadata = evt.message?.metadata?.totalUsage || evt.message?.metadata?.usage || usageMetadata;
        } else if (type === 'object') {
            object = evt.object ?? object;
        } else if (type === 'finish') {
            usageMetadata = evt.message?.metadata?.totalUsage || evt.message?.metadata?.usage || evt.usage || evt.totalUsage || usageMetadata;
            if (evt.object !== undefined) object = evt.object;
        } else if (typeof evt.text === 'string' && !type) {
            text += evt.text;
        }
    }
    const cleaned = text.trim() || raw.trim();
    return {
        text: cleaned,
        usageMetadata,
        object
    };
};
const consumeEventStream = async (body)=>{
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let text = '';
    let object;
    let usageMetadata;
    const processBuffer = ()=>{
        // Normalize CRLF to LF so we can reliably find blank-line delimiters
        if (buffer.includes('\r\n')) {
            buffer = buffer.replace(/\r\n/g, '\n');
        }
        let idx;
        while((idx = buffer.indexOf('\n\n')) !== -1){
            const raw = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 2);
            if (!raw) continue;
            // Support standard SSE blocks that include an optional `event:` line before `data:`
            let eventName = '';
            const dataLines = [];
            for (const line of raw.split('\n')){
                const trimmed = line.trim();
                if (!trimmed) continue;
                if (trimmed.startsWith(':')) continue; // comment line
                if (trimmed.startsWith('event:')) {
                    eventName = trimmed.slice('event:'.length).trim();
                } else if (trimmed.startsWith('data:')) {
                    dataLines.push(trimmed.slice('data:'.length).trim());
                }
            }
            const payload = dataLines.join('\n').trim();
            if (!payload) continue;
            let evt;
            try {
                evt = JSON.parse(payload);
            } catch  {
                continue;
            }
            const type = evt.type || evt.event || evt.kind || eventName;
            if (type === 'text-delta') {
                const delta = evt.textDelta ?? evt.delta ?? evt.text;
                if (typeof delta === 'string') text += delta;
            } else if (type === 'message') {
                const msgText = extractTextFromUIMessage(evt.message);
                if (msgText) text += msgText;
                usageMetadata = evt.message?.metadata?.totalUsage || evt.message?.metadata?.usage || usageMetadata;
            } else if (type === 'object') {
                object = evt.object ?? object;
            } else if (type === 'finish') {
                usageMetadata = evt.message?.metadata?.totalUsage || evt.message?.metadata?.usage || evt.usage || evt.totalUsage || usageMetadata;
                if (evt.object !== undefined) object = evt.object;
            } else if (typeof evt.text === 'string') {
                text += evt.text;
            }
        }
    };
    while(true){
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), {
            stream: !done
        });
        processBuffer();
        if (done) break;
    }
    processBuffer();
    return {
        text,
        object,
        usageMetadata
    };
};
const normalizeResponse = (raw)=>{
    // Some backends wrap the actual payload under `data`
    const envelope = raw?.data && typeof raw.data === 'object' ? raw.data : raw;
    const candidates = envelope?.candidates || raw?.candidates || envelope?.response?.candidates || raw?.response?.candidates;
    let usageMetadata = envelope?.totalUsage || envelope?.usageMetadata || envelope?.usage || raw?.totalUsage || raw?.usageMetadata || raw?.usage || envelope?.response?.totalUsage || envelope?.response?.usageMetadata;
    let object = envelope?.object;
    // Check if this is a schema-based response (backend returns 'object' field)
    if (envelope?.object !== undefined) {
        return {
            text: typeof envelope.text === 'string' ? envelope.text : JSON.stringify(envelope.object),
            object: envelope.object,
            usageMetadata,
            candidates
        };
    }
    // Original text-based response
    let text = envelope?.text || raw?.text || envelope?.response?.text || raw?.response?.text || extractTextFromCandidates(candidates) || (typeof envelope === 'string' ? envelope : '');
    const parsedStream = parseSseTextContent(text);
    if (parsedStream) {
        text = parsedStream.text;
        object = object ?? parsedStream.object;
        usageMetadata = usageMetadata ?? parsedStream.usageMetadata;
    }
    return {
        text,
        usageMetadata,
        candidates,
        object
    };
};
class GenAIClient {
    async request({ model, contents, config, timeoutMs, signal }, retryOpts = {}) {
        const { attempts, delayMs } = {
            ...DEFAULT_RETRY,
            ...retryOpts
        };
        const controller = new AbortController();
        const combinedSignal = signal ? new AbortSignalAny([
            signal,
            controller.signal
        ]).signal : controller.signal;
        const prompt = buildPrompt(contents);
        const payload = {
            model
        };
        if (prompt) payload.prompt = prompt;
        // Extract schema from config if present
        if (config) {
            const { responseSchema, responseMimeType, providerOptions, ...restConfig } = config;
            // Some backends expect `responseSchema`, others expect `schema`.
            // Send both to stay backward compatible and avoid missing-field errors.
            if (responseSchema) {
                payload.schema = responseSchema;
                payload.responseSchema = responseSchema;
            }
            if (responseMimeType) payload.responseMimeType = responseMimeType;
            // Pass providerOptions for features like Google Search Grounding
            if (providerOptions) payload.providerOptions = providerOptions;
            if (Object.keys(restConfig).length > 0) payload.config = restConfig;
        }
        if (contents && typeof contents !== 'string') {
            payload.contents = contents;
        }
        let lastError = null;
        for(let attempt = 0; attempt < attempts; attempt++){
            const timer = setTimeout(()=>{
                console.error('[GenAIClient] Request TIMEOUT after', timeoutMs || DEFAULT_TIMEOUT, 'ms');
                controller.abort('GenAI request timed out');
            }, timeoutMs || DEFAULT_TIMEOUT);
            try {
                // DEBUG: Log request payload for debugging
                console.log('[GenAIClient] Request payload:', JSON.stringify(payload, null, 2));
                console.log('[GenAIClient] Request URL:', buildAiUrl('/generate'));
                const headers = getAiHeaders();
                const doRequest = async (path)=>fetch(buildAiUrl(path), {
                        method: 'POST',
                        headers,
                        body: JSON.stringify(payload),
                        signal: combinedSignal
                    });
                let response = await doRequest('/generate');
                // Backward compatibility: try /stream if /generate is missing
                if (response.status === 404) {
                    response = await doRequest('/stream');
                }
                const contentType = response.headers.get('content-type') || '';
                const isJson = contentType.includes('application/json');
                const isEventStream = contentType.includes('text/event-stream');
                if (!response.ok) {
                    const errorData = isJson ? await response.json() : await response.text();
                    const detail = typeof errorData === 'string' ? errorData : errorData.error || JSON.stringify(errorData);
                    throw new Error(`Failed to generate content (HTTP ${response.status}): ${detail}`);
                }
                if (isEventStream) {
                    if (!response.body) throw new Error('Stream response missing body');
                    const streamed = await consumeEventStream(response.body);
                    clearTimeout(timer);
                    return streamed;
                }
                const data = isJson ? await response.json() : {
                    text: await response.text()
                };
                clearTimeout(timer);
                return normalizeResponse(data);
            } catch (err) {
                lastError = err;
                clearTimeout(timer);
                const message = err?.message || '';
                const retryable = message.includes('503') || message.includes('UNAVAILABLE') || message.toLowerCase().includes('overloaded');
                if (attempt < attempts - 1 && retryable) {
                    const wait = delayMs * (attempt + 1);
                    console.warn(`GenAI retry (${attempt + 1}/${attempts}) after ${wait}ms due to: ${message}`);
                    await new Promise((res)=>setTimeout(res, wait));
                    continue;
                }
                if (attempt < attempts - 1) {
                    await new Promise((res)=>setTimeout(res, delayMs));
                }
            }
        }
        throw lastError instanceof Error ? lastError : new Error(`GenAI request failed: ${String(lastError)}`);
    }
}
// Simple helper to merge multiple AbortSignals
class AbortSignalAny {
    controller;
    signal;
    constructor(signals){
        this.controller = new AbortController();
        this.signal = this.controller.signal;
        signals.forEach((sig)=>{
            if (sig) {
                if (sig.aborted) {
                    this.controller.abort(sig.reason);
                } else {
                    sig.addEventListener('abort', ()=>this.controller.abort(sig.reason));
                }
            }
        });
    }
}
const genAIClient = new GenAIClient();
}),
"[project]/src/services/engine/aiService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "aiService",
    ()=>aiService,
    "parseSchemaResponse",
    ()=>parseSchemaResponse,
    "trackCost",
    ()=>trackCost
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$genAIClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/genAIClient.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/constants.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAppStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/store/useAppStore.ts [app-ssr] (ecmascript)");
;
;
;
;
class AIService {
    getModel(key) {
        const settings = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$store$2f$useAppStore$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAppStore"].getState();
        if (key === 'FLASH') return settings.modelFlash;
        if (key === 'IMAGE_PREVIEW') return settings.modelImage;
        return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MODEL"][key];
    }
    /**
     * Run a text generation request
     */ async runText(prompt, modelKey = 'FLASH', config) {
        const start = Date.now();
        const model = this.getModel(modelKey);
        try {
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$genAIClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["genAIClient"].request({
                model,
                contents: prompt,
                config
            });
            const { usage, cost } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateCost"])(response.usageMetadata, modelKey);
            return {
                text: response.text,
                usage,
                cost,
                duration: Date.now() - start
            };
        } catch (error) {
            console.error(`[AIService] runText failed for ${modelKey}`, error);
            throw error;
        }
    }
    /**
     * Run a JSON generation request
     */ async runJson(prompt, modelKey = 'FLASH', schema) {
        const start = Date.now();
        const model = this.getModel(modelKey);
        const config = {
            responseMimeType: 'application/json',
            responseSchema: schema
        };
        try {
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$genAIClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["genAIClient"].request({
                model,
                contents: prompt,
                config
            });
            const { usage, cost } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateCost"])(response.usageMetadata, modelKey);
            let data;
            if (response.object) {
                data = response.object;
            } else {
                try {
                    // Clean markdown code blocks if present
                    const cleanText = response.text.replace(/```(?:json)?\n?|\n?```/gi, '').trim();
                    data = JSON.parse(cleanText);
                } catch (e) {
                    throw new Error(`Failed to parse JSON response: ${response.text.substring(0, 100)}...`);
                }
            }
            return {
                data,
                usage,
                cost,
                duration: Date.now() - start
            };
        } catch (error) {
            console.error(`[AIService] runJson failed for ${modelKey}`, error);
            throw error;
        }
    }
    /**
     * Run a JSON generation request with Google Search Grounding enabled
     * Use this for queries that need real-time web information (e.g., finding local brand alternatives)
     */ async runJsonWithSearch(prompt, modelKey = 'FLASH', schema) {
        const start = Date.now();
        const model = this.getModel(modelKey);
        const config = {
            responseMimeType: 'application/json',
            responseSchema: schema,
            providerOptions: {
                vertex: {
                    useSearchGrounding: true
                }
            }
        };
        try {
            const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$genAIClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["genAIClient"].request({
                model,
                contents: prompt,
                config
            });
            const { usage, cost } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateCost"])(response.usageMetadata, modelKey);
            let data;
            if (response.object) {
                data = response.object;
            } else {
                try {
                    // Clean markdown code blocks if present
                    const cleanText = response.text.replace(/```(?:json)?\n?|\n?```/gi, '').trim();
                    data = JSON.parse(cleanText);
                } catch (e) {
                    throw new Error(`Failed to parse JSON response: ${response.text.substring(0, 100)}...`);
                }
            }
            return {
                data,
                usage,
                cost,
                duration: Date.now() - start
            };
        } catch (error) {
            console.error(`[AIService] runJsonWithSearch failed for ${modelKey}`, error);
            throw error;
        }
    }
}
const aiService = new AIService();
const parseSchemaResponse = (response, fallback)=>{
    if (!response.data && fallback) {
        return {
            ...response,
            data: fallback
        };
    }
    return response;
};
const trackCost = (metricsStore, ...responses)=>{
    let totalCost = 0;
    let totalTokens = 0;
    responses.forEach((r)=>{
        if (r && r.cost && r.usage) {
            totalCost += r.cost.totalCost || 0;
            totalTokens += r.usage.totalTokens ?? 0;
        }
    });
    if (!isNaN(totalCost) && !isNaN(totalTokens)) {
        metricsStore.addCost(totalCost, totalTokens);
    }
    return {
        totalCost,
        totalTokens
    };
};
}),
"[project]/src/services/engine/schemaTypes.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Minimal JSON schema type helper used by our generationConfig.
// Keeps client-side code independent from the @google/genai package.
__turbopack_context__.s([
    "Type",
    ()=>Type
]);
const Type = {
    OBJECT: 'object',
    ARRAY: 'array',
    STRING: 'string',
    INTEGER: 'integer',
    NUMBER: 'number',
    BOOLEAN: 'boolean'
};
}),
"[project]/src/services/engine/promptTemplates.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "promptTemplates",
    ()=>promptTemplates
]);
const promptTemplates = {
    sectionContent: ({ sectionTitle, languageInstruction, previousSections, futureSections, generalPlan, specificPlan, kbInsights, keywordPlans, relevantAuthTerms, points, injectionPlan, articleTitle, coreQuestion, difficulty, writingMode, solutionAngles, avoidContent, renderMode, suppressHints, augmentHints, subheadings, regionReplacements, humanWritingVoice, regionVoiceDetect, replacementRules })=>{
        const resolvedDifficulty = difficulty || 'easy';
        const mode = writingMode || (resolvedDifficulty === 'easy' ? 'direct' : 'multi_solutions');
        return `You are an expert editor writing the section:
    <SectionTitle>
      ${sectionTitle}
    </SectionTitle>
    DEFINITION: The title of the specific section you need to write.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: The target language and audience for the article.
    
    ## Context Structure
    <ArticleTopic>
    ${articleTitle}
    </ArticleTopic>
    DEFINITION: The main topic of the entire article.

    <PreviousSections>
    ${previousSections.slice(-2).map((s)=>s.substring(0, 100) + "...").join(" | ")}
    </PreviousSections>
    DEFINITION: Summaries of the immediately preceding sections.

    <UpcomingSections>
    ${futureSections.join(", ")}
    </UpcomingSections>
    DEFINITION: Titles of sections to be written later.


    ## Strategy & Style
    <OverallVoice>
    ${generalPlan?.join("; ") || "Professional, authoritative"}
    </OverallVoice>
    DEFINITION: The desired tone and persona for the article.

    <SectionStrategy>
    ${specificPlan?.join("; ") || "Explain thoroughly"}
    </SectionStrategy>
    DEFINITION: Specific goals or angles for this section.

    <BrandKnowledge>
    ${kbInsights.length > 0 ? kbInsights.join("; ") : "None"}
    </BrandKnowledge>
    DEFINITION: Background facts or guidelines about the brand.

    ${humanWritingVoice ? `
    <HumanWritingVoice>
    ${humanWritingVoice}
    </HumanWritingVoice>
    DEFINITION: Instructions on how to sound human and not like an AI.
    ` : ''}

    ${regionVoiceDetect ? `
    <RegionVoiceProfile>
    ${regionVoiceDetect}
    </RegionVoiceProfile>
    DEFINITION: The detected regional voice composition (e.g., 70% HK / 30% TW).
    INSTRUCTION: Adhere to the dominant regional tone.
    ` : ''}


    ## Localization & Safety
    ${replacementRules && replacementRules.length > 0 || regionReplacements && regionReplacements.length > 0 ? `
    <LocalizationAndSafety>
    ${replacementRules && replacementRules.length > 0 ? `
    **Blocked Terms (DO NOT USE):**
    ${replacementRules.map((r)=>`- ❌ ${r}`).join('\n')}
    ` : ''}
    ${regionReplacements && regionReplacements.length > 0 ? `
    **Regional Replacements (MANDATORY):**
    ${regionReplacements.map((r)=>r.replacement ? `- "${r.original}" → "${r.replacement}"` : `- "${r.original}" → [REMOVE from text]`).join('\n')}
    ` : ''}
    </LocalizationAndSafety>
    DEFINITION: Terms to avoid and mandatory vocabulary corrections for the target region.
    INSTRUCTION:
    1. NEVER use any Blocked Terms.
    2. ALWAYS replace "original" terms with their "replacement".
    3. If replacement is [REMOVE], rewrite the sentence to exclude that term entirely.
    ` : '(No localization constraints)'}


    ## Task Definition
    <CoreQuestion>
    ${coreQuestion || "Infer the precise question and answer it"}
    </CoreQuestion>
    DEFINITION: The comprehensive question this section must answer.

    <Difficulty>
    ${resolvedDifficulty}
    </Difficulty>
    DEFINITION: The complexity level of the topic (easy, medium, unclear).

    <WritingMode>
    ${mode === 'direct' ? "direct answer first" : "multi solutions then synthesize"}
    </WritingMode>
    DEFINITION: The structural approach (Direct vs Multi-angle).
    
    ${mode === 'multi_solutions' ? `- Provide 2-3 distinct, non-overlapping solution paths before the final synthesized answer.` : `- Lead with a concise, direct answer to the core question.`}


    ## Conciseness Constraints
    - ** General Rule **: Cut all fluff. Be crisp and direct. Stop immediately after answering the core question.
    ${/introduction|conclusion|intro|outcome|result|summary|引言|結尾|結論/i.test(sectionTitle) ? '- ** SPECIAL CONSTRAINT **: Target 40~80 words. Write as a SINGLE block of text (one paragraph). Do NOT split into multiple paragraphs.' : ''} 
    - ** If difficulty = "easy" **: Target < 160 words. Get straight to the point. No preamble.
    - ** If difficulty = "medium" **: Target < 180 words. Explain efficiently using Lists.
    - ** If difficulty = "unclear" **: Focus on clarifying the ambiguity briefly with Lists.


    ## Output Restrictions
    ${renderMode === 'checklist' ? '- OUTPUT FORMAT: Use checklist/bulleted list. Include every provided Key Fact; do not drop items.' : '- OUTPUT FORMAT: Narrative with Markdown as needed.'}


    ## Structure Enforcement
    ${subheadings && subheadings.length > 0 ? `
    <MandatorySubheadings>
    ${subheadings.map((h, i)=>`${i + 1}. ${h}`).join('\n')}
    </MandatorySubheadings>
    DEFINITION: The exact H3 subheadings you must use.
    ` : '(No predefined subheadings)'}


    ## Solution Angles
    ${mode === 'multi_solutions' ? solutionAngles && solutionAngles.length > 0 ? `
        <DefinedAngles>
        ${solutionAngles.join("; ")}
        </DefinedAngles>
        DEFINITION: The specific angles/perspectives to cover.
        ` : "None provided; create 2 distinct angles." : "Not needed for direct mode."}


    ## Resources & Keywords
    <SemanticKeywords>
    ${keywordPlans.map((k)=>`
    - "${k.word}": ${k.plan?.join('; ') || 'Use naturally.'}`).join('')}
    </SemanticKeywords>
    DEFINITION: SEO keywords with semantic usage rules.
    INSTRUCTION: Use these words according to their "Semantic Context" rules to maintain the original depth.

    <AuthorityTerms>
    ${relevantAuthTerms.slice(0, 5).join(", ")}
    </AuthorityTerms>
    DEFINITION: Technical or authoritative terms.


    ## Key Facts & Narrative Points
    - ** CRITICAL WRITING RULE **: When writing the main sentence for any Key Fact below, ** minimize the use of commas and symbols **. Use clean, direct sentence structures. 
    <KeyPoints>
    ${points.length > 0 ? points.join("; ") : "(No new key points needed for this section, focus on narrative)"}
    </KeyPoints>
    DEFINITION: The core facts and information for this section.


    ## Injection Plan
    ${injectionPlan}


    ## Exclusion Rules
    ${suppressHints && suppressHints.length > 0 ? `
    <StrictExclusion>
    ${suppressHints.map((c)=>`- ${c}`).join('\n')}
    </StrictExclusion>
    DEFINITION: Topics that are strictly forbidden here.
    ` : '(None)'}

    ${avoidContent && avoidContent.length > 0 ? `
    <NegativeConstraints>
    ${avoidContent.map((c)=>`- ${c}`).join('\n')}
    </NegativeConstraints>
    DEFINITION: Content to avoid to prevent repetition/redundancy.
    ` : ''}


    ## Output Schema
    - Return ONLY the content for this section in JSON format.
    - Use proper Markdown for the content string(H3 for subsections, Lists where appropriate).
    - Do NOT repeat the H2 Title "${sectionTitle}".
    - Ensure smooth transitions from the previous section.
    - If writing mode is "multi_solutions", list the solution paths clearly, then close with a synthesized recommendation.
    - ** IMPORTANT **: You must populate the "usedPoints" array with the exact strings of any Key Facts you included in the content.
    - ** IMPORTANT **: You must populate "injectedCount" with the number of times you explicitly mentioned the Product Name or Brand Name.
`;
    },
    frequentWordsPlacementAnalysis: ({ languageInstruction, analysisPayloadString })=>`
    I have a list of High - Frequency Keywords and their "Context Snippets" from a Reference Text.

      TASK:
    For each keyword, analyze its context snippets to understand the specific ** Sentence Structure ** and ** Syntactic placement **.
    Generate a "Usage Action Plan" (Max 3 actionable points).
    Extract a ** SINGLE, SHORT ** "Example Sentence" (Max 40 chars/15 words).

      <LanguageInstruction>
      ${languageInstruction}
      </LanguageInstruction>

    The Action Plan must be specific about the ** Sentence Context **:
    1. ** Placement **: Where does it appear? (Start/Middle/End/Transition)
    2. ** Collocations **: What words appear around it?
    3. ** Tone **: What function does it serve? (e.g., Is it a prefix/suffix?)

    STRICT RULES:
    - You MUST provide a "plan" with exactly 3 points and one "exampleSentence" for EVERY keyword.
    - If a keyword's context is unclear, use your knowledge of the language/style to provide a generic but accurate action plan.
    - NEVER return an empty array or null for "plan" or "exampleSentence".

          INPUT DATA:
    <AnalysisPayload>
    ${analysisPayloadString}
    </AnalysisPayload>
    DEFINITION: JSON list of keywords and snippets.
    ACTION: Analyze these specific snippets.

    OUTPUT JSON(array):
    [
      {
        "word": "keyword",
        "plan": ["actionable guidance 1", "actionable guidance 2", "actionable guidance 3"],
        "exampleSentence": "ONE short sentence (< 15 words) from the text. NO explanations.",
        "isSentenceStart": true/false,
        "isSentenceEnd": true/false,
        "isPrefix": true/false,
        "isSuffix": true/false
      }
    ]
    Return JSON only.
    `,
    productBrief: ({ productName, productUrl, languageInstruction })=>`
    I need to create a "Product Brief" for a marketing article.
    
    <ProductName>
    "${productName}"
    </ProductName>
    DEFINITION: The raw name of the product.
    ACTION: Use this to infer branding.

    <ProductURL>
    "${productUrl}"
    </ProductURL>
    DEFINITION: The link to the product.
    ACTION: Use this to infer more context if obvious, and for the CTA.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: User's preferred language.
    ACTION: Write the output in this language.

    TASK:
    1. Infer the Brand Name and USP from the Product Name / URL.
    2. Write a short "Product Description"(2 sentences).
    3. Identify the "Primary Pain Point" this product solves.
    4. Create a "Call to Action (CTA)" link text.
    
    OUTPUT FORMAT(JSON):
    {
      "brandName": "Brand Name",
        "productName": "Full Product Name",
          "productDescription": "...",
            "usp": "...",
              "primaryPainPoint": "...",
                "ctaLink": "${productUrl}"
    }
    `,
    productMapping: ({ productBrief, articleTopic, languageInstruction })=>`
    I have a Product and an Article Topic.

    <ProductDetails>
    PRODUCT: ${productBrief.productName} (${productBrief.usp})
    </ProductDetails>
    DEFINITION: The product being marketed.
    ACTION: Find features of this product that match the topic.
    
    <ArticleTopic>
    TOPIC: ${articleTopic}
    </ArticleTopic>
    DEFINITION: The subject of the article.
    ACTION: Identify pain points within this topic.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Target Language.
    ACTION: Output in this language.

    TASK:
    Identify 3 - 5 "Problem-Solution Mappings".
    For each mapping:
    1. ** Pain Point **: A specific problem the reader has related to the Topic.
    2. ** Product Feature **: The specific feature of the product that solves it.
    3. ** Relevance Keywords **: List of keywords(from the topic) where this mapping is most relevant.
    
    OUTPUT JSON:
    [
      { "painPoint": "...", "productFeature": "...", "relevanceKeywords": ["...", "..."] }
    ]
      `,
    brandSummary: ({ urls, languageInstruction })=>`
    You are a web crawler and marketing copywriter.
    Crawl and summarize the following URLs to extract the brand's own service/product details, contact info, and unique selling points.
    
    <TargetURLs>
    ${urls.join('\n')}
    </TargetURLs>
    DEFINITION: The list of pages to digest.
    ACTION: Synthesize information from these pages only.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Target Language.
    ACTION: Write the summary in this language.

    OUTPUT: A concise paragraph(200 - 300 words) summarizing the brand / service with contact info if present.
    `,
    visualStyle: ({ languageInstruction, analyzedSamples, websiteType })=>`
    I need to define a consistent "Visual Identity"(Master Style Prompt) for an article.
    
    <WebsiteContext>
    ${websiteType}
    </WebsiteContext>
    DEFINITION: The type of business this is.
    ACTION: Ensure style matches this industry.
    
    <SourceImageDescriptions>
    ${analyzedSamples && analyzedSamples.length > 0 ? analyzedSamples : "No source images available. Infer style strictly from Website Context."}
    </SourceImageDescriptions>
    DEFINITION: Descriptions of actual images on the site.
    ACTION: Mimic this existing style.

    TASK:
    Synthesize a ** single, cohesive Visual Style Description** that I can append to every image prompt to ensure consistency.

      Include:
    1. ** Color Palette:** (e.g., "Medical Blue #0055FF and Clean White", or "Warm Earth Tones")
    2. ** Lighting / Mood:** (e.g., "Soft bright studio lighting", "Moody natural light", "Flat vector lighting")
    3. ** Art Medium:** (e.g., "High-resolution Photography", "Minimalist 2D Vector Art", "3D Product Render")
    
    OUTPUT FORMAT:
    Return ONLY the style description string(max 30 words).
  Example: "Photorealistic style with soft daylight, using a clinical white and teal palette, high-end commercial aesthetic."
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Output Language.
    ACTION: Write the style description in English (for AI generation) but if instruction says otherwise, follow it.
`,
    snippet: ({ prompt, languageInstruction })=>`
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: The language to use.
    ACTION: Follow this instruction.

    <InputPrompt>
    ${prompt}
    </InputPrompt>
    DEFINITION: The logic or text to process.
    ACTION: Execute this prompt.
`,
    sectionHeading: ({ sectionTitle, articleTitle, languageInstruction, keyPoints, keywordPlans, narrativeNotes })=>`
    You are creating a concise H3 heading for an article section.

    <ArticleTitle>
    "${articleTitle}"
    </ArticleTitle>
    DEFINITION: The context of the article.
    ACTION: Ensure heading aligns with article.

    <SectionTitleContext>
    "${sectionTitle}"
    </SectionTitleContext>
    DEFINITION: The H2 parent of this subheading.
    ACTION: Ensure H3 is relevant to this H2.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Output Language.
    ACTION: Write heading in this language.

    HINTS:
    <KeyPoints>
    ${keyPoints.join('; ')}
    </KeyPoints>
    DEFINITION: Points that must be covered.
    ACTION: Condense these into a short heading title.

    <ImportantKeywords>
    ${keywordPlans.map((k)=>k.word).join(', ')}
    </ImportantKeywords>
    DEFINITION: Keywords to include.
    ACTION: Use these if they fit naturally.

    <NarrativeNotes>
    ${narrativeNotes?.join('; ') || 'None'}
    </NarrativeNotes>
    DEFINITION: Tone or angle note.
    ACTION: Reflect this tone.

    RULES:
    - Return ONLY the heading text(no quotes, no numbering).
        - Keep it under 10 words.
    `,
    batchRefineHeadings: ({ articleTitle, headings, languageInstruction })=>`
    You are cleaning and unifying article section headings.

    <ArticleTitle>
    "${articleTitle}"
    </ArticleTitle>
    DEFINITION: The context of the article.
    ACTION: Ensure headings fit this topic.

    <OriginalHeadings>
    ${headings.map((h, i)=>`${i + 1}. ${h}`).join('\n')}
    </OriginalHeadings>
    DEFINITION: The current raw headings.
    ACTION: Refine these specific headings.

    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Target Language.
    ACTION: Write optimized headings in this language.

    STEP BY STEP:
    1) Clarify role: H2 = main section headline; H3 = supporting subpoint under its H2.
    2) Keep it natural, concise, and engaging.Preserve the original intent / angle.Use everyday, conversational wording(生活化) instead of stiff or academic phrasing.
    3) Make the H2 clickable: concise(≤ 60 chars).
    4) Rewrite H2 with ** 5 options in this exact order ** (all must differ from h2_before):
    - Option 1(經典版): Professional writer version - clear, informative.
    - Option 2(編輯精選): Editor's pick - concise with strategic keywords.
    - Option 3(吸睛版): Power words + emotional hooks(必學、秒懂、爆款、神級).
    - Option 4(痛點版): Pain - point / FOMO angle - address fears or desires.
    - Option 5(生活化): Lifestyle / conversational - like friend's advice, slang allowed.
    - H2_after = your single best pick among those 5 options.
    5) ** CRITICAL **: h2_after text MUST demonstrate what h2_reason describes.Example:
    - If reason says "使用生活化情境「下班回家」", then h2_after MUST contain "下班回家".
    - If reason says "加入流行語「UP UP」", then h2_after MUST contain "UP UP".
    - Each option's text MUST match what its reason describes.
    6) Rewrite / support H3(if any exist or if you invent them):
    - Keep H3 ultra - compact: product / feature name or a 2 - 6 word keyword fragment.
    - Align with the chosen H2_after without repeating it.
    7) Validate: no duplicates, no vague fillers.Reject identical before / after.

      OUTPUT(JSON only):
    {
      "headings": [
        {
          "h2_before": "...",
          "h2_after": "...",
          "h2_reason": "why this angle/keywords",
          "h2_options": [
            { "text": "option 1", "reason": "reasoning" },
            { "text": "option 2", "reason": "reasoning" },
            { "text": "option 3", "reason": "reasoning" }
          ],
          "h3": [
            { "h3_before": "...", "h3_after": "...", "h3_reason": "supporting angle & search phrasing" }
          ]
        }
      ]
    }
    - Array length MUST equal the number of ORIGINAL HEADINGS and keep the same order.
        - Always include every field; set "h3": [] when none.
        - "h2_before" must exactly match the provided heading text.
        - If no H3s were provided, return "h3": [].
        - If a heading is already good, repeat it in "h2_after".
    `,
    metaSeo: ({ targetAudience, contextLines, articlePreview })=>`
    You are an SEO expert.Generate meta Title, Description, and URL slug for the article.

    <TargetAudience>
    ${targetAudience}
    </TargetAudience>
    DEFINITION: Region/Language target.
    ACTION: Optimize for this audience's search habits.

    <Context>
    ${contextLines.join('\n')}
    </Context>
    DEFINITION: Article content highlights.
    ACTION: Base the meta tags on this content.

    <ArticlePreview>
    ${articlePreview}
    </ArticlePreview>
    DEFINITION: Snippet of the actual article.
    ACTION: Ensure accuracy to the written text.

    Output JSON:
    { "title": "...", "description": "...", "slug": "..." }
`,
    rebrandContent: ({ productBrief, languageInstruction, currentContent })=>`
    ## Task
    REBRAND this article content.

    DEFINITION: The primary goal of this prompt.
    ACTION: Modify the provided content to reflect the new brand identity.
    
    <BrandIdentity>
    - Name: "${productBrief.brandName}"
    - Product: "${productBrief.productName}"
    - USP: "${productBrief.usp}"
    </BrandIdentity>
    DEFINITION: The new brand identity to inject.
    ACTION: Replace generic terms with these brand assets.

    ## Instructions
    1. Scan the text for generic terms like "the device", "the treatment", "many clinics", or any Competitor Names.
    2. REWRITE those sentences to specifically feature ** ${productBrief.brandName}** or ** ${productBrief.productName}**.
    3. Ensure the grammar flows naturally(Subject - Verb agreement).
    4. Do NOT just find - replace.Rewrite the sentence to sound authoritative.
    5. Maintain the original structure and formatting(Markdown).

    DEFINITION: Detailed steps for rebranding.
    ACTION: Follow these steps precisely.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Target Language.
    ACTION: Maintain this language.

    <ContentToRebrand>
    ${currentContent}
    </ContentToRebrand>
    DEFINITION: The text needing update.
    ACTION: Rewrite this text.
`,
    smartFindBlock: ({ pointToInject, blocks })=>`
    I need to insert this Key Point: 
    <PointToInject>
    "${pointToInject}"
    </PointToInject>
    DEFINITION: The fact that must be added.
    ACTION: Find the best place for this fact.
    
    Here is a "Compact Index" of the article paragraphs:
    <ArticleBlocks>
    ${blocks.map((b)=>`[ID: ${b.id}] ${b.text}`).join('\n')}
    </ArticleBlocks>
    DEFINITION: List of paragraph candidates.
    ACTION: Select one ID from this list.

TASK: Identify the SINGLE Best Block ID to insert / merge this point into. 
    Return ONLY the ID(e.g. "5").
    `,
    smartRewriteBlock: ({ pointToInject, targetHtml, languageInstruction })=>`
TASK: Rewrite the following HTML Block to naturally include this Key Point.
    
    <KeyPoint>
    "${pointToInject}"
    </KeyPoint>
    DEFINITION: Information to weave in.
    ACTION: Merge this into the text naturally.
    
    <TargetHTMLBlock>
    ${targetHtml}
    </TargetHTMLBlock>
    DEFINITION: The existing paragraph.
    ACTION: Rewrite this paragraph to include the point.

    RULES:
    1. Keep the original meaning and HTML tag structure(<p>or<li>).
    2. Weave the point in naturally.Do not just append it at the end unless it fits.
    3. <LanguageInstruction>${languageInstruction}</LanguageInstruction>
    4. Return ONLY the new HTML string.
    `,
    productContextFromText: ({ rawText })=>`
    ## Task
    Extract product / service information from the following text.

    DEFINITION: The main objective.
    ACTION: Analyze the provided text to identify product-related data.

    <RawText>
    "${rawText}"
    </RawText>
    DEFINITION: Source text.
    ACTION: Analyze this text for product data.

    ## Instructions
    - Identify Brand Name, Product Name, Unique Selling Point(USP), Target Audience, and Key Features.
    - Focus on concise extraction, not rewriting.

    DEFINITION: Guidelines for extraction.
    ACTION: Follow these guidelines for the output.
    
    OUTPUT JSON:
{
  "brandName": "...",
    "productName": "...",
      "usp": "...",
        "targetAudience": "...",
          "features": ["...", "..."]
}
`,
    authorityAnalysis: ({ languageInstruction, authorityTerms, websiteType, title })=>`
    ## Task
    Analyze the Authority Terms for this article and surface only the most credible, relevant ones.

    DEFINITION: The main goal of this analysis.
    ACTION: Filter and propose strategic combinations of terms.
    
    <WebsiteType>
    ${websiteType}
    </WebsiteType>
    DEFINITION: The industry/niche.
    ACTION: Judge credibility based on this context.

    <ArticleTitle>
    ${title}
    </ArticleTitle>
    DEFINITION: Topic context.
    ACTION: Ensure terms are relevant to this topic.

    <CandidateTerms>
    ${authorityTerms}
    </CandidateTerms>
    DEFINITION: List of potential terms.
    ACTION: Filter this list.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: The language for the output.
    ACTION: Provide the output in this language.

    ## Goals
    - Keep only terms that strengthen trust / credibility for this topic and site type.
    - Drop vague, unrelated, or unverifiable claims.
    - Propose strategic combinations of 2 - 3 terms to reinforce authority.

    DEFINITION: Specific objectives for the analysis.
    ACTION: Ensure the output meets these goals.
    
    OUTPUT JSON:
    {
          "relevantTerms": ["best-fit term 1", "best-fit term 2"],
        "combinations": ["term A + term B in intro", "term C in meta description"]
    }
    Return JSON only.`,
    narrativeStructure: ({ content, targetAudience, languageInstruction })=>`
    Analyze the reference text to extract the Narrative Structure.
    
    1) The H1 title and introductory paragraph (first paragraph after H1).
    2) A Logical Outline (H2 -> H3) with narrative goals.
    3) Key information points (Facts) for each section.
    4) Key information points (General) to preserve.
    5) **Sentence Feature Analysis**:
       - Analyze how sentences BEGIN in each section (common starters, transition words).
       - Analyze how sentences END in each section (punctuation patterns, concluding intent, common closing phrases).

    <TargetAudience>
    ${targetAudience}
    </TargetAudience>
    DEFINITION: The target region.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Output language.

    STRICT HEADING RULES:
    - Enumerate EVERY H2 and its child H3s in order from the reference.
    - Use the exact heading text as it appears (do NOT rewrite, paraphrase, translate, or renumber).
    - Keep awkward wording or punctuation intact; only trim whitespace.
    - If no clear headings exist, infer concise H2s, otherwise never replace existing ones.
    
    SECTION RELEVANCE FILTER:
    - If a section title is IRRELEVANT to the main article topic (e.g., "目錄", "導覽", "清單", "延伸閱讀", "相關文章", unrelated sidebar), mark it with difficulty: "unclear" AND set "exclude": true.
    - Specifically for "目錄" (Table of Contents), ALWAYS set "exclude": true.
    - Excluded sections will be REMOVED from the generated outline.
    - Only include sections that contribute to the main content.

    MANDATORY KEY FACTS:
    - For EVERY section you include, you MUST extract at least 3-5 "keyFacts" from the reference text.
    - A "keyFact" is a specific, verifiable piece of information (numbers, technical specs, specific benefits).
    - If you return a section with empty "keyFacts", your response will be rejected.
    
    ⚠️ NEGATIVE SIGNAL DETECTION(CRITICAL):
    When analyzing each section, carefully identify NEGATIVE SIGNALS - content that should NOT be included in that section. These include:
    - Phrases like "不應在此處", "應於...提及" (content that belongs elsewhere)
    - Off-topic sidebars
    
        IMPORTANT: Any negative instruction or off-topic content MUST go into the "suppress" array.
    
    <ContentToAnalyze>
    ${content}
    </ContentToAnalyze>
    DEFINITION: The reference text.

    STRICT OUTPUT RULES:
    1. For every active section (exclude: false), you MUST provide a detailed "narrativePlan" (3+ points) and "keyFacts" (2+ facts).
    2. NEVER leave "narrativePlan", "coreQuestion", or "keyFacts" as empty arrays/strings for relevant sections.
    3. If the reference content is sparse, use your expert knowledge to infer a logical plan and relevant facts that fit the topic.
    
    OUTPUT JSON:
    {
      "h1Title": "Exact H1 title text",
      "introText": "The first paragraph/intro text after H1 (if available)",
      "structure": [
        {
          "title": "Exact H2 text (no rewrite)",
          "subheadings": ["Exact H3 text 1", "Exact H3 text 2"],
          "narrativePlan": ["Positive guidance 1", "Positive guidance 2"],
          "coreQuestion": "Main question/problem",
          "difficulty": "easy | medium | unclear",
          "exclude": false,
          "excludeReason": "Only set if exclude=true",
          "writingMode": "direct | multi_solutions",
          "solutionAngles": ["angle 1", "angle 2"],
          "keyFacts": ["Fact 1", "Fact 2"],
          "uspNotes": ["USP relevant to this section"],
          "isChecklist": false,
          "suppress": ["Negative constraint 1"],
          "augment": ["Content to add"],
          "sentenceStartFeatures": ["Observed patterns for sentence beginnings"],
          "sentenceEndFeatures": ["Observed patterns for sentence endings (e.g., concludes with a question, uses specific punctuation, ends with a call to action)"]
        }
      ],
      "keyInformationPoints": ["General key fact 1", "General key fact 2"]
    }
    `,
    voiceStrategy: ({ content, targetAudience, languageInstruction })=>`
    Analyze the reference text to extract the Voice and Brand Strategy.

    1) Voice & Tone (General Plan).
    2) Conversion Strategy (Offers, CTAs, Risk Reversals).
    3) Brand Exclusive Points (USP).
    4) Competitor Names/Products to suppress. (CRITICAL: Do NOT list the region name "${targetAudience}" itself as a competitor).
    5) **Regional Entities Detection**: CRITICAL - Identify ALL brands, stores, services, or entities that are SPECIFIC to a different region and NOT available in the target region "${targetAudience}".
       - For zh-HK target: Detect Taiwan-specific brands (如：寶雅、全聯、momo購物、蝦皮台灣), Taiwan fashion brands, Taiwan chain stores.
       - For zh-TW target: Detect Hong Kong-specific brands (如：HKTVmall、百佳、惠康、sasa), HK chain stores.
       - These should be added to competitorBrands or competitorProducts even if they are not direct competitors.
    6) Regional Validity (Brand Availability).
    7) Human Writing Characteristics.

    <TargetAudience>
    ${targetAudience}
    </TargetAudience>
    DEFINITION: The target region. ALL entities not available in this region should be flagged as competitorBrands/Products.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Output language.

    <ContentToAnalyze>
    ${content}
    </ContentToAnalyze>
    DEFINITION: The reference text to analyze.

    ## Voice Strategy Analysis
    - ** regionVoiceDetect **: Analyze the "Regional Voice Composition" of the text (e.g., usage of regional slang like "地道/貼地" for HK vs "接地氣" for TW).
      - Calculate an approximate PERCENTAGE breakdown.
      - Return a string like: "70% HK / 30% TW" or "100% TW".
      - If uncertain or neutral, return "Neutral / Unclear".
    - ** humanWritingVoice **: Analyze the first 300 words (or the full Intro Paragraph). Explain "Why does this sound HUMAN?" by following these 5 steps:
      1. **Emotions & Subjectivity**: Identify subjective judgments/cultural evaluations (unlike AI's objective tone).
      2. **Tone & Particles**: Look for sentence-final particles (語助詞 like 喔, 唷) that create intimacy.
      3. **Persona & Self-Ref**: Does the writer refer to themselves (e.g. "Dr. X") or assume a character?
      4. **Cultural Metaphors**: Does it link facts to cultural concepts (e.g. physiognomy/fortune telling 面相) rather than just medical facts?
      5. **Social Intent**: Is there a call for interaction (save/share) vs just providing info?
      *Summarize these findings into a concise guide.*
    - ** competitorBrands **: List ALL brands that should be avoided, including:
      - Direct competitors mentioned in the text
      - **Region-specific brands/stores NOT available in ${targetAudience}** (e.g., Taiwan brands 韌 REN, Fashion for Yes, 寶雅 when targeting Hong Kong)
    - ** competitorProducts **: List ALL products that should be avoided or replaced.

    Return JSON only, no extra text or markdown fences.`,
    keywordAnalysis: ({ content, targetAudience, languageInstruction })=>`
    Analyze the reference content to extract high - frequency keywords and their semantic roles.
    
    <TargetAudience>
    ${targetAudience}
    </TargetAudience>
    DEFINITION: The target region.
    ACTION: Factor this into keyword selection.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Output language.
    ACTION: Use this language for keys/roles.

    <Content>
    ${content}
    </Content>
    DEFINITION: Source text.
    ACTION: Extract keywords from here.
    
    OUTPUT JSON:
    [
      { "word": "keyword", "contextSnippet": "snippet from text", "frequency": 3 }
    ]
  `,
    imagePromptFromContext: ({ contextText, languageInstruction, visualStyle, guide })=>`
    Generate a detailed image generation prompt based on the following context.

  <LanguageInstruction>
  ${languageInstruction}
  </LanguageInstruction>
  DEFINITION: Output Language.
  ACTION: Write the prompt in English unless specified.
    
    <ContextText>
    ${contextText}
    </ContextText>
    DEFINITION: The scene usage context.
    ACTION: Describe this scene.
    
    <VisualStyleGuide>
    ${visualStyle}
    </VisualStyleGuide>
    DEFINITION: The artistic style.
    ACTION: Apply these visual rules strictly.
    
    <SpecificGuide>
    ${guide}
    </SpecificGuide>
    DEFINITION: User specific hints.
    ACTION: Incorporate these hints.

TASK:
    Create a detailed, specific image generation prompt that:
    1. Captures the essence of the context text
    2. Adheres to the visual style guide
    3. Is optimized for AI image generation
    4. Avoids abstract concepts and focuses on concrete, photographable subjects
    
    Return ONLY the image prompt(no explanations or metadata).
    `,
    regionalBrandAnalysis: ({ content, targetAudience })=>`
    TASK: Analyze the content for ** Regional Terminology ** and ** Brand Availability ** conflicts in: ${targetAudience}.

    <TargetAudience>
    ${targetAudience}
    </TargetAudience>

    Using Google Search (Grounding), verify:
    1. ** Brand Availability **: Are mentioned brands/products actually available/popular in ${targetAudience}? (e.g. A Taiwan-only clinic appearing in a Hong Kong article is a mismatch).
    2. ** Regional Vocabulary **: Replace obvious dialect terms (e.g. "視頻" -> "影片" for TW).

    <ContentSnippet>
    ${content.slice(0, 15000)}...
    </ContentSnippet>

    OUTPUT JSON:
    [
      { "original": "Wrong Term", "replacement": "Correct Term", "reason": "Reason (e.g. 'Taiwan-only brand')" }
    ]
    Return JSON only. If no issues, return [].
    `
};
}),
"[project]/src/services/research/productFeatureToPainPointMapper.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateProblemProductMapping",
    ()=>generateProblemProductMapping,
    "generateProductBrief",
    ()=>generateProductBrief,
    "mapProblemsToProduct",
    ()=>mapProblemsToProduct,
    "parseProductContext",
    ()=>parseProductContext,
    "summarizeBrandContent",
    ()=>summarizeBrandContent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/aiService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/schemaTypes.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptTemplates.ts [app-ssr] (ecmascript)");
;
;
;
;
const generateProductBrief = async (productName, productUrl, targetAudience)=>{
    const startTs = Date.now();
    const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(targetAudience);
    // 1. Fetch Product Page Content (Mock/Proxy)
    // In a real app, we'd use a server-side proxy to fetch the HTML.
    // For now, we'll ask the AI to "Infer" based on the name/URL if it knows it, 
    // or we can pass a "Context" string if the user provided one.
    // Assuming we rely on the AI's internal knowledge or the URL structure for now.
    const prompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].productBrief({
        productName,
        productUrl,
        languageInstruction
    });
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runJson(prompt, 'FLASH', {
            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
            properties: {
                brandName: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                },
                productName: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                },
                productDescription: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                },
                usp: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                },
                primaryPainPoint: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                },
                ctaLink: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                }
            },
            required: [
                "brandName",
                "productName",
                "usp",
                "ctaLink"
            ]
        });
        // Fill in defaults if missing
        const data = response.data;
        const finalData = {
            brandName: data.brandName || "Brand",
            productName: data.productName || productName,
            usp: data.usp || "",
            ctaLink: data.ctaLink || productUrl,
            targetPainPoints: data.primaryPainPoint // Map if exists
        };
        return {
            data: finalData,
            usage: response.usage,
            cost: response.cost,
            duration: response.duration
        };
    } catch (e) {
        console.error("Product Brief Generation Failed", e);
        return {
            data: {
                brandName: "",
                productName: productName,
                usp: "",
                ctaLink: productUrl
            },
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
            },
            cost: {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            },
            duration: Date.now() - startTs
        };
    }
};
const mapProblemsToProduct = async (productBrief, articleTopic, targetAudience)=>{
    const startTs = Date.now();
    const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(targetAudience);
    const prompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].productMapping({
        productBrief,
        articleTopic,
        languageInstruction
    });
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runJson(prompt, 'FLASH', {
            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
            items: {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
                properties: {
                    painPoint: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                    },
                    productFeature: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                    },
                    relevanceKeywords: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                        items: {
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                        }
                    }
                },
                required: [
                    "painPoint",
                    "productFeature",
                    "relevanceKeywords"
                ]
            }
        });
        return {
            data: response.data,
            usage: response.usage,
            cost: response.cost,
            duration: response.duration
        };
    } catch (e) {
        console.error("Brand Content Summarization Failed", e);
        return {
            data: [],
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
            },
            cost: {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            },
            duration: Date.now() - startTs
        };
    }
};
const parseProductContext = async (rawText)=>{
    const startTs = Date.now();
    const prompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].productContextFromText({
        rawText
    });
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runJson(prompt, 'FLASH', {
            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
            properties: {
                brandName: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                },
                productName: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                },
                usp: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                },
                primaryPainPoint: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                },
                ctaLink: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                }
            },
            required: [
                "brandName",
                "productName",
                "usp",
                "ctaLink"
            ]
        });
        const data = response.data;
        return {
            data: {
                brandName: data.brandName || "",
                productName: data.productName || "",
                usp: data.usp || "",
                ctaLink: data.ctaLink || "",
                targetPainPoints: data.primaryPainPoint
            },
            usage: response.usage,
            cost: response.cost,
            duration: response.duration
        };
    } catch (e) {
        console.error("Product Context Parsing Failed", e);
        return {
            data: {
                brandName: "",
                productName: "",
                usp: "",
                ctaLink: ""
            },
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
            },
            cost: {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            },
            duration: Date.now() - startTs
        };
    }
};
const generateProblemProductMapping = async (productBrief, targetAudience, articleTopic = "General Content")=>{
    return mapProblemsToProduct(productBrief, articleTopic, targetAudience);
};
const summarizeBrandContent = async (urls, targetAudience)=>{
    const startTs = Date.now();
    const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(targetAudience);
    const prompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].brandSummary({
        urls,
        languageInstruction
    });
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runText(prompt, 'FLASH');
        return {
            data: response.text,
            usage: response.usage,
            cost: response.cost,
            duration: response.duration
        };
    } catch (e) {
        console.error("Brand Summary Failed", e);
        return {
            data: "",
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
            },
            cost: {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            },
            duration: Date.now() - startTs
        };
    }
};
}),
"[project]/src/services/research/webScraper.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fetchUrlContent",
    ()=>fetchUrlContent
]);
const fetchUrlContent = async (url, options = {})=>{
    if (!url) return {
        title: '',
        content: '',
        images: []
    };
    try {
        new URL(url);
    } catch (_) {
        throw new Error("Invalid URL format");
    }
    try {
        // Construct headers, optionally including/excluding nav
        const headers = {
            'x-no-cache': 'false',
            'X-Md-Heading-Style': 'setext'
        };
        if (!options.includeNav) {
            // Default behavior: Remove nav, header, footer for article reading
            headers['X-Remove-Selector'] = 'header, footer, nav, aside';
        } else {
            // If includeNav is true, we might still want to remove ads/sidebars but keep header/footer
            headers['X-Remove-Selector'] = 'aside'; // Keep header/footer/nav for contact info
        }
        const response = await fetch(`https://r.jina.ai/${url}`, {
            method: 'GET',
            headers: headers
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch content: ${response.statusText}`);
        }
        const rawText = await response.text();
        if (!rawText || rawText.length < 50) {
            throw new Error("Content retrieved is too short or empty.");
        }
        const cleaned = cleanJinaBySeparator(rawText);
        return {
            ...cleaned
        };
    } catch (error) {
        console.error("Web Scraping Error:", error);
        throw new Error(error.message || "Failed to scrape URL");
    }
};
const extractImagesFromContent = (text, range = 50)=>{
    // Regex to capture ![alt](url)
    const regex = /!\[(.*?)\]\((.*?)\)/g;
    let match;
    const rawMatches = [];
    while((match = regex.exec(text)) !== null){
        const fullMatchStr = match[0];
        const altText = match[1];
        const url = match[2];
        const matchIndex = match.index;
        const matchLength = fullMatchStr.length;
        const startPos = Math.max(0, matchIndex - range);
        const endPos = Math.min(text.length, matchIndex + matchLength + range);
        const preContext = text.substring(startPos, matchIndex).trim();
        const postContext = text.substring(matchIndex + matchLength, endPos).trim();
        rawMatches.push({
            index: matchIndex,
            length: matchLength,
            image: {
                url,
                preContext,
                altText,
                postContext
            }
        });
    }
    if (rawMatches.length <= 10) {
        return rawMatches.map((item)=>item.image);
    }
    const filteredImages = [];
    let lastEndPos = -1;
    for (const item of rawMatches){
        if (lastEndPos === -1) {
            filteredImages.push(item.image);
            lastEndPos = item.index + item.length;
            continue;
        }
        const textBetween = text.substring(lastEndPos, item.index);
        const meaningfulContent = textBetween.replace(/\s/g, '');
        if (meaningfulContent.length >= 30) {
            filteredImages.push(item.image);
            lastEndPos = item.index + item.length;
        }
    }
    return filteredImages;
};
const cleanJinaBySeparator = (rawText)=>{
    const titleMatch = rawText.match(/^Title:\s*(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : '';
    let contentBody = rawText;
    if (rawText.includes('Markdown Content:')) {
        const parts = rawText.split('Markdown Content:');
        contentBody = parts.slice(1).join('Markdown Content:');
    }
    // Preserve heading structure: convert setext (=== / ---) to ATX (# / ##)
    let cleanContent = convertSetextToAtx(contentBody.trim());
    // Extract images BEFORE cleaning them out
    const images = extractImagesFromContent(cleanContent);
    // Apply cleaning
    cleanContent = cleanArtifacts(cleanContent);
    if (title && !cleanContent.startsWith('#')) {
        cleanContent = `# ${title}\n\n${cleanContent}`;
    }
    return {
        title,
        content: cleanContent,
        images
    };
};
// Convert setext headings (text + === / ---) into ATX (# / ##) so they survive later cleanup.
// Skip fenced code blocks to avoid rewriting literal divider lines inside code samples.
const convertSetextToAtx = (text)=>{
    const lines = text.split('\n');
    const out = [];
    let inFence = false;
    for(let i = 0; i < lines.length; i++){
        const line = lines[i];
        // Toggle code fence state
        if (/^\s*(```|~~~)/.test(line.trim())) {
            inFence = !inFence;
            out.push(line);
            continue;
        }
        if (!inFence && i + 1 < lines.length) {
            const underline = lines[i + 1];
            const match = underline.match(/^\s*(=+|-+)\s*$/);
            const hasText = line.trim().length > 0;
            const prevIsBlank = i === 0 || lines[i - 1].trim() === '';
            if (match && hasText && prevIsBlank) {
                const level = match[1].startsWith('=') ? '#' : '##';
                out.push(`${level} ${line.trim()}`);
                i++; // Skip underline line
                continue;
            }
        }
        out.push(line);
    }
    return out.join('\n');
};
/**
 * FIXED: Optimized Cleaning Logic
 * Corrects issues with leftover image markdown, broken links, and specific UI junk.
 */ const cleanArtifacts = (text)=>{
    let cleaned = text;
    // ============================================================
    // 1. Specific Junk Phrase Removal (Requested User Rules)
    // ============================================================
    const junkPhrases = [
        /^Ad Placement\s*:.*$/gim,
        /^(Login|登入|Sign In).*$/gim,
        /^ADVERTISEMENT$/gim,
        /^CONTINUE READING BELOW$/gim,
        /^Share on:.*$/gim,
        /^recommended$/gim,
        /^Related Articles:?$/gim,
        /^Read More:?$/gim,
        /^SCROLL TO CONTINUE\s*:.*$/gim,
        /^[ \t]*\S{1,2}[ \t]*$/gm // Remove lines with < 3 chars (e.g. "US", "Go", "|", "。")
    ];
    junkPhrases.forEach((regex)=>{
        cleaned = cleaned.replace(regex, '');
    });
    // ============================================================
    // 2. Image Cleanup (Prioritized)
    // ============================================================
    // Fix: Remove standard markdown images `![Alt](Url)`
    cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, '');
    // Jina non-standard image artifacts cleanup
    cleaned = cleaned.replace(/^!Image\s+\d+:.*$/gm, '');
    cleaned = cleaned.replace(/!Image\s*\[.*?\]/gi, '');
    // Remove orphaned closing link syntax often left behind
    cleaned = cleaned.replace(/^\]\(.*?\)/gm, '');
    // ============================================================
    // 3. Link Density Filter
    // ============================================================
    const linkRegex = /\[(.*?)\]\(.*?\)/g;
    const linkMatches = [];
    let lMatch;
    while((lMatch = linkRegex.exec(cleaned)) !== null){
        linkMatches.push({
            index: lMatch.index,
            length: lMatch[0].length
        });
    }
    if (linkMatches.length > 6) {
        const indicesToRemove = [];
        let lastValidEnd = -1;
        for(let i = 0; i < linkMatches.length; i++){
            const m = linkMatches[i];
            const mStart = m.index;
            const mEnd = mStart + m.length;
            if (i === 0) {
                lastValidEnd = mEnd;
                continue;
            }
            const textBetween = cleaned.substring(lastValidEnd, mStart);
            if (textBetween.replace(/\s/g, '').length < 30) {
                indicesToRemove.push({
                    start: mStart,
                    end: mEnd
                });
            } else {
                lastValidEnd = mEnd;
            }
        }
        // Reverse loop removal to keep indices valid
        for(let i = indicesToRemove.length - 1; i >= 0; i--){
            const range = indicesToRemove[i];
            cleaned = cleaned.substring(0, range.start) + cleaned.substring(range.end);
        }
    }
    // ============================================================
    // 4. General Link Cleaning
    // ============================================================
    // Remove empty links
    cleaned = cleaned.replace(/\[\s*\]\(.*?\)/g, '');
    // Remove resulting empty list items
    cleaned = cleaned.replace(/^\s*([-*]|\d+\.)\s*$/gm, '');
    // Flatten Links: Convert `[Text](Url)` to `Text`
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
    // ============================================================
    // 5. Noise & Metadata Cleanup
    // ============================================================
    // Google Analytics / Ads artifacts
    cleaned = cleaned.replace(/^\s*(UA-\d+-\d+|G-[A-Z0-9]+)\s*$/gm, '');
    // Common noise words (Case insensitive)
    cleaned = cleaned.replace(/^(holiday|girlstyle|businessfocus|mamidaily)\s*$/gim, '');
    // HK style "All Chinese" navs
    cleaned = cleaned.replace(/^All\s+[\u4e00-\u9fa5]+.*$/gm, '');
    // User-requested noise lines between content
    cleaned = cleaned.replace(/^\s*-{3,}\s*$/gm, ''); // ----- separators
    cleaned = cleaned.replace(/^\s*\u25b2?\s*Cosmopolitan\.com\.hk\s*$/gim, ''); // Cosmopolitan.com.hk with optional ▲
    // Final Whitespace Cleanup
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();
    return cleaned;
};
}),
"[project]/src/services/research/referenceAnalysisService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "analyzeReferenceStructure",
    ()=>analyzeReferenceStructure,
    "extractWebsiteTypeAndTerm",
    ()=>extractWebsiteTypeAndTerm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/aiService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptTemplates.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/schemaTypes.ts [app-ssr] (ecmascript)");
;
;
;
;
const extractWebsiteTypeAndTerm = async (content)=>{
    // Lightweight helper for URL scraping flow to infer websiteType & authorityTerms.
    const prompt = `
    Scan the following content and extract:
    1) websiteType: e.g., "Medical Clinic", "Ecommerce", "Blog".
    2) authorityTerms: up to 5 key terms related to brand authority (certifications, ingredients, key specs).
    CONTENT:
    ${content.substring(0, 6000)}
    OUTPUT JSON: { "websiteType": "...", "authorityTerms": "comma separated terms" }
    `;
    // Using runJson for structured output
    return await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runJson(prompt, 'FLASH', {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
        properties: {
            websiteType: {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
            },
            authorityTerms: {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
            }
        }
    });
};
const analyzeReferenceStructure = async (referenceContent, targetAudience)=>{
    const startTs = Date.now();
    const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(targetAudience);
    // Prepare Prompts
    // Using full content as requested by the user
    const structurePrompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].narrativeStructure({
        content: referenceContent,
        targetAudience,
        languageInstruction
    });
    const voicePrompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].voiceStrategy({
        content: referenceContent,
        targetAudience,
        languageInstruction
    });
    try {
        // Run Parallel Analysis
        const [structRes, voiceRes] = await Promise.all([
            // 1. Structure Analysis
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runJson(structurePrompt, 'FLASH', {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
                properties: {
                    h1Title: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                    },
                    introText: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                    },
                    keyInformationPoints: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                        items: {
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                        }
                    },
                    structure: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                        items: {
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
                            properties: {
                                title: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                },
                                narrativePlan: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                                    items: {
                                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                    }
                                },
                                coreQuestion: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                },
                                difficulty: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING,
                                    description: "easy | medium | unclear"
                                },
                                exclude: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].BOOLEAN
                                },
                                excludeReason: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                },
                                writingMode: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING,
                                    description: "direct | multi_solutions"
                                },
                                solutionAngles: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                                    items: {
                                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                    }
                                },
                                subheadings: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                                    items: {
                                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                    }
                                },
                                keyFacts: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                                    items: {
                                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                    }
                                },
                                uspNotes: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                                    items: {
                                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                    }
                                },
                                isChecklist: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].BOOLEAN
                                },
                                suppress: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                                    items: {
                                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                    }
                                },
                                augment: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                                    items: {
                                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                    }
                                },
                                sentenceStartFeatures: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                                    items: {
                                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                    }
                                },
                                sentenceEndFeatures: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                                    items: {
                                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                    }
                                }
                            },
                            required: [
                                "title",
                                "narrativePlan",
                                "coreQuestion",
                                "writingMode",
                                "keyFacts"
                            ]
                        }
                    }
                },
                required: [
                    "h1Title",
                    "introText",
                    "structure",
                    "keyInformationPoints"
                ]
            }),
            // 2. Voice & Strategy Analysis
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runJson(voicePrompt, 'FLASH', {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
                properties: {
                    generalPlan: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                        items: {
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                        }
                    },
                    conversionPlan: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                        items: {
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                        }
                    },
                    brandExclusivePoints: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                        items: {
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                        }
                    },
                    competitorBrands: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                        items: {
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                        }
                    },
                    competitorProducts: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                        items: {
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                        }
                    },
                    regionVoiceDetect: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                    },
                    humanWritingVoice: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                    }
                },
                required: [
                    "generalPlan",
                    "conversionPlan",
                    "brandExclusivePoints",
                    "regionVoiceDetect",
                    "humanWritingVoice"
                ]
            })
        ]);
        const structData = structRes.data;
        const voiceData = voiceRes.data;
        console.log('[RefAnalysis] Raw AI Structure Data:', JSON.stringify(structData, null, 2));
        console.log('[RefAnalysis] Raw AI Voice Data:', JSON.stringify(voiceData, null, 2));
        // Filter excluded sections
        const filteredStructure = (structData.structure || []).filter((item)=>{
            if (item.exclude === true) {
                console.log(`[RefAnalysis] AI Excluded section: "${item.title}" - Reason: ${item.excludeReason || 'irrelevant'}`);
                return false;
            }
            // HARDCODED FALLBACK: Exclude common navigational sections that AI might miss
            const navKeywords = [
                '目錄',
                '導覽',
                '清單',
                '引言',
                '延伸閱讀',
                '相關文章',
                'Table of Contents',
                'TOC',
                'Introduction'
            ];
            if (navKeywords.some((kw)=>item.title.includes(kw) && item.title.length < 15)) {
                console.log(`[RefAnalysis] Auto-Excluding navigational section: "${item.title}"`);
                return false;
            }
            return true;
        });
        const normalizedStructure = filteredStructure.map((item)=>{
            const normalized = {
                ...item,
                subheadings: Array.isArray(item.subheadings) ? item.subheadings : [],
                keyFacts: Array.isArray(item.keyFacts) ? item.keyFacts : [],
                uspNotes: Array.isArray(item.uspNotes) ? item.uspNotes : [],
                suppress: Array.isArray(item.suppress) ? item.suppress : [],
                augment: Array.isArray(item.augment) ? item.augment : [],
                narrativePlan: Array.isArray(item.narrativePlan) ? item.narrativePlan : [],
                sentenceStartFeatures: Array.isArray(item.sentenceStartFeatures) ? item.sentenceStartFeatures : [],
                sentenceEndFeatures: Array.isArray(item.sentenceEndFeatures) ? item.sentenceEndFeatures : []
            };
            // STRICT VALIDATION: If a section is included, it MUST have a plan and facts
            if (normalized.narrativePlan.length === 0 || normalized.keyFacts.length === 0) {
                console.error(`[RefAnalysis] Section "${item.title}" failed validation: Missing Narrative Plan or Key Facts.`);
                throw new Error(`Invalid Narrative Structure: Section "${item.title}" is missing required content (Plan/Facts).`);
            }
            return normalized;
        });
        const combinedRules = [
            ...voiceData.competitorBrands || [],
            ...voiceData.competitorProducts || []
        ];
        // Combine Token Usage & Cost
        const totalUsage = {
            inputTokens: (structRes.usage?.inputTokens || 0) + (voiceRes.usage?.inputTokens || 0),
            outputTokens: (structRes.usage?.outputTokens || 0) + (voiceRes.usage?.outputTokens || 0),
            totalTokens: (structRes.usage?.totalTokens || 0) + (voiceRes.usage?.totalTokens || 0)
        };
        const totalCost = {
            inputCost: (structRes.cost?.inputCost || 0) + (voiceRes.cost?.inputCost || 0),
            outputCost: (structRes.cost?.outputCost || 0) + (voiceRes.cost?.outputCost || 0),
            totalCost: (structRes.cost?.totalCost || 0) + (voiceRes.cost?.totalCost || 0)
        };
        return {
            data: {
                h1Title: structData.h1Title || '',
                introText: structData.introText || '',
                structure: normalizedStructure,
                keyInformationPoints: structData.keyInformationPoints || [],
                // From Voice Analysis
                generalPlan: voiceData.generalPlan || [],
                conversionPlan: voiceData.conversionPlan || [],
                brandExclusivePoints: voiceData.brandExclusivePoints || [],
                replacementRules: combinedRules,
                competitorBrands: voiceData.competitorBrands || [],
                competitorProducts: voiceData.competitorProducts || [],
                regionVoiceDetect: voiceData.regionVoiceDetect,
                humanWritingVoice: voiceData.humanWritingVoice
            },
            usage: totalUsage,
            cost: totalCost,
            duration: Date.now() - startTs
        };
    } catch (e) {
        console.error("Structure analysis failed", e);
        const errorUsage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toTokenUsage"])(0); // Simplified error handling
        const errorCost = {
            inputCost: 0,
            outputCost: 0,
            totalCost: 0
        };
        return {
            data: {
                structure: [],
                generalPlan: [],
                conversionPlan: [],
                keyInformationPoints: [],
                brandExclusivePoints: [],
                replacementRules: [],
                competitorBrands: [],
                competitorProducts: []
            },
            usage: errorUsage,
            cost: errorCost,
            duration: Date.now() - startTs
        };
    }
};
}),
"[project]/src/services/engine/embeddingService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cosineSimilarity",
    ()=>cosineSimilarity,
    "embedTexts",
    ()=>embedTexts
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/constants.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$genAIClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/genAIClient.ts [app-ssr] (ecmascript)");
const __TURBOPACK__import$2e$meta__ = {
    get url () {
        return `file://${__turbopack_context__.P("src/services/engine/embeddingService.ts")}`;
    }
};
;
;
const env = ("TURBOPACK compile-time value", "object") !== 'undefined' && __TURBOPACK__import$2e$meta__.env ? __TURBOPACK__import$2e$meta__.env : process.env;
const asVector = (value)=>{
    if (!Array.isArray(value)) return null;
    return value;
};
const asMatrix = (value)=>{
    if (!Array.isArray(value)) return null;
    const vectors = value.map((entry)=>asVector(entry)).filter(Boolean);
    return vectors.length ? vectors : null;
};
const extractEmbeddings = (payload)=>{
    if (!payload) return [];
    const direct = asMatrix(payload.embeddings);
    if (direct) return direct;
    const dataField = payload.data;
    const nested = asMatrix(dataField?.embeddings);
    if (nested) return nested;
    if (Array.isArray(dataField)) {
        const vectors = dataField.map((entry)=>asMatrix(entry?.embeddings)?.[0] || asVector(entry?.embedding) || asVector(entry)).filter(Boolean);
        if (vectors.length) return vectors;
    }
    const single = asVector(payload.embedding) || asVector(dataField?.embedding) || asVector(dataField);
    return single ? [
        single
    ] : [];
};
const embedTexts = async (texts, options = {})=>{
    if (!Array.isArray(texts) || texts.length === 0) return [];
    const providerOptions = {};
    if (options.taskType) providerOptions.taskType = options.taskType;
    if (options.outputDimensionality) providerOptions.outputDimensionality = options.outputDimensionality;
    const body = {
        texts,
        model: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["EMBED_MODEL_ID"]
    };
    if (options.taskType) body.taskType = options.taskType;
    if (options.outputDimensionality) body.outputDimensionality = options.outputDimensionality;
    if (Object.keys(providerOptions).length > 0) {
        body.providerOptions = {
            google: providerOptions
        };
    }
    const token = env.VITE_AI_TOKEN || env.AI_TOKEN;
    const headers = {
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$genAIClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildAiUrl"])('/embed'), {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        ...options.signal ? {
            signal: options.signal
        } : {}
    });
    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    if (!response.ok) {
        const detail = isJson ? await response.json().catch(()=>undefined) : await response.text();
        const message = typeof detail === 'string' ? detail : detail?.error || JSON.stringify(detail || '');
        throw new Error(`Failed to fetch embeddings: ${response.status} ${message || ''}`.trim());
    }
    const payload = isJson ? await response.json() : {
        embeddings: []
    };
    const embeddings = extractEmbeddings(payload);
    if (!embeddings.length) {
        throw new Error('Embedding response did not include vectors');
    }
    if (embeddings.length !== texts.length) {
        return texts.map((_, idx)=>embeddings[idx] || []);
    }
    return embeddings;
};
const cosineSimilarity = (a, b)=>{
    if (!a?.length || !b?.length || a.length !== b.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for(let i = 0; i < a.length; i++){
        dot += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) return 0;
    return dot / magnitude;
};
}),
"[project]/src/services/generation/imageService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "analyzeImageWithAI",
    ()=>analyzeImageWithAI,
    "analyzeVisualStyle",
    ()=>analyzeVisualStyle,
    "generateImage",
    ()=>generateImage,
    "generateImagePromptFromContext",
    ()=>generateImagePromptFromContext,
    "planImagesForArticle",
    ()=>planImagesForArticle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/aiService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/schemaTypes.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptTemplates.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/constants.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$genAIClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/genAIClient.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
const VISUAL_STYLE_GUIDE = `
    **STRICT VISUAL CATEGORIES (Select ONE):**
    1. **INFOGRAPHIC:** Clean, modern layout using icons, flowcharts, or "lazy pack" style summaries to explain concepts. (Use for: steps, summaries, data).
    2. **BRANDED_LIFESTYLE:** High-end photography. Real people using the product/service in a specific, authentic environment. (Use for: Brand image, emotional connection).
    3. **PRODUCT_INFOGRAPHIC:** Close-up of the product with subtle graphical highlights (lines/arrows) emphasizing a specific feature/spec.
    4. **ECOMMERCE_WHITE_BG:** Pure white background, studio lighting, product isolated. (Use for: Commercial display only).

    **COMPOSITION RULE (Split Screen):**
    - If the context compares two things (Before/After, Good vs Bad, Option A vs B), or needs a macro detail alongside a wide shot, request a "Split Screen (Left/Right)" composition.
    
    **NEGATIVE CONSTRAINTS (ABSOLUTELY FORBIDDEN):**
    - **NO ABSTRACT ART:** No glowing brains, floating digital nodes, surreal metaphors, or "conceptual" 3D renders.
    - **NO TEXT:** Do not try to render specific sentences inside the image (AI cannot spell).
`;
const ensureDataUrl = (value, mimeType = 'image/png')=>{
    if (!value) return null;
    if (value.startsWith('data:') || value.startsWith('http')) return value;
    return `data:${mimeType};base64,${value}`;
};
const asArray = (value)=>{
    if (!value) return [];
    return Array.isArray(value) ? value : [
        value
    ];
};
const pickFromImageLike = (input, fallbackMime)=>{
    if (!input) return null;
    if (typeof input === 'string') return ensureDataUrl(input, fallbackMime || 'image/png');
    if (input.inlineData?.data) {
        return ensureDataUrl(input.inlineData.data, input.inlineData.mimeType || fallbackMime);
    }
    const directData = input.b64_json || input.base64 || input.base64Data || input.data || input.image;
    if (typeof directData === 'string') {
        return ensureDataUrl(directData, input.mimeType || input.mediaType || fallbackMime);
    }
    if (directData && typeof directData === 'object' && directData !== input) {
        const nested = pickFromImageLike(directData, input.mimeType || input.mediaType || fallbackMime);
        if (nested) return nested;
    }
    if (typeof input.text === 'string' && input.text.trim().startsWith('data:image')) {
        return input.text.trim();
    }
    if (input.url && typeof input.url === 'string') return input.url;
    return null;
};
const extractFromCandidates = (candidates)=>{
    if (!Array.isArray(candidates)) return null;
    for (const candidate of candidates){
        const parts = candidate?.content?.parts;
        if (Array.isArray(parts)) {
            for (const part of parts){
                if (part?.inlineData?.data) {
                    return ensureDataUrl(part.inlineData.data, part.inlineData.mimeType);
                }
                if (typeof part?.text === 'string' && part.text.trim().startsWith('data:image')) {
                    return part.text.trim();
                }
            }
        }
    }
    return null;
};
const extractImagePayload = (payload)=>{
    if (!payload) return null;
    if (typeof payload === 'string') return ensureDataUrl(payload);
    const direct = pickFromImageLike(payload, payload.mimeType || payload.mediaType);
    if (direct) return direct;
    const candidateImage = extractFromCandidates(payload.candidates || payload.response?.candidates);
    if (candidateImage) return candidateImage;
    const collections = [
        payload.images,
        payload.data?.images,
        payload.response?.images,
        payload.result?.images,
        payload.data,
        payload.result
    ];
    for (const collection of collections){
        for (const entry of asArray(collection)){
            const found = pickFromImageLike(entry, payload?.mimeType || payload?.mediaType);
            if (found) return found;
        }
    }
    if (payload.result?.image) return ensureDataUrl(payload.result.image);
    return null;
};
const analyzeImageWithAI = async (imageUrl, prompt = 'Describe this image in detail.', model = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MODEL"].FLASH)=>{
    const startTs = Date.now();
    try {
        const response = await fetch((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$genAIClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildAiUrl"])('/vision'), {
            method: 'POST',
            headers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$genAIClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAiHeaders"])(),
            body: JSON.stringify({
                prompt,
                image: imageUrl,
                model
            })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Vision API request failed (${response.status}): ${errorText}`);
        }
        const result = await response.json();
        const duration = Date.now() - startTs;
        const modelType = model.includes('flash') ? 'FLASH' : 'FLASH';
        const metrics = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateCost"])(result, modelType);
        return {
            data: result.text,
            ...metrics,
            duration
        };
    } catch (error) {
        const duration = Date.now() - startTs;
        throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : String(error)}`);
    }
};
const analyzeVisualStyle = async (scrapedImages, websiteType)=>{
    const startTs = Date.now();
    const analyzedSamples = scrapedImages.filter((img)=>img.aiDescription).slice(0, 5).map((img)=>img.aiDescription).join("\n---\n");
    const prompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].visualStyle({
        languageInstruction: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])('zh-TW'),
        analyzedSamples,
        websiteType
    });
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runText(prompt, 'FLASH');
        return {
            data: response.text,
            usage: response.usage,
            cost: response.cost,
            duration: response.duration
        };
    } catch (e) {
        console.error("Visual Style Analysis failed", e);
        return {
            data: "Clean, modern professional photography with natural lighting.",
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
            },
            cost: {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            },
            duration: Date.now() - startTs
        };
    }
};
const generateImagePromptFromContext = async (contextText, targetAudience, visualStyle = "")=>{
    const startTs = Date.now();
    const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(targetAudience);
    const prompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].imagePromptFromContext({
        contextText,
        languageInstruction,
        visualStyle,
        guide: VISUAL_STYLE_GUIDE
    });
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runText(prompt, 'FLASH');
    return {
        data: response.text?.trim() || "",
        usage: response.usage,
        cost: response.cost,
        duration: Date.now() - startTs
    };
};
const generateImage = async (prompt)=>{
    const startTs = Date.now();
    try {
        const response = await fetch((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$genAIClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["buildAiUrl"])('/image'), {
            method: 'POST',
            headers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$genAIClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAiHeaders"])(),
            body: JSON.stringify({
                prompt,
                model: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MODEL"].IMAGE_PREVIEW,
                aspectRatio: '16:9'
            })
        });
        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');
        if (!response.ok) {
            const detail = isJson ? await response.json() : await response.text();
            const message = typeof detail === 'string' ? detail : detail?.error || JSON.stringify(detail);
            throw new Error(`Image generation failed (${response.status}): ${message}`);
        }
        const payload = isJson ? await response.json() : {
            image: await response.text()
        };
        const imageData = extractImagePayload(payload);
        const metrics = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateCost"])(payload.totalUsage || payload.usageMetadata || payload.usage, 'IMAGE_GEN');
        return {
            data: imageData,
            ...metrics,
            duration: Date.now() - startTs
        };
    } catch (e) {
        console.error("Image generation failed", e);
        throw e;
    }
};
// Helper: Convert SVG Blob to PNG Base64 for AI Consumption
const convertSvgToPng = (svgBlob)=>{
    return new Promise((resolve, reject)=>{
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = ()=>{
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width || 800;
                canvas.height = img.height || 600;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error("Canvas context not available"));
                    return;
                }
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                const dataUrl = canvas.toDataURL('image/png');
                URL.revokeObjectURL(url);
                resolve(dataUrl.split(',')[1]);
            } catch (e) {
                URL.revokeObjectURL(url);
                reject(e);
            }
        };
        img.onerror = ()=>{
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load SVG image"));
        };
        img.src = url;
    });
};
const planImagesForArticle = async (articleContent, scrapedImages, targetAudience, visualStyle = "")=>{
    const startTs = Date.now();
    const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(targetAudience);
    const maxImages = scrapedImages.length > 0 ? scrapedImages.length + 1 : 2;
    const imageContexts = scrapedImages.slice(0, 30).map((img)=>({
            alt: img.altText,
            aiAnalysis: img.aiDescription || "N/A"
        }));
    const prompt = `
    I have a draft ARTICLE and a list of SOURCE IMAGES.
    I also have a MANDATORY GLOBAL VISUAL STYLE that must be applied to all generated images.

    GLOBAL VISUAL STYLE: "${visualStyle || "Clean, modern, professional style"}"
    
    TASK:
    Create a "Visual Asset Plan" for the new article.
    
    ${VISUAL_STYLE_GUIDE}
    
    **ADDITIONAL CONSTRAINTS:**
    1. **Quantity:** Generate a plan for **MAXIMUM ${maxImages} images**.
    2. **Context & Culture:** Ensure the image description is culturally relevant.
       ${languageInstruction}
    3. **Insertion Anchor:** Select a unique text phrase (6-12 chars) from the content.
    4. **Unified Style:** In the 'generatedPrompt', you MUST Explicitly describe how the "Global Visual Style" applies to this specific subject. Do NOT frame as an infographic; focus on photography, product, or lifestyle visuals.

    ARTICLE CONTENT:
    ${articleContent.substring(0, 20000)}

    SOURCE IMAGES (Analyzed Reference):
    ${JSON.stringify(imageContexts)}
    `;
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runJson(prompt, 'FLASH', {
            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
            properties: {
                plans: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                    items: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
                        properties: {
                            generatedPrompt: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING,
                                description: "Detailed prompt including subject + visual style + mood."
                            },
                            category: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING,
                                enum: [
                                    "BRANDED_LIFESTYLE",
                                    "PRODUCT_DETAIL",
                                    "ECOMMERCE_WHITE_BG"
                                ]
                            },
                            insertAfter: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                            },
                            rationale: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                            }
                        },
                        required: [
                            "generatedPrompt",
                            "category",
                            "insertAfter"
                        ]
                    }
                }
            },
            required: [
                "plans"
            ]
        });
        const plans = response.data.plans || [];
        const finalPlans = plans.map((p, index)=>({
                id: `plan-${Date.now()}-${index}`,
                category: p.category,
                generatedPrompt: p.generatedPrompt,
                insertAfter: p.insertAfter,
                status: 'idle'
            }));
        return {
            data: finalPlans,
            usage: response.usage,
            cost: response.cost,
            duration: response.duration
        };
    } catch (e) {
        console.error("Image Planning failed", e);
        return {
            data: [],
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
            },
            cost: {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            },
            duration: Date.now() - startTs
        };
    }
};
}),
"[project]/src/services/engine/contextFilterService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "filterSectionContext",
    ()=>filterSectionContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/schemaTypes.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/aiService.ts [app-ssr] (ecmascript)");
;
;
;
const filterSectionContext = async (sectionTitle, allKeyPoints, allAuthTerms, brandKnowledgeBase, targetAudience)=>{
    const startTs = Date.now();
    const hasKnowledge = brandKnowledgeBase && brandKnowledgeBase.trim().length > 10;
    if (!hasKnowledge && allKeyPoints.length <= 5 && allAuthTerms.length <= 5) {
        return {
            data: {
                filteredPoints: allKeyPoints,
                filteredAuthTerms: allAuthTerms,
                knowledgeInsights: []
            },
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
            },
            cost: {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            },
            duration: 0
        };
    }
    const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(targetAudience);
    const prompt = `
    I am writing a specific section titled: "${sectionTitle}".
    
    I have:
    1. A database of "Key Information Points".
    2. A database of "Authority Terms".
    3. A "BRAND KNOWLEDGE BASE" (Guidelines/Specs).
    
    TASK:
    1. **Filter Data**: Select ONLY the Key Points and Authority Terms strictly relevant to "${sectionTitle}".
    2. **Agentic Retrieval**: Read the "BRAND KNOWLEDGE BASE". Extract 3-5 specific bullet points (Do's, Don'ts, Specs, Tone) that MUST be applied to this specific section.
       - If nothing is relevant in the KB for this section, return empty list.
    
    ${languageInstruction}
    
    DATABASE:
    Key Points: ${JSON.stringify(allKeyPoints)}
    Authority Terms: ${JSON.stringify(allAuthTerms)}
    
    BRAND KNOWLEDGE BASE:
    ${brandKnowledgeBase ? brandKnowledgeBase.substring(0, 30000) : "N/A"}
    `;
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runText(prompt, 'FLASH', {
            responseMimeType: 'application/json',
            responseSchema: {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
                properties: {
                    filteredPoints: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                        items: {
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                        }
                    },
                    filteredAuthTerms: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                        items: {
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                        }
                    },
                    knowledgeInsights: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                        items: {
                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                        }
                    }
                }
            }
        });
        const data = JSON.parse(response.text || "{}");
        const metrics = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateCost"])(response.usage, 'FLASH');
        return {
            data: {
                filteredPoints: data.filteredPoints || [],
                filteredAuthTerms: data.filteredAuthTerms || [],
                knowledgeInsights: data.knowledgeInsights || []
            },
            ...metrics,
            duration: response.duration
        };
    } catch (e) {
        console.error("Context filter failed", e);
        return {
            data: {
                filteredPoints: allKeyPoints,
                filteredAuthTerms: allAuthTerms,
                knowledgeInsights: []
            },
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
            },
            cost: {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            },
            duration: Date.now() - startTs
        };
    }
};
}),
"[project]/src/services/generation/contentGenerationService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateSectionContent",
    ()=>generateSectionContent,
    "generateSnippet",
    ()=>generateSnippet,
    "rebrandContent",
    ()=>rebrandContent,
    "smartInjectPoint",
    ()=>smartInjectPoint
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$contextFilterService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/contextFilterService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptTemplates.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/constants.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/aiService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/schemaTypes.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
// Helper to determine injection strategy for the current section
const getSectionInjectionPlan = (sectionTitle, refAnalysis, productMapping = [], productBrief, currentInjectedCount = 0, isLastSections = false)=>{
    if (!productBrief || !productBrief.productName) return "";
    let injectionPlan = `### 💎 COMMERCIAL & SERVICE STRATEGY (HIGH PRIORITY) \n`;
    let forceInjection = false;
    // ==================================================================================
    // 1. SANITIZATION & REPLACEMENT (CRITICAL)
    // ==================================================================================
    const competitorBrands = refAnalysis?.competitorBrands || [];
    const competitorProducts = refAnalysis?.competitorProducts || [];
    const genericReplacements = refAnalysis?.replacementRules || []; // Fallback
    const allTargets = [
        ...new Set([
            ...competitorBrands,
            ...competitorProducts,
            ...genericReplacements
        ])
    ];
    if (allTargets.length > 0) {
        injectionPlan += `
        **🛡️ SANITIZATION PROTOCOL (ABSOLUTE RULES):**
        You are writing for the brand: **"${productBrief.brandName}"**.
        The Reference Text mentions competitors: ${allTargets.map((t)=>`"${t}"`).join(', ')}.

        1. **TOTAL ANNIHILATION:** Never output these competitor words in the final text.
        2. **NO HYBRIDS:** Do NOT write "CompName as ${productBrief.brandName}". That is nonsense.
        3. **SUBJECT SWAP (SEMANTIC REWRITE):**
           - If the reference says: "${competitorBrands[0] || 'Competitor'} offers the best laser..."
           - **REWRITE AS:** "**${productBrief.brandName}** offers the best laser..." (Change the Subject).
           - If the reference discusses a specific machine (e.g., "${competitorProducts[0] || 'OldMachine'}"), replace it with **"${productBrief.productName}"**.
        `;
    }
    // ==================================================================================
    // 2. DENSITY CONTROL (AVOID KEYWORD STUFFING)
    // ==================================================================================
    injectionPlan += `
    **📉 DENSITY CONTROL (AVOID KEYWORD STUFFING):**
    - **Full Name Rule:** Use the full product name "**${productBrief.productName}**" **MAXIMUM ONCE** in this section.
    - **Natural Variation:** For subsequent mentions, you MUST use variations:
      - The Brand Name: "**${productBrief.brandName}**"
      - Pronouns: "We", "Our team", "The center"
      - Generic: "This technology", "The treatment", "Our service"
    `;
    // ==================================================================================
    // 3. INJECTION LOGIC (Force vs Natural)
    // ==================================================================================
    // Logic: If we haven't mentioned the product enough (<= 2) and we are at the end, FORCE IT.
    if (isLastSections && currentInjectedCount <= 2) {
        forceInjection = true;
        injectionPlan += `\n**🚀 MANDATORY INJECTION:** You have NOT mentioned "${productBrief.brandName}" enough yet. You MUST introduce it here as the solution.\n`;
    }
    // Match specific pain points to this section title.
    const titleLower = sectionTitle.toLowerCase();
    const relevantMappings = productMapping.filter((m)=>m.relevanceKeywords.some((kw)=>titleLower.includes(kw.toLowerCase())));
    const isSolutionSection = titleLower.includes('solution') || titleLower.includes('benefit') || titleLower.includes('guide') || titleLower.includes('how');
    let finalMappings = relevantMappings;
    if (relevantMappings.length === 0 && (forceInjection || isSolutionSection)) {
        // Fallback: Pick top 2 generic mappings
        finalMappings = productMapping.slice(0, 2);
    }
    if (finalMappings.length > 0) {
        injectionPlan += `\n**💡 PROBLEM-SOLUTION WEAVING:**\nIntegrate the following mapping naturally:\n`;
        finalMappings.forEach((m)=>{
            injectionPlan += `- Discuss "${m.painPoint}" -> Then present **${productBrief.brandName}** (or ${productBrief.productName}) as the solution using [${m.productFeature}].\n`;
        });
    }
    // CTA
    injectionPlan += `\n**CTA:** End with a natural link: [${productBrief.ctaLink}] (Anchor: Check ${productBrief.brandName} pricing/details).\n`;
    return injectionPlan;
};
// Demote or strip H1/H2 headings from model output to avoid duplicate section titles.
const normalizeSectionContent = (content)=>{
    let normalized = content || "";
    normalized = normalized.replace(/^##\s+/gm, "### "); // Demote H2 -> H3
    normalized = normalized.replace(/^#\s+/gm, "### "); // Demote H1 -> H3
    normalized = normalized.replace(/<h1>(.*?)<\/h1>/gi, "### $1");
    normalized = normalized.replace(/<h2>(.*?)<\/h2>/gi, "### $1");
    return normalized;
};
const generateSectionContent = async (config, sectionTitle, specificPlan, generalPlan, keywordPlans, previousSections = [], futureSections = [], authorityAnalysis = null, keyInfoPoints = [], currentCoveredPointsHistory = [], currentInjectedCount = 0, sectionMeta = {})=>{
    const startTs = Date.now();
    const isLastSections = futureSections.length <= 1;
    const keywordPlansForPrompt = keywordPlans.slice(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SEMANTIC_KEYWORD_LIMIT"]);
    // RAG: Filter context to reduce token usage
    const contextFilter = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$contextFilterService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["filterSectionContext"])(sectionTitle, keyInfoPoints, authorityAnalysis?.relevantTerms || [], config.brandKnowledge, config.targetAudience);
    const sectionKeyFacts = Array.isArray(sectionMeta.keyFacts) ? sectionMeta.keyFacts : [];
    const augmentFacts = Array.isArray(sectionMeta.augment) ? sectionMeta.augment : [];
    const relevantKeyPoints = Array.from(new Set([
        ...sectionKeyFacts,
        ...augmentFacts,
        ...contextFilter.data.filteredPoints
    ]));
    const relevantAuthTerms = contextFilter.data.filteredAuthTerms;
    const kbInsights = contextFilter.data.knowledgeInsights;
    // Use all relevant points; no frequency cap so checklists can stay intact.
    const pointsAvailableForThisSection = relevantKeyPoints;
    const { coreQuestion, difficulty, writingMode, solutionAngles } = sectionMeta || {};
    // Inject Product/Commercial Strategy if brief exists
    const injectionPlan = getSectionInjectionPlan(sectionTitle, config.referenceAnalysis, config.productMapping, config.productBrief, currentInjectedCount, isLastSections);
    const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(config.targetAudience);
    const suppressHints = Array.isArray(sectionMeta.suppress) ? sectionMeta.suppress : [];
    // shiftPlan logic removed
    const shiftPlanHints = [];
    const renderMode = sectionMeta.isChecklist ? 'checklist' : undefined;
    const augmentHints = Array.isArray(sectionMeta.augment) ? sectionMeta.augment : [];
    const subheadings = Array.isArray(sectionMeta.subheadings) ? sectionMeta.subheadings : [];
    const prompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].sectionContent({
        sectionTitle,
        languageInstruction,
        previousSections,
        futureSections,
        generalPlan,
        specificPlan,
        kbInsights,
        keywordPlans: keywordPlansForPrompt,
        relevantAuthTerms,
        points: pointsAvailableForThisSection,
        injectionPlan,
        articleTitle: config.title,
        coreQuestion,
        difficulty,
        writingMode,
        solutionAngles,
        renderMode,
        // shiftPlan removed
        suppressHints,
        augmentHints,
        subheadings,
        avoidContent: [
            ...futureSections,
            ...previousSections,
            ...relevantKeyPoints.filter((p)=>!pointsAvailableForThisSection.includes(p)),
            ...suppressHints
        ],
        regionReplacements: config.referenceAnalysis?.regionalReplacements,
        humanWritingVoice: config.referenceAnalysis?.humanWritingVoice,
        regionVoiceDetect: config.referenceAnalysis?.regionVoiceDetect,
        replacementRules: config.referenceAnalysis?.replacementRules // NEW: Pass blocked terms
    });
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runJson(prompt, 'FLASH', {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
        properties: {
            content: {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
            },
            usedPoints: {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                items: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                }
            },
            injectedCount: {
                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].INTEGER,
                description: "How many times did you mention the Product Name?"
            }
        }
    });
    const payload = response.data || {};
    const rawContent = typeof payload.content === 'string' && payload.content.trim().length > 0 ? payload.content : typeof payload.sectionContent === 'string' ? payload.sectionContent : "";
    const usedPointsSource = Array.isArray(payload.usedPoints) && payload.usedPoints || Array.isArray(payload.used_points) && payload.used_points || Array.isArray(payload.pointsUsed) && payload.pointsUsed || Array.isArray(payload.usedFacts) && payload.usedFacts || [];
    const usedPoints = Array.isArray(usedPointsSource) ? usedPointsSource.map((p)=>(typeof p === 'string' ? p : String(p || '')).trim()).filter(Boolean) : [];
    const injectedRaw = payload.injectedCount ?? payload.injected_count ?? 0;
    const injectedCount = typeof injectedRaw === 'number' ? injectedRaw : Number(injectedRaw) || 0;
    const data = {
        content: rawContent,
        usedPoints,
        injectedCount
    };
    const totalCost = {
        inputCost: response.cost.inputCost + contextFilter.cost.inputCost,
        outputCost: response.cost.outputCost + contextFilter.cost.outputCost,
        totalCost: response.cost.totalCost + contextFilter.cost.totalCost
    };
    const normalizedContent = normalizeSectionContent(data.content || "");
    const totalUsage = {
        inputTokens: response.usage.inputTokens + contextFilter.usage.inputTokens,
        outputTokens: response.usage.outputTokens + contextFilter.usage.outputTokens,
        totalTokens: response.usage.totalTokens + contextFilter.usage.totalTokens
    };
    const duration = Date.now() - startTs;
    return {
        data: {
            content: normalizedContent,
            usedPoints: data.usedPoints || [],
            injectedCount: data.injectedCount || 0
        },
        usage: totalUsage,
        cost: totalCost,
        duration
    };
};
const generateSnippet = async (prompt, targetAudience, config)=>{
    const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(targetAudience);
    const fullPrompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].snippet({
        prompt,
        languageInstruction
    });
    const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runText(fullPrompt, 'FLASH', config);
    return {
        data: res.text,
        usage: res.usage,
        cost: res.cost,
        duration: res.duration
    };
};
const rebrandContent = async (currentContent, productBrief, targetAudience)=>{
    const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(targetAudience);
    const prompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].rebrandContent({
        productBrief,
        languageInstruction,
        currentContent
    });
    const res = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runText(prompt, 'FLASH');
    return {
        data: res.text,
        usage: res.usage,
        cost: res.cost,
        duration: res.duration
    };
};
const smartInjectPoint = async (fullHtmlContent, pointToInject, targetAudience)=>{
    const startTs = Date.now();
    const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(targetAudience);
    // 1. PARSE & INDEX (Paragraph Compact Indexing)
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullHtmlContent, 'text/html');
    const blocks = [];
    const nodes = doc.querySelectorAll('p, li');
    nodes.forEach((node, index)=>{
        const text = node.textContent?.trim() || "";
        if (text.length > 20) {
            blocks.push({
                id: index,
                text: text.substring(0, 80) + "...",
                html: node.outerHTML
            });
        }
    });
    if (blocks.length === 0) {
        return {
            data: {
                originalSnippet: "",
                newSnippet: ""
            },
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
            },
            cost: {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            },
            duration: Date.now() - startTs
        };
    }
    // 2. FIND BEST BLOCK (Prompt 1)
    const findPrompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].smartFindBlock({
        pointToInject,
        blocks
    });
    const findRes = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runText(findPrompt, 'FLASH');
    const bestIdStr = findRes.text?.trim().match(/\d+/)?.[0];
    const bestId = bestIdStr ? parseInt(bestIdStr) : -1;
    const targetBlock = blocks.find((b)=>b.id === bestId);
    if (!targetBlock) {
        return {
            data: {
                originalSnippet: "",
                newSnippet: ""
            },
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
            },
            cost: {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            },
            duration: Date.now() - startTs
        };
    }
    // 3. REWRITE BLOCK (Prompt 2)
    const rewritePrompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].smartRewriteBlock({
        pointToInject,
        targetHtml: targetBlock.html,
        languageInstruction
    });
    const rewriteRes = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runText(rewritePrompt, 'FLASH');
    const totalUsage = {
        inputTokens: (findRes.usage?.inputTokens || 0) + (rewriteRes.usage?.inputTokens || 0),
        outputTokens: (findRes.usage?.outputTokens || 0) + (rewriteRes.usage?.outputTokens || 0),
        totalTokens: (findRes.usage?.totalTokens || 0) + (rewriteRes.usage?.totalTokens || 0)
    };
    const totalCost = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateCost"])(totalUsage, 'FLASH');
    return {
        data: {
            originalSnippet: targetBlock.html,
            newSnippet: rewriteRes.text?.trim() || targetBlock.html
        },
        usage: totalUsage,
        cost: totalCost.cost,
        duration: Date.now() - startTs
    };
};
}),
"[project]/src/services/generation/headingRefinerService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "refineHeadings",
    ()=>refineHeadings
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/aiService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$embeddingService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/embeddingService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptTemplates.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/schemaTypes.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/utils/logger.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
const cleanHeading = (s)=>(s || '').replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/["“”]/g, '').trim();
const fallbackHeading = (original)=>{
    const base = cleanHeading(original).replace(/[?？]+$/, '');
    if (!base) return '重點整理';
    if (base.length > 14) return `${base}重點`;
    return `${base}解析`;
};
const normalizeH3 = (list)=>{
    const normalized = Array.isArray(list) ? list.filter((h)=>h && (h.h3_before || h.h3_after || h.before || h.after)).map((h)=>{
        const h3Before = cleanHeading(h.h3_before || h.before || '');
        const h3AfterRaw = typeof h.h3_after === 'string' ? h.h3_after : h.after || h3Before;
        const h3After = cleanHeading(h3AfterRaw) || h3Before;
        const h3Reason = typeof h.h3_reason === 'string' ? h.h3_reason : typeof h.reason === 'string' ? h.reason : '';
        return {
            h3_before: h3Before,
            h3_after: h3After,
            ...h3Reason ? {
                h3_reason: h3Reason
            } : {}
        };
    }) : [];
    return normalized.length ? normalized : undefined;
};
const normalizeOptions = (input)=>{
    if (!Array.isArray(input)) return [];
    const seen = new Set();
    const options = [];
    input.forEach((raw)=>{
        const text = cleanHeading(typeof raw === 'string' ? raw : raw?.text);
        if (!text) return;
        const key = text.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        const reason = typeof raw?.reason === 'string' ? raw.reason.trim() : '';
        options.push({
            text,
            ...reason ? {
                reason
            } : {}
        });
    });
    return options;
};
const calculateBestOption = (h2Before, options, fallback, baseEmbedding, optionEmbeddings)=>{
    const beforeClean = cleanHeading(h2Before);
    const fallbackClean = cleanHeading(fallback) || beforeClean;
    if (!options.length) {
        return {
            text: fallbackClean,
            optionsWithScores: [],
            needsManual: true
        };
    }
    const scored = options.map((opt, idx)=>{
        const vec = optionEmbeddings[idx];
        const score = baseEmbedding && vec ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$embeddingService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cosineSimilarity"])(baseEmbedding, vec) : undefined;
        return {
            ...opt,
            score
        };
    });
    const valid = scored.filter((opt)=>opt.text && opt.text.toLowerCase() !== beforeClean.toLowerCase());
    const best = valid.reduce((acc, cur)=>{
        const currentScore = cur.score ?? -1;
        const accScore = acc?.score ?? -1;
        return currentScore > accScore ? cur : acc;
    }, null);
    if (!best) {
        return {
            text: fallbackClean,
            optionsWithScores: scored,
            needsManual: true
        };
    }
    const needsManual = (best.score ?? 0) > 0.995 || best.text.toLowerCase() === beforeClean.toLowerCase();
    return {
        text: best.text || fallbackClean,
        optionsWithScores: scored,
        needsManual
    };
};
const toCost = (cost)=>({
        inputCost: cost?.inputCost || 0,
        outputCost: cost?.outputCost || 0,
        totalCost: cost?.totalCost || 0
    });
const refineHeadings = async (articleTitle, headings, targetAudience)=>{
    const started = Date.now();
    const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(targetAudience);
    const BATCH_SIZE = 12;
    const mergeUsage = (a, b)=>({
            inputTokens: (a.inputTokens || 0) + (b.inputTokens || 0),
            outputTokens: (a.outputTokens || 0) + (b.outputTokens || 0),
            totalTokens: (a.totalTokens || 0) + (b.totalTokens || 0)
        });
    const mergeCost = (a, b)=>({
            inputCost: (a.inputCost || 0) + (b.inputCost || 0),
            outputCost: (a.outputCost || 0) + (b.outputCost || 0),
            totalCost: (a.totalCost || 0) + (b.totalCost || 0)
        });
    const refineBatch = async (batch)=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].log('refining_headings', `Refining ${batch.length} headings...`);
        const prompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].batchRefineHeadings({
            articleTitle,
            headings: batch,
            languageInstruction
        });
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runJson(prompt, 'FLASH', {
            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
            properties: {
                headings: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                    items: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
                        properties: {
                            h2_before: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                            },
                            h2_after: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                            },
                            h2_reason: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                            },
                            h2_options: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                                items: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
                                    properties: {
                                        text: {
                                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                        },
                                        reason: {
                                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                        }
                                    },
                                    required: [
                                        'text'
                                    ]
                                }
                            },
                            h3: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                                items: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
                                    properties: {
                                        h3_before: {
                                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                        },
                                        h3_after: {
                                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                        },
                                        h3_reason: {
                                            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                        }
                                    },
                                    required: [
                                        'h3_after'
                                    ]
                                }
                            }
                        },
                        required: [
                            'h2_before',
                            'h2_after',
                            'h2_options',
                            'h3'
                        ]
                    }
                }
            },
            required: [
                'headings'
            ]
        });
        const list = Array.isArray(response.data?.headings) ? response.data.headings : [];
        // 1. Prepare for Batch Embedding
        const allTextsToEmbed = [];
        const preparedItems = [];
        for(let idx = 0; idx < batch.length; idx++){
            const beforeRaw = batch[idx] || '';
            const before = cleanHeading(beforeRaw);
            const match = list.find((h)=>cleanHeading(h?.h2_before) === before || cleanHeading(h?.before) === before) || list[idx] || {};
            const h2Before = cleanHeading(match?.h2_before || match?.before || beforeRaw) || before;
            const options = normalizeOptions(match?.h2_options);
            const rawAfter = typeof match?.h2_after === 'string' ? match.h2_after : typeof match?.after === 'string' ? match.after : beforeRaw;
            const h3 = normalizeH3(Array.isArray(match?.h3) ? match.h3 : []);
            const h2Reason = typeof match?.h2_reason === 'string' ? match.h2_reason : typeof match?.reason === 'string' ? match.reason : '';
            // Record indices for embedding
            const baseIndex = allTextsToEmbed.length;
            allTextsToEmbed.push(h2Before);
            const optionIndices = options.map((opt)=>{
                const index = allTextsToEmbed.length;
                allTextsToEmbed.push(opt.text);
                return index;
            });
            preparedItems.push({
                before,
                h2Before,
                options,
                rawAfter,
                h3,
                h2Reason,
                baseIndex,
                optionIndices
            });
        }
        // 2. Execute Batch Embedding
        let allEmbeddings = [];
        if (allTextsToEmbed.length > 0) {
            try {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].log('refining_headings', `Batch embedding ${allTextsToEmbed.length} texts...`);
                allEmbeddings = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$embeddingService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["embedTexts"])(allTextsToEmbed);
            } catch (err) {
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$utils$2f$logger$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logger"].warn('refining_headings', 'Batch embedding failed', err);
            }
        }
        // 3. Process Results with Embeddings
        const results = preparedItems.map((item)=>{
            const { before, h2Before, options, rawAfter, h3, h2Reason, baseIndex, optionIndices } = item;
            const baseEmbedding = allEmbeddings[baseIndex];
            const optionEmbeddings = optionIndices.map((idx)=>allEmbeddings[idx]);
            const { text: picked, optionsWithScores, needsManual } = calculateBestOption(h2Before, options, rawAfter || before, baseEmbedding, optionEmbeddings);
            return {
                before,
                after: picked || h2Before,
                h2_before: h2Before,
                h2_after: picked,
                ...h2Reason ? {
                    h2_reason: h2Reason
                } : {},
                ...optionsWithScores.length ? {
                    h2_options: optionsWithScores
                } : {},
                ...h3 ? {
                    h3
                } : {},
                ...needsManual ? {
                    needs_manual: true
                } : {}
            };
        });
        return {
            data: results,
            usage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toTokenUsage"])(response.usage),
            cost: toCost(response.cost),
            duration: Date.now() - started
        };
    };
    if (headings.length <= BATCH_SIZE) {
        const single = await refineBatch(headings);
        return {
            ...single,
            duration: Date.now() - started
        };
    }
    let aggregatedResults = [];
    let totalUsage = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0
    };
    let totalCost = {
        inputCost: 0,
        outputCost: 0,
        totalCost: 0
    };
    for(let i = 0; i < headings.length; i += BATCH_SIZE){
        const slice = headings.slice(i, i + BATCH_SIZE);
        const batchRes = await refineBatch(slice);
        aggregatedResults = aggregatedResults.concat(batchRes.data || []);
        totalUsage = mergeUsage(totalUsage, batchRes.usage);
        totalCost = mergeCost(totalCost, batchRes.cost);
    }
    return {
        data: aggregatedResults,
        usage: totalUsage,
        cost: totalCost,
        duration: Date.now() - started
    };
};
}),
"[project]/src/services/engine/nlpService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "analyzeText",
    ()=>analyzeText
]);
const analyzeText = async (text)=>{
    if (!text || text.trim().length === 0) return [];
    // External NLP API Endpoint
    const TARGET_URL = 'https://nlp.award-seo.com/api/v1/tokenize';
    // CORS Proxy to bypass browser restrictions
    const PROXY_URL = 'https://corsproxy.io/?';
    try {
        const response = await fetch(PROXY_URL + encodeURIComponent(TARGET_URL), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                min_length: 2,
                stop_words: [] // Empty array as per requirement, can be populated if needed
            })
        });
        if (!response.ok) {
            console.warn('NLP API Error:', response.status, response.statusText);
            return [];
        }
        const json = await response.json();
        if (json.status === 'ok' && json.data && json.data.frequencies) {
            // Sort by count descending to get high-frequency words first
            // Filter out 1-character tokens generally, though API min_length handles most
            return json.data.frequencies.filter((f)=>f.token.length > 1).sort((a, b)=>b.count - a.count);
        }
        return [];
    } catch (error) {
        console.error("NLP Service Error:", error);
        return [];
    }
};
}),
"[project]/src/services/research/termUsagePlanner.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "extractSemanticKeywordsAnalysis",
    ()=>extractSemanticKeywordsAnalysis
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/constants.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptTemplates.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/aiService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/schemaTypes.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$p$2d$limit$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/p-limit/index.js [app-ssr] (ecmascript)"); // v6+ is pure ESM
;
;
;
;
;
// Helper to chunk array
const chunkArray = (array, size)=>{
    const chunked = [];
    for(let i = 0; i < array.length; i += size){
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
};
;
const extractSemanticKeywordsAnalysis = async (referenceContent, keywords, targetAudience)=>{
    const startTs = Date.now();
    // 1. Deduplicate keywords (Case-insensitive) to prevent processing duplicates
    const uniqueKeywordsMap = new Map();
    keywords.forEach((k)=>{
        const lower = (k.token || '').toLowerCase().trim();
        if (lower && !uniqueKeywordsMap.has(lower)) {
            uniqueKeywordsMap.set(lower, k);
        }
    });
    const uniqueKeywords = Array.from(uniqueKeywordsMap.values());
    // Take top keywords to avoid token limits (magic number tuned for speed/cost)
    const topKeywords = uniqueKeywords.slice(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$constants$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SEMANTIC_KEYWORD_LIMIT"]);
    const truncateSnippet = (text, maxLen = 160)=>text.length > maxLen ? `${text.slice(0, maxLen - 3)}...` : text;
    // Prepare snippets for ALL keywords first
    const allAnalysisPayloads = topKeywords.map((k)=>({
            word: k.token,
            snippets: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extractRawSnippets"])(referenceContent, k.token, 80).slice(0, 2).map((snippet)=>truncateSnippet(snippet))
        }));
    const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(targetAudience);
    // BATCHING STRATEGY:
    // Execute multiple batches in parallel but with a CONCURRENCY LIMIT
    // to prevent 429 errors or network timeouts.
    const BATCH_SIZE = 10;
    const CONCURRENCY_LIMIT = 2; // Slightly reduced for more stable proxy handling
    const limit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$p$2d$limit$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"])(CONCURRENCY_LIMIT);
    const batches = chunkArray(allAnalysisPayloads, BATCH_SIZE);
    console.log(`[SemanticKeywords] Processing ${allAnalysisPayloads.length} words in ${batches.length} batches (Concurrency: ${CONCURRENCY_LIMIT})...`);
    const batchPromises = batches.map((batchPayload, batchIdx)=>limit(async ()=>{
            // Breath delay: Space out batch starts by 1.2s to prevent spike failures
            const delayMs = batchIdx * 1200;
            if (delayMs > 0) {
                await new Promise((resolve)=>setTimeout(resolve, delayMs));
            }
            // Stringify the analysis payload for this batch
            const analysisPayloadString = JSON.stringify(batchPayload, null, 2);
            // Use the registry to build the prompt with snippet context
            const planPrompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].frequentWordsPlacementAnalysis({
                analysisPayloadString,
                languageInstruction
            });
            try {
                console.log(`[SemanticKeywords] Starting batch ${batchIdx + 1}/${batches.length}...`);
                const planRes = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runJson(planPrompt, 'FLASH', {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                    items: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
                        properties: {
                            word: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                            },
                            plan: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                                items: {
                                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                                }
                            },
                            exampleSentence: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                            },
                            isSentenceStart: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].BOOLEAN
                            },
                            isSentenceEnd: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].BOOLEAN
                            },
                            isPrefix: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].BOOLEAN
                            },
                            isSuffix: {
                                type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].BOOLEAN
                            }
                        },
                        required: [
                            "word",
                            "plan",
                            "exampleSentence"
                        ]
                    }
                });
                console.log(`[SemanticKeywords] Batch ${batchIdx + 1} Result:`, {
                    requested: batchPayload.length,
                    received: planRes.data?.length || 0,
                    duration: planRes.duration
                });
                if (!planRes.data || planRes.data.length === 0) {
                    console.warn(`[SemanticKeywords] Batch ${batchIdx + 1} returned NO data. Batch payload:`, batchPayload.map((p)=>p.word));
                    return {
                        data: [],
                        usage: planRes.usage,
                        cost: planRes.cost,
                        duration: planRes.duration
                    };
                }
                return {
                    data: planRes.data.map((p)=>({
                            ...p,
                            plan: Array.isArray(p.plan) ? p.plan : [
                                p.plan
                            ].filter(Boolean)
                        })),
                    usage: planRes.usage,
                    cost: planRes.cost,
                    duration: planRes.duration
                };
            } catch (e) {
                console.warn(`[SemanticKeywords] Batch ${batchIdx + 1} failed`, e);
                return {
                    data: [],
                    usage: {
                        inputTokens: 0,
                        outputTokens: 0,
                        totalTokens: 0
                    },
                    cost: {
                        inputCost: 0,
                        outputCost: 0,
                        totalCost: 0
                    },
                    duration: 0
                };
            }
        }));
    // Execute all batches with the limit
    const results = await Promise.all(batchPromises);
    // Merge results
    let mergedPlans = [];
    let totalUsage = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0
    };
    let totalCost = {
        inputCost: 0,
        outputCost: 0,
        totalCost: 0
    };
    results.forEach((res)=>{
        if (res.data) mergedPlans = mergedPlans.concat(res.data);
        if (res.usage) {
            totalUsage.inputTokens += res.usage.inputTokens || 0;
            totalUsage.outputTokens += res.usage.outputTokens || 0;
            totalUsage.totalTokens += res.usage.totalTokens || 0;
        }
        if (res.cost) {
            totalCost.inputCost += res.cost.inputCost || 0;
            totalCost.outputCost += res.cost.outputCost || 0;
            totalCost.totalCost += res.cost.totalCost || 0;
        }
    });
    // Map back to include snippets (using the original payloads)
    // Also final safety dedupe on the results
    const seenWords = new Set();
    const finalPlans = mergedPlans.reduce((acc, p)=>{
        const lower = (p.word || '').toLowerCase().trim();
        if (!lower || seenWords.has(lower)) return acc;
        seenWords.add(lower);
        const original = allAnalysisPayloads.find((ap)=>ap.word === p.word) || allAnalysisPayloads.find((ap)=>(ap.word || '').toLowerCase() === lower);
        acc.push({
            word: p.word,
            plan: p.plan || [],
            snippets: original ? original.snippets : [],
            exampleSentence: p.exampleSentence || '',
            isSentenceStart: !!p.isSentenceStart,
            isSentenceEnd: !!p.isSentenceEnd,
            isPrefix: !!p.isPrefix,
            isSuffix: !!p.isSuffix
        });
        return acc;
    }, []);
    return {
        data: finalPlans,
        usage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toTokenUsage"])(totalUsage),
        cost: totalCost,
        duration: Date.now() - startTs
    };
};
}),
"[project]/src/services/research/authorityService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "analyzeAuthorityTerms",
    ()=>analyzeAuthorityTerms
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/aiService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptTemplates.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/schemaTypes.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptService.ts [app-ssr] (ecmascript)");
;
;
;
;
const analyzeAuthorityTerms = async (authorityTerms, articleTitle, websiteType, targetAudience)=>{
    const startTs = Date.now();
    // Truncate authorityTerms to roughly 3000 chars to prevent timeout/overload
    const truncatedTerms = authorityTerms.length > 3000 ? authorityTerms.slice(0, 3000) + "...(truncated)" : authorityTerms;
    // Use the registry to build the prompt
    const languageInstruction = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLanguageInstruction"])(targetAudience);
    const prompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].authorityAnalysis({
        authorityTerms: truncatedTerms,
        title: articleTitle,
        websiteType,
        languageInstruction
    });
    try {
        const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runJson(prompt, 'FLASH', {
            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
            properties: {
                relevantTerms: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                    items: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                    },
                    description: "Filtered high-relevance authority terms"
                },
                combinations: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
                    items: {
                        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                    },
                    description: "Strategic ways to combine these terms"
                }
            },
            required: [
                "relevantTerms",
                "combinations"
            ]
        });
        return {
            data: response.data,
            usage: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toTokenUsage"])(response.usage),
            cost: response.cost,
            duration: response.duration
        };
    } catch (e) {
        console.error("Authority analysis failed", e);
        const usage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["toTokenUsage"])(e?.usage);
        return {
            data: {
                relevantTerms: [],
                combinations: []
            },
            usage,
            cost: {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            },
            duration: Date.now() - startTs
        };
    }
};
}),
"[project]/src/services/research/regionalAnalysisService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "analyzeRegionalTerms",
    ()=>analyzeRegionalTerms
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/aiService.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/promptTemplates.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/schemaTypes.ts [app-ssr] (ecmascript)");
;
;
;
const analyzeRegionalTerms = async (content, targetAudience)=>{
    // Safety check: if content is too short, skip
    if (!content || content.length < 50) {
        return {
            data: [],
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
            },
            cost: {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            },
            duration: 0
        };
    }
    const startTs = Date.now();
    const prompt = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$promptTemplates$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["promptTemplates"].regionalBrandAnalysis({
        content,
        targetAudience
    });
    // Use Gemini with Grounding enabled (if configured in aiService via 'FLASH' or specific model)
    // The prompt explicitly asks for "Use Google Search (Grounding)" which requires the model to have tools support 
    // or just relying on its internal knowledge if tools aren't active. 
    // Assuming 'FLASH' mapped to a model that supports this or the prompt is enough.
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runJson(prompt, 'FLASH', {
        type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].ARRAY,
        items: {
            type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].OBJECT,
            properties: {
                original: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                },
                replacement: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                },
                reason: {
                    type: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$schemaTypes$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Type"].STRING
                }
            },
            required: [
                "original",
                "replacement",
                "reason"
            ]
        }
    });
    return {
        data: response.data || [],
        usage: response.usage,
        cost: response.cost,
        duration: Date.now() - startTs
    };
};
}),
"[project]/src/services/generation/contentDisplayService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildTurboPlaceholder",
    ()=>buildTurboPlaceholder,
    "mergeTurboSections",
    ()=>mergeTurboSections
]);
const buildTurboPlaceholder = (sections, outlineSourceLabel)=>{
    const headerBanner = `> 📑 **Active Blueprint:** ${outlineSourceLabel}\n\n`;
    const placeholders = sections.map((s)=>`> ⏳ **Writing Section:** ${s.title}...`).join('\n\n');
    return headerBanner + placeholders;
};
const mergeTurboSections = (sections, sectionContents)=>{
    const placeholders = sections.map((s, idx)=>{
        const content = sectionContents[idx];
        if (content) return content;
        return `> ⏳ **Writing Section:** ${s.title}...`;
    }).join('\n\n');
    const headerBanner = `> 📑 **Active Blueprint:** Turbo Mode\n\n`;
    return headerBanner + placeholders;
};
}),
"[project]/src/services/research/regionGroundingService.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Region Grounding Service
 * Uses AI to validate and adapt content for the target market region
 * Supports: zh-TW (Taiwan), zh-HK (Hong Kong), zh-MY (Malaysia)
 */ __turbopack_context__.s([
    "detectForeignEntities",
    ()=>detectForeignEntities,
    "findRegionEquivalents",
    ()=>findRegionEquivalents,
    "getRegionLabel",
    ()=>getRegionLabel,
    "localizePlanWithAI",
    ()=>localizePlanWithAI,
    "rewriteForRegion",
    ()=>rewriteForRegion,
    "validateAndAdaptForRegion",
    ()=>validateAndAdaptForRegion
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/engine/aiService.ts [app-ssr] (ecmascript)");
;
const REGION_CONFIG = {
    'zh-TW': {
        name: '台灣',
        currency: 'NT$/新台幣',
        excludeRegions: [
            'HK',
            'CN',
            'MY'
        ],
        examples: [
            '蝦皮',
            'momo購物',
            '台北捷運',
            '健保',
            '高鐵',
            '全聯',
            '7-11'
        ]
    },
    'zh-HK': {
        name: '香港',
        currency: 'HKD/$港幣',
        excludeRegions: [
            'TW',
            'CN',
            'MY'
        ],
        examples: [
            'HKTVmall',
            '港鐵',
            'OK便利店',
            '八達通',
            '強積金'
        ]
    },
    'zh-MY': {
        name: '馬來西亞',
        currency: 'RM/馬幣',
        excludeRegions: [
            'TW',
            'HK',
            'CN'
        ],
        examples: [
            'Lazada',
            'Shopee',
            'Grab',
            'Touch \'n Go',
            'EPF'
        ]
    }
};
const getRegionLabel = (audience)=>{
    return REGION_CONFIG[audience]?.name || audience;
};
const detectForeignEntities = async (content, targetAudience)=>{
    const config = REGION_CONFIG[targetAudience];
    if (!config) {
        return {
            entities: [],
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
            },
            cost: {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            },
            duration: 0
        };
    }
    const prompt = `
你是一位${config.name}市場內容分析專家。請分析以下內容，找出所有非${config.name}本地的實體（品牌、機構、地點、服務、法規等）。

**目標市場：** ${config.name}
**貨幣：** ${config.currency}
**本地品牌範例：** ${config.examples.join('、')}

**分析標準：**
1. 其他地區特定實體（品牌、服務、機構）
2. 其他地區法規或政策
3. 其他地區貨幣表達
4. 其他地區地點引用（除非是一般地理描述）

**內容：**
${content.substring(0, 6000)}

**輸出 JSON 格式：**
{
  "entities": [
    { "text": "實體名稱", "type": "brand|service|location|regulation|currency", "region": "TW|HK|CN|MY|OTHER" }
  ]
}

只輸出 JSON，找不到就返回空陣列。`;
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runJson(prompt, 'FLASH');
    // Filter out entities that belong to the target region
    const foreignEntities = (response.data.entities || []).filter((e)=>config.excludeRegions.includes(e.region) || e.region === 'OTHER');
    return {
        entities: foreignEntities,
        usage: response.usage,
        cost: response.cost,
        duration: response.duration
    };
};
const findRegionEquivalents = async (entities, targetAudience)=>{
    const config = REGION_CONFIG[targetAudience];
    if (entities.length === 0 || !config) {
        return {
            mappings: [],
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
            },
            cost: {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            },
            duration: 0
        };
    }
    // Process ALL entities in a single grounding call (no limit)
    const entityList = entities.map((e)=>`- ${e.text} (${e.type})`).join('\n');
    const prompt = `
你是一位${config.name}市場專家。請為以下非${config.name}實體找出${config.name}適合的替代選項。

**需要查找替代的實體：**
${entityList}

**替代選項優先順序（請依序嘗試）：**
1. **直接對應** - ${config.name}市場中功能相同的品牌/服務（如：台灣「全聯」→ 香港「百佳/惠康」）
2. **同類替代** - 同品類中${config.name}較知名的品牌（如：台灣服裝品牌 → 任何香港知名服裝品牌）
3. **通用描述** - 如果找不到具體品牌，使用通用描述（如：「韌 REN」→「本地運動服飾品牌」或「知名運動服裝店」）
4. **刪除** - 只有在完全無法描述時才使用「[刪除]」

**重要規則：**
- 盡量提供替代，不要輕易使用「[刪除]」
- 通用描述也是可接受的替代（如「大型藥妝連鎖店」、「本地電商平台」）
- 每個輸入的實體都必須有一個對應的輸出`;
    // Schema for structured output
    const schema = {
        type: 'object',
        properties: {
            mappings: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        type: {
                            type: 'string',
                            description: 'entity|brand|regulation|currency|location|service'
                        },
                        original: {
                            type: 'string',
                            description: '原實體名稱'
                        },
                        regionEquivalent: {
                            type: 'string',
                            description: `${config.name}對應的真實品牌/服務名稱，如找不到則填 "[刪除]"`
                        },
                        confidence: {
                            type: 'number',
                            description: '0.0-1.0 置信度'
                        },
                        context: {
                            type: 'string',
                            description: '說明為何這是合適的替代，或為何建議刪除'
                        },
                        sourceRegion: {
                            type: 'string',
                            description: '來源地區'
                        }
                    },
                    required: [
                        'original',
                        'regionEquivalent',
                        'context'
                    ]
                }
            }
        },
        required: [
            'mappings'
        ]
    };
    // Use runJsonWithSearch with schema for stable structured output
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runJsonWithSearch(prompt, 'FLASH', schema);
    // Ensure ALL input entities have a mapping
    const aiMappings = response.data.mappings || [];
    const finalMappings = entities.map((entity)=>{
        const found = aiMappings.find((m)=>m.original === entity.text);
        if (found) {
            // Convert "[刪除]" to empty string for actual deletion
            return {
                ...found,
                regionEquivalent: found.regionEquivalent === '[刪除]' ? '' : found.regionEquivalent
            };
        }
        // If AI didn't return this entity, create empty replacement (for deletion)
        return {
            type: entity.type,
            original: entity.text,
            regionEquivalent: '',
            confidence: 0,
            context: '未找到合適替代，建議從內容中移除',
            sourceRegion: entity.region
        };
    });
    return {
        mappings: finalMappings,
        usage: response.usage,
        cost: response.cost,
        duration: response.duration
    };
};
const rewriteForRegion = async (content, mappings, targetAudience)=>{
    const config = REGION_CONFIG[targetAudience];
    if (mappings.length === 0 || !config) {
        return {
            rewrittenContent: content,
            changes: [],
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
            },
            cost: {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            },
            duration: 0
        };
    }
    const mappingInstructions = mappings.map((m)=>`- 「${m.original}」→「${m.regionEquivalent}」：${m.context}`).join('\n');
    const prompt = `
你是一位${config.name}市場內容編輯專家。請根據以下替換指引，改寫內容使其適合${config.name}讀者。

**替換指引：**
${mappingInstructions}

**改寫規則：**
1. 保持原文語意和結構
2. 只替換指定的實體，其他內容保持不變
3. 確保替換後的句子通順自然
4. 如果某處替換會造成語意不通，可以適度調整上下文

**原始內容：**
${content.substring(0, 8000)}

**輸出 JSON 格式：**
{
  "rewrittenContent": "改寫後的完整內容",
  "changes": [
    { "original": "原句子", "rewritten": "改寫後句子" }
  ]
}

只輸出 JSON。`;
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runJson(prompt, 'FLASH');
    return {
        rewrittenContent: response.data.rewrittenContent || content,
        changes: response.data.changes || [],
        usage: response.usage,
        cost: response.cost,
        duration: response.duration
    };
};
const validateAndAdaptForRegion = async (content, targetAudience)=>{
    const config = REGION_CONFIG[targetAudience];
    const regionName = config?.name || targetAudience;
    const startTime = Date.now();
    let totalUsage = {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0
    };
    let totalCost = {
        inputCost: 0,
        outputCost: 0,
        totalCost: 0
    };
    // Step 1: Detect foreign entities
    const detectResult = await detectForeignEntities(content, targetAudience);
    totalUsage.inputTokens += detectResult.usage.inputTokens;
    totalUsage.outputTokens += detectResult.usage.outputTokens;
    totalUsage.totalTokens += detectResult.usage.totalTokens;
    totalCost.inputCost += detectResult.cost.inputCost;
    totalCost.outputCost += detectResult.cost.outputCost;
    totalCost.totalCost += detectResult.cost.totalCost;
    console.log(`[RegionGrounding] Detected ${detectResult.entities.length} foreign entities for ${regionName}`);
    if (detectResult.entities.length === 0) {
        return {
            result: {
                isRegionRelevant: true,
                relevanceScore: 100,
                issues: [],
                suggestions: []
            },
            rewrittenContent: content,
            usage: totalUsage,
            cost: totalCost,
            duration: Date.now() - startTime
        };
    }
    // Step 2: Find regional equivalents
    const groundingResult = await findRegionEquivalents(detectResult.entities, targetAudience);
    totalUsage.inputTokens += groundingResult.usage.inputTokens;
    totalUsage.outputTokens += groundingResult.usage.outputTokens;
    totalUsage.totalTokens += groundingResult.usage.totalTokens;
    totalCost.inputCost += groundingResult.cost.inputCost;
    totalCost.outputCost += groundingResult.cost.outputCost;
    totalCost.totalCost += groundingResult.cost.totalCost;
    console.log(`[RegionGrounding] Found ${groundingResult.mappings.length} ${regionName} equivalents`);
    // Step 3: Rewrite content if we have mappings
    let finalContent = content;
    let changes = [];
    if (groundingResult.mappings.length > 0) {
        const rewriteResult = await rewriteForRegion(content, groundingResult.mappings, targetAudience);
        finalContent = rewriteResult.rewrittenContent;
        changes = rewriteResult.changes;
        totalUsage.inputTokens += rewriteResult.usage.inputTokens;
        totalUsage.outputTokens += rewriteResult.usage.outputTokens;
        totalUsage.totalTokens += rewriteResult.usage.totalTokens;
        totalCost.inputCost += rewriteResult.cost.inputCost;
        totalCost.outputCost += rewriteResult.cost.outputCost;
        totalCost.totalCost += rewriteResult.cost.totalCost;
    }
    // Calculate relevance score
    const totalEntities = detectResult.entities.length;
    const resolvedEntities = groundingResult.mappings.filter((m)=>m.confidence > 0.7).length;
    const relevanceScore = Math.round(resolvedEntities / Math.max(1, totalEntities) * 100);
    return {
        result: {
            isRegionRelevant: detectResult.entities.length === 0 || relevanceScore >= 80,
            relevanceScore: Math.max(0, Math.min(100, 100 - (totalEntities - resolvedEntities) * 10)),
            issues: groundingResult.mappings,
            suggestions: changes
        },
        rewrittenContent: finalContent,
        usage: totalUsage,
        cost: totalCost,
        duration: Date.now() - startTime
    };
};
const localizePlanWithAI = async (data, replacements, targetAudience)=>{
    const config = REGION_CONFIG[targetAudience];
    if (!config || replacements.length === 0) {
        return {
            localizedGeneralPlan: data.generalPlan,
            localizedConversionPlan: data.conversionPlan,
            localizedSections: data.sections,
            usage: {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0
            },
            cost: {
                inputCost: 0,
                outputCost: 0,
                totalCost: 0
            },
            duration: 0
        };
    }
    // Build replacement instructions
    const replacementGuide = replacements.map((r)=>r.replacement ? `- 「${r.original}」→「${r.replacement}」${r.reason ? `（${r.reason}）` : ''}` : `- 「${r.original}」→ 刪除此詞，重寫相關句子使其通順`).join('\n');
    // Serialize plans for AI
    const plansJson = JSON.stringify({
        generalPlan: data.generalPlan,
        conversionPlan: data.conversionPlan,
        sections: data.sections.map((s)=>({
                title: s.title,
                narrativePlan: s.narrativePlan || [],
                keyFacts: s.keyFacts || [],
                uspNotes: s.uspNotes || [],
                subheadings: s.subheadings || []
            }))
    }, null, 2);
    const prompt = `
你是一位${config.name}市場內容本地化專家。請將以下段落計劃進行本地化改寫，使其完全適合${config.name}讀者。

**本地化替換指引：**
${replacementGuide}

**原始段落計劃：**
${plansJson}

**本地化規則：**
1. 應用上述替換指引，將非${config.name}的品牌/服務/實體替換為適當的替代
2. 如果替換後句子不通順，請適度改寫使其自然
3. 如果某詞需要刪除，請重寫該句子使其意思完整，不要留下空白
4. 保持原有的結構和格式（數組、標題等）
5. 對於 generalPlan 和 conversionPlan，確保策略仍然適用於${config.name}市場

**請輸出 JSON，格式與輸入相同：**
{
  "generalPlan": ["本地化後的策略..."],
  "conversionPlan": ["本地化後的轉換策略..."],
  "sections": [
    {
      "title": "本地化後的標題",
      "narrativePlan": ["本地化後的敘事計劃..."],
      "keyFacts": ["本地化後的關鍵事實..."],
      "uspNotes": ["本地化後的賣點..."],
      "subheadings": ["本地化後的子標題..."]
    }
  ]
}

只輸出 JSON，不要其他文字。`;
    const schema = {
        type: 'object',
        properties: {
            generalPlan: {
                type: 'array',
                items: {
                    type: 'string'
                }
            },
            conversionPlan: {
                type: 'array',
                items: {
                    type: 'string'
                }
            },
            sections: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string'
                        },
                        narrativePlan: {
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        },
                        keyFacts: {
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        },
                        uspNotes: {
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        },
                        subheadings: {
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        }
                    }
                }
            }
        },
        required: [
            'generalPlan',
            'conversionPlan',
            'sections'
        ]
    };
    const response = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$engine$2f$aiService$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["aiService"].runJson(prompt, 'FLASH', schema);
    return {
        localizedGeneralPlan: response.data.generalPlan || data.generalPlan,
        localizedConversionPlan: response.data.conversionPlan || data.conversionPlan,
        localizedSections: response.data.sections || data.sections,
        usage: response.usage,
        cost: response.cost,
        duration: response.duration
    };
};
}),
];

//# sourceMappingURL=src_services_9bbf9769._.js.map