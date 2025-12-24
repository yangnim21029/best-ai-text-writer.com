import 'server-only';
import { ServiceResponse, ScrapedImage, TargetAudience, ImageAssetPlan } from '../../types';
import { calculateCost, getLanguageInstruction } from '../engine/promptService';
import { aiService } from '../engine/aiService';
import { Type } from '../engine/schemaTypes';
import { promptTemplates } from '../engine/promptTemplates';
import { MODEL } from '../../config/constants';
import { buildAiUrl, getAiHeaders } from '../engine/genAIClient';

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

const ensureDataUrl = (value: string, mimeType = 'image/png'): string | null => {
  if (!value) return null;
  if (value.startsWith('data:') || value.startsWith('http')) return value;
  return `data:${mimeType};base64,${value}`;
};

const asArray = (value: any): any[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const pickFromImageLike = (input: any, fallbackMime?: string): string | null => {
  if (!input) return null;
  if (typeof input === 'string') return ensureDataUrl(input, fallbackMime || 'image/png');

  if (input.inlineData?.data) {
    return ensureDataUrl(input.inlineData.data, input.inlineData.mimeType || fallbackMime);
  }

  const directData =
    input.b64_json || input.base64 || input.base64Data || input.data || input.image;
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

const extractFromCandidates = (candidates: any[] | undefined): string | null => {
  if (!Array.isArray(candidates)) return null;
  for (const candidate of candidates) {
    const parts = candidate?.content?.parts;
    if (Array.isArray(parts)) {
      for (const part of parts) {
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

const extractImagePayload = (payload: any): string | null => {
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
    payload.result,
  ];

  for (const collection of collections) {
    for (const entry of asArray(collection)) {
      const found = pickFromImageLike(entry, payload?.mimeType || payload?.mediaType);
      if (found) return found;
    }
  }

  if (payload.result?.image) return ensureDataUrl(payload.result.image);
  return null;
};

// NEW: Analyze Image with AI (Vision)
export const analyzeImageWithAI = async (
  imageUrl: string,
  prompt: string = 'Describe this image in detail.',
  model: string = MODEL.FLASH
): Promise<ServiceResponse<string>> => {
  const startTs = Date.now();

  try {
    const response = await fetch(buildAiUrl('/vision'), {
      method: 'POST',
      headers: getAiHeaders(),
      body: JSON.stringify({
        prompt,
        image: imageUrl,
        model,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vision API request failed (${response.status}): ${errorText}`);
    }

    const result = (await response.json()) as {
      text: string;
      usage?: { inputTokens: number; outputTokens: number; totalTokens: number };
      finishReason?: string;
    };

    const duration = Date.now() - startTs;
    const modelType = model.includes('flash') ? 'FLASH' : 'FLASH';
    const metrics = calculateCost(result, modelType);

    return {
      data: result.text,
      ...metrics,
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTs;
    throw new Error(
      `Failed to analyze image: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

// NEW: Analyze and Define Global Visual Identity
export const analyzeVisualStyle = async (
  scrapedImages: ScrapedImage[],
  websiteType: string
): Promise<ServiceResponse<string>> => {
  const startTs = Date.now();

  const analyzedSamples = scrapedImages
    .filter((img) => img.aiDescription)
    .slice(0, 5)
    .map((img) => img.aiDescription)
    .join('\n---\n');

  const prompt = promptTemplates.visualStyle({
    languageInstruction: getLanguageInstruction('zh-TW'),
    analyzedSamples,
    websiteType,
  });

  try {
    const response = await aiService.runText(prompt, 'FLASH');

    return {
      data: response.text,
      usage: response.usage,
      cost: response.cost,
      duration: response.duration,
    };
  } catch (e) {
    console.error('Visual Style Analysis failed', e);
    return {
      data: 'Clean, modern professional photography with natural lighting.',
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
      duration: Date.now() - startTs,
    };
  }
};

export const generateImagePromptFromContext = async (
  contextText: string,
  targetAudience: TargetAudience,
  visualStyle: string = '',
  modelAppearance: string = ''
): Promise<ServiceResponse<string[]>> => {
  const startTs = Date.now();
  const languageInstruction = getLanguageInstruction(targetAudience);

  const prompt = promptTemplates.imagePromptFromContext({
    contextText,
    languageInstruction,
    visualStyle,
    guide: VISUAL_STYLE_GUIDE,
    modelAppearance,
  });

  try {
    const response = await aiService.runJson<string[]>(prompt, 'FLASH', {
      schema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      promptId: 'image_prompt_gen',
    });
    return {
      data: Array.isArray(response.data) ? response.data : [],
      usage: response.usage,
      cost: response.cost,
      duration: Date.now() - startTs,
    };
  } catch (e) {
    console.error('Multi-prompt generation failed, falling back to text', e);
    const fallbackRes = await aiService.runText(prompt, 'FLASH');
    return {
      data: [fallbackRes.text],
      usage: fallbackRes.usage,
      cost: fallbackRes.cost,
      duration: Date.now() - startTs,
    };
  }
};

export const generateImage = async (prompt: string): Promise<ServiceResponse<string | null>> => {
  const startTs = Date.now();

  try {
    const response = await fetch(buildAiUrl('/image'), {
      method: 'POST',
      headers: getAiHeaders(),
      body: JSON.stringify({
        prompt,
        model: MODEL.IMAGE_PREVIEW,
        aspectRatio: '16:9',
      }),
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
      let detail: any = '{}';
      let rawText = '';
      try {
        rawText = await response.text();
        try {
          detail = JSON.parse(rawText);
        } catch {
          detail = rawText; // Fallback to raw text if not JSON
        }
      } catch (e) {
        console.error('[imageService] Failed to read error response text', e);
      }

      const message =
        typeof detail === 'string'
          ? detail
          : detail?.message || detail?.error || JSON.stringify(detail);

      console.error(
        `[imageService] Generation failed (URL: ${buildAiUrl('/image')}) [${response.status} ${response.statusText
        }]:`,
        { detail, rawText }
      );

      throw new Error(
        `Image generation failed (${response.status} ${response.statusText}): ${message}`
      );
    }

    const payload = isJson ? await response.json() : { image: await response.text() };
    const imageData = extractImagePayload(payload);

    // Ensure payload is treated as object for calculateCost
    const usageData =
      payload && typeof payload === 'object'
        ? payload.totalUsage ||
        payload.usageMetadata ||
        payload.usage ||
        payload.metadata?.usage ||
        {}
        : {};

    const metrics = calculateCost(usageData, 'IMAGE_GEN');

    return {
      data: imageData,
      ...metrics,
      duration: Date.now() - startTs,
    };
  } catch (e) {
    console.error('Image generation failed', e);
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
          reject(new Error('Canvas context not available'));
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
      reject(new Error('Failed to load SVG image'));
    };

    img.src = url;
  });
};

// NEW: Plan images for the entire article with Visual Style injection
export const planImagesForArticle = async (
  articleContent: string,
  scrapedImages: ScrapedImage[],
  targetAudience: TargetAudience,
  visualStyle: string = ''
): Promise<ServiceResponse<ImageAssetPlan[]>> => {
  const startTs = Date.now();
  const languageInstruction = getLanguageInstruction(targetAudience);

  const paragraphCount = articleContent.split(/\n\s*\n/).filter((p) => p.trim().length > 50).length;
  // Rule: 1-2 images per paragraph.
  // We set a loose upper limit (2 per paragraph) + some buffer or existing scraped images count.
  const densityBasedMax = Math.max(2, paragraphCount * 2);
  const maxImages = Math.max(densityBasedMax, scrapedImages.length + 2);

  const imageContexts = scrapedImages.slice(0, 30).map((img) => ({
    alt: img.altText,
    aiAnalysis: img.aiDescription || 'N/A',
  }));

  const prompt = promptTemplates.visualAssetPlanning({
    visualStyle,
    visualStyleGuide: VISUAL_STYLE_GUIDE,
    maxImages,
    languageInstruction,
    articleContent,
    imageContexts,
  });

  try {
    const response = await aiService.runJson<any>(prompt, 'FLASH', {
      schema: {
        type: Type.OBJECT,
        properties: {
          plans: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                generatedPrompt: {
                  type: Type.STRING,
                  description: 'Detailed prompt including subject + visual style + mood.',
                },
                category: {
                  type: Type.STRING,
                  enum: [
                    'BRANDED_LIFESTYLE',
                    'PRODUCT_DETAIL',
                    'INFOGRAPHIC',
                    'PRODUCT_INFOGRAPHIC',
                    'ECOMMERCE_WHITE_BG',
                  ],
                },
                insertAfter: { type: Type.STRING },
                rationale: { type: Type.STRING },
              },
              required: ['generatedPrompt', 'category', 'insertAfter'],
            },
          },
        },
        required: ['plans'],
      },
      promptId: 'visual_asset_planning',
    });

    const plans: any[] = response.data.plans || [];

    const finalPlans: ImageAssetPlan[] = plans.map((p: any, index: number) => ({
      id: `plan-${Date.now()}-${index}`,
      category: p.category,
      generatedPrompt: p.generatedPrompt,
      insertAfter: p.insertAfter,
      status: 'idle',
    }));

    return {
      data: finalPlans,
      usage: response.usage,
      cost: response.cost,
      duration: response.duration,
    };
  } catch (e) {
    console.error('Image Planning failed', e);
    return {
      data: [],
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
      duration: Date.now() - startTs,
    };
  }
};
