import { postJson } from './config.js';

/**
 * Vision API - Analyze images with AI
 * 
 * This example demonstrates how to use the /ai/vision endpoint
 * to analyze images from various sources (base64, URL, data URL)
 */

async function main() {
    console.log('🔍 Vision API Example\n');

    // Example 1: Analyze image from URL
    console.log('1️⃣  Analyzing image from URL...');
    const urlResult = await postJson<{
        text: string;
        usage: { inputTokens: number; outputTokens: number; totalTokens: number };
        finishReason: string;
    }>('/ai/vision', {
        prompt: 'Describe this image in detail.',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/300px-Cat03.jpg',
        model: 'gemini-2.5-flash',
    });

    console.log('Response:', urlResult.text);
    console.log('Tokens:', urlResult.usage.totalTokens, '\n');

    // Example 2: Analyze base64 image (1x1 red pixel)
    console.log('2️⃣  Analyzing base64 image...');
    const base64Result = await postJson<{
        text: string;
        usage: { inputTokens: number; outputTokens: number; totalTokens: number };
    }>('/ai/vision', {
        prompt: 'What color is this image?',
        image: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        model: 'gemini-2.5-flash',
    });

    console.log('Response:', base64Result.text);
    console.log('Tokens:', base64Result.usage.totalTokens, '\n');

    // Example 3: SEO use case - Generate alt text
    console.log('3️⃣  Generating SEO alt text...');
    const seoResult = await postJson<{
        text: string;
    }>('/ai/vision', {
        prompt: 'Generate a concise, SEO-friendly alt text for this image (max 125 characters).',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/300px-Cat03.jpg',
    });

    console.log('Alt text:', seoResult.text, '\n');

    console.log('✅ All examples completed!');
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
