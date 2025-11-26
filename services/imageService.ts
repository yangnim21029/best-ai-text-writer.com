
import { ServiceResponse, ScrapedImage, TargetAudience, ImageAssetPlan } from '../types';
import { calculateCost, getLanguageInstruction } from './promptService';
import { generateContent } from './ai';
import { Type } from "@google/genai";

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

// NEW: Analyze and Define Global Visual Identity
export const analyzeVisualStyle = async (
    scrapedImages: ScrapedImage[],
    websiteType: string
): Promise<ServiceResponse<string>> => {
    const startTs = Date.now();

    const analyzedSamples = scrapedImages
        .filter(img => img.aiDescription)
        .slice(0, 5)
        .map(img => img.aiDescription)
        .join("\n---\n");

    const prompt = `
    I need to define a consistent "Visual Identity" (Master Style Prompt) for an article.
    
    WEBSITE CONTEXT: "${websiteType}"
    
    SOURCE IMAGE DESCRIPTIONS (from the brand's website):
    ${analyzedSamples.length > 0 ? analyzedSamples : "No source images available. Infer style strictly from Website Context."}

    TASK:
    Synthesize a **single, cohesive Visual Style Description** that I can append to every image prompt to ensure consistency.
    
    Include:
    1. **Color Palette:** (e.g., "Medical Blue #0055FF and Clean White", or "Warm Earth Tones")
    2. **Lighting/Mood:** (e.g., "Soft bright studio lighting", "Moody natural light", "Flat vector lighting")
    3. **Art Medium:** (e.g., "High-resolution Photography", "Minimalist 2D Vector Art", "3D Product Render")
    
    OUTPUT FORMAT:
    Return ONLY the style description string (max 30 words).
    Example: "Photorealistic style with soft daylight, using a clinical white and teal palette, high-end commercial aesthetic."
    `;

    try {
        const response = await generateContent('gemini-2.5-flash', prompt);

        const metrics = calculateCost(response.usageMetadata, 'FLASH');
        return {
            data: response.text?.trim() || "Clean, modern professional photography with natural lighting.",
            ...metrics,
            duration: Date.now() - startTs
        };
    } catch (e) {
        console.error("Visual Style Analysis failed", e);
        return {
            data: "Clean, modern professional photography with natural lighting.",
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: Date.now() - startTs
        };
    }
};

export const generateImagePromptFromContext = async (
    contextText: string,
    targetAudience: TargetAudience,
    visualStyle: string = ""
): Promise<ServiceResponse<string>> => {
    const startTs = Date.now();
    const languageInstruction = getLanguageInstruction(targetAudience);

    const prompt = `
    Based on the following text snippet, generate a specific image prompt.
    
    CONTENT SNIPPET: "...${contextText}..."
    
    GLOBAL VISUAL STYLE (Must Apply): "${visualStyle}"
    
    ${VISUAL_STYLE_GUIDE}
    
    ${languageInstruction}

    TASK: 
    1. Analyze the snippet to decide which Category (1-4) fits best.
    2. Write a concise prompt describing the subject.
    3. **CRITICAL:** Append the GLOBAL VISUAL STYLE to the prompt.
    
    Output Format: Just the prompt text.
    `;

    const response = await generateContent('gemini-2.5-flash', prompt);

    const metrics = calculateCost(response.usageMetadata, 'FLASH');

    return {
        data: response.text?.trim() || "",
        ...metrics,
        duration: Date.now() - startTs
    };
};

export const generateImage = async (prompt: string): Promise<ServiceResponse<string | null>> => {
    const startTs = Date.now();

    try {
        // Updated to use Gemini 3 Pro Image Preview (Nano Banana Pro) for higher quality
        const response = await generateContent(
            'gemini-3-pro-image-preview',
            { parts: [{ text: prompt }] },
            {
                imageConfig: {
                    aspectRatio: "16:9",
                    imageSize: "1K"
                }
            }
        );

        let imageData = null;
        // The proxy returns { text, usageMetadata } but for images, the text might be empty or data might be elsewhere?
        // Wait, my proxy extracts `response.text()`.
        // For Image Generation, the `text()` method usually returns nothing or metadata.
        // I need to check how `generateContent` returns images in the new SDK.
        // In the new SDK, images are in `candidates[0].content.parts[].inlineData`.
        // My proxy `api/generate.js` only returns `text`.
        // I need to update the proxy to return the full response or handle images.

        // Let's assume for now that I need to fix the proxy to return `candidates` if `text` is empty.
        // But I can't fix the proxy in this file.
        // I will assume the proxy returns `text` which might contain the base64 if I adjust the proxy?
        // No, `response.text()` only returns text parts.

        // FIX: I need to update `api/generate.js` to return `candidates` or handle images.
        // Since I already wrote `api/generate.js`, I should update it to return more data.
        // But for this file, I will write the code assuming `generateContent` returns the raw response structure if I modify `ai.ts`.
        // Actually, `ai.ts` returns `{ text, usageMetadata }`.
        // I should update `ai.ts` and `api/generate.js` to return the full `candidates` array.

        // For now, I will comment out the image extraction logic and assume `response.text` contains the base64 string if I change the proxy to return it.
        // But standard `text()` doesn't return image data.

        // TEMPORARY FIX: Return null for image generation until proxy is updated.
        // Or better, I will update `api/generate.js` in the next step to return `candidates`.

        // Let's write the code assuming `response.candidates` will be available in the returned object from `generateContent`.
        // I will update `ai.ts` to return `candidates`.

        const candidates = (response as any).candidates;
        if (candidates && candidates[0]?.content?.parts) {
            for (const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    imageData = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
                }
            }
        }

        const metrics = calculateCost(response.usageMetadata, 'IMAGE_GEN');

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
const convertSvgToPng = (svgBlob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();

        img.onload = () => {
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

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Failed to load SVG image"));
        };

        img.src = url;
    });
};

