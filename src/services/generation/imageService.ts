import 'server-only';
import { z } from 'zod';
import { ServiceResponse, ScrapedImage, TargetAudience, ImageAssetPlan } from '../../types';
import { calculateCost, getLanguageInstruction } from '../engine/promptService';
import { aiService } from '../engine/aiService';
import { promptTemplates } from '../engine/promptTemplates';
import { MODEL } from '../../config/constants';
import { serverEnv } from '../../config/env';
import { GoogleAuth } from 'google-auth-library';

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

/**
 * Generates an image using Vertex AI Imagen model directly
 */
export const generateImage = async (
  prompt: string
): Promise<ServiceResponse<string | null>> => {
  const startTs = Date.now();

  try {
    const project = serverEnv.GOOGLE_VERTEX_PROJECT;
    const location = serverEnv.GOOGLE_VERTEX_LOCATION || 'global';
    
    // 1. Get Authentication Token
    const auth = new GoogleAuth({
      credentials: serverEnv.GOOGLE_VERTEX_CREDENTIALS ? JSON.parse(serverEnv.GOOGLE_VERTEX_CREDENTIALS.trim().replace(/^'|'$/g, '')) : undefined,
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    });
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken = tokenResponse.token;

    if (!accessToken) {
      throw new Error('Failed to obtain Google Cloud access token');
    }

    // 2. Call Imagen API
    // Note: This uses the direct REST API for Imagen 3 or 2
    const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/imagen-3.0-generate-001:predict`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: {
          sampleCount: 1,
          aspectRatio: "16:9",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Vertex AI Image generation failed (${response.status}): ${errorText}`);
    }

    const payload = await response.json();
    
    // Extract base64 from predictions
    const base64Image = payload.predictions?.[0]?.bytesBase64;
    const imageData = base64Image ? ensureDataUrl(base64Image) : null;

    // Cost tracking for images is often fixed per request or based on model
    const metrics = calculateCost({}, 'IMAGE_GEN');

    return {
      data: imageData,
      ...metrics,
      duration: Date.now() - startTs,
    };
  } catch (e) {
    console.error('[ImageService] Generation failed:', e);
    throw e;
  }
};

/**
 * Analyzes an image using Vertex AI (Vision)
 */
export const analyzeImageWithAI = async (
  imageUrl: string,
  prompt: string = 'Describe this image in detail.',
  model: string = 'gemini-1.5-flash'
): Promise<ServiceResponse<string>> => {
  const startTs = Date.now();
  // TODO: Implement Vision analysis using Vercel AI SDK 6 experimental_generateText
  return {
    data: 'Image analysis feature is currently being migrated to AI SDK 6.',
    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
    duration: Date.now() - startTs
  };
};

/**
 * Analyzes and defines global visual identity
 */
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
    console.error('[ImageService] Visual Style Analysis failed:', e);
    return {
      data: 'Clean, modern professional photography with natural lighting.',
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
      duration: Date.now() - startTs,
    };
  }
};

/**
 * Generates image prompts from context
 */
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
      schema: z.array(z.string()),
      promptId: 'image_prompt_gen',
    });
    return {
      data: Array.isArray(response.data) ? response.data : [],
      usage: response.usage,
      cost: response.cost,
      duration: Date.now() - startTs,
    };
  } catch (e) {
    console.error('[ImageService] Multi-prompt generation failed, falling back to text', e);
    const fallbackRes = await aiService.runText(prompt, 'FLASH');
    return {
      data: [fallbackRes.text],
      usage: fallbackRes.usage,
      cost: fallbackRes.cost,
      duration: Date.now() - startTs,
    };
  }
};

/**
 * Plans images for the entire article
 */
export const planImagesForArticle = async (
  articleContent: string,
  scrapedImages: ScrapedImage[],
  targetAudience: TargetAudience,
  visualStyle: string = ''
): Promise<ServiceResponse<ImageAssetPlan[]>> => {
  const startTs = Date.now();
  const languageInstruction = getLanguageInstruction(targetAudience);

  const paragraphCount = articleContent.split(/\n\s*\n/).filter((p) => p.trim().length > 50).length;
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
    const response = await aiService.runJson<{ plans: any[] }>(prompt, 'FLASH', {
      schema: z.object({
        plans: z.array(
          z.object({
            generatedPrompt: z.string(),
            category: z.enum([
              'BRANDED_LIFESTYLE',
              'PRODUCT_DETAIL',
              'INFOGRAPHIC',
              'PRODUCT_INFOGRAPHIC',
              'ECOMMERCE_WHITE_BG',
            ]),
            insertAfter: z.string(),
            rationale: z.string().optional(),
          })
        ),
      }),
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
    console.error('[ImageService] Image Planning failed:', e);
    return {
      data: [],
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
      duration: Date.now() - startTs,
    };
  }
};