import { readUIMessageStream } from 'ai';

/**
 * Minimal frontend-friendly example for /ai/stream (no schema).
 * The backend now returns a Vercel UI message stream (SSE).
 * Usage is exposed on the final message metadata: metadata.totalUsage/usage.
 */

const extractMessageText = (message: any): string => {
    const content = message?.content;
    if (typeof content === 'string') return content;
    if (Array.isArray(content)) {
        return content
            .map((part: any) => {
                if (typeof part === 'string') return part;
                if (typeof part?.text === 'string') return part.text;
                if (typeof part?.value === 'string') return part.value;
                return '';
            })
            .filter(Boolean)
            .join('');
    }
    return '';
};

export const streamPlainText = async (prompt: string) => {
    const res = await fetch('/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
    });

    if (!res.ok || !res.body) {
        const detail = await res.text();
        throw new Error(`Stream failed (${res.status}): ${detail}`);
    }

    let lastMessage: any = null;
    let printed = '';

    // readUIMessageStream handles the SSE parsing for the UI message stream
    for await (const message of readUIMessageStream({ stream: res.body as any })) {
        lastMessage = message;
        const text = extractMessageText(message) || '';
        const nextChunk = text.slice(printed.length);
        if (nextChunk) {
            // Append new delta to your UI/output
            console.log(nextChunk);
            printed = text;
        }
    }

    const usage = lastMessage?.metadata?.totalUsage || lastMessage?.metadata?.usage;
    console.log('Total usage:', usage ?? 'n/a');
};