function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result?.toString().split(',')[1] || '');
        reader.readAsDataURL(blob);
    });
}

// NEW: Analyze Image from URL (Image Understanding)
export const analyzeImageWithAI = async (imageUrl: string): Promise<ServiceResponse<string>> => {
    const startTs = Date.now();
    const PROXY = "https://corsproxy.io/?";

    try {
        // 1. Fetch Image via Proxy to avoid CORS
        const response = await fetch(PROXY + encodeURIComponent(imageUrl));
        if (!response.ok) throw new Error("Failed to fetch image");

        const blob = await response.blob();

        let base64 = "";
        let mimeType = blob.type;

        if (
            blob.type.includes('svg') ||
            blob.type.includes('xml') ||
            imageUrl.toLowerCase().endsWith('.svg')
        ) {
            try {
                base64 = await convertSvgToPng(blob);
                mimeType = "image/png";
            } catch (svgError) {
                console.warn("SVG Conversion failed", svgError);
                return {
                    data: "Skipped: SVG/Vector image not supported/convertible.",
                    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
                    cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
                    duration: Date.now() - startTs
                };
            }
        } else {
            base64 = await blobToBase64(blob);
        }

        // 2. Send to Gemini (Multimodal)
        const result = await generateContent(
            'gemini-2.5-flash',
            [
                { text: "Describe this image in detail for SEO purposes. Focus on the main subject, mood, and any visible text." },
                { inlineData: { mimeType: mimeType, data: base64 } }
            ]
        );

        const metrics = calculateCost(result.usageMetadata, 'FLASH');
        return {
            data: result.text || "No description generated.",
            ...metrics,
            duration: Date.now() - startTs
        };

    } catch (e) {
        console.warn("Image Analysis Failed", e);
        return {
            data: "Analysis failed (Format or Network error)",
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: Date.now() - startTs
        };
    }
};

// NEW: Plan images for the entire article with Visual Style injection
export const planImagesForArticle = async (
    articleContent: string,
    scrapedImages: ScrapedImage[],
    targetAudience: TargetAudience,
    visualStyle: string = ""
): Promise<ServiceResponse<ImageAssetPlan[]>> => {
    const startTs = Date.now();
    const languageInstruction = getLanguageInstruction(targetAudience);

    const maxImages = scrapedImages.length > 0 ? scrapedImages.length + 1 : 2;

    const imageContexts = scrapedImages.slice(0, 30).map(img => ({
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
    4. **Unified Style:** In the 'generatedPrompt', you MUST Explicitly describe how the "Global Visual Style" applies to this specific subject. (e.g. "An infographic about X, using the [Global Style] color palette...")

    ARTICLE CONTENT:
    ${articleContent.substring(0, 20000)}

    SOURCE IMAGES (Analyzed Reference):
    ${JSON.stringify(imageContexts)}
    `;

    try {
        const response = await generateContent(
            'gemini-2.5-flash',
            prompt,
            {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        plans: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    generatedPrompt: { type: Type.STRING, description: "Detailed prompt including subject + visual style + mood." },
                                    category: { type: Type.STRING, enum: ["INFOGRAPHIC", "BRANDED_LIFESTYLE", "PRODUCT_INFOGRAPHIC", "ECOMMERCE_WHITE_BG"] },
                                    insertAfter: { type: Type.STRING },
                                    rationale: { type: Type.STRING }
                                }
                            }
                        }
                    }
                }
            }
        );

        const result = JSON.parse(response.text || "{}");
        const plans: any[] = result.plans || [];

        const finalPlans: ImageAssetPlan[] = plans.map((p: any, index: number) => ({
            id: `plan-${Date.now()}-${index}`,
            generatedPrompt: p.generatedPrompt,
            insertAfter: p.insertAfter,
            status: 'idle'
        }));

        const metrics = calculateCost(response.usageMetadata, 'FLASH');

        return {
            data: finalPlans,
            ...metrics,
            duration: Date.now() - startTs
        };

    } catch (e) {
        console.error("Image Planning failed", e);
        return { data: [], usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: Date.now() - startTs };
    }
};