import { z } from 'zod';
import { experimental_generateImage as generateImageSDK } from 'ai';
import { ServiceResponse, ScrapedImage, TargetAudience, ImageAssetPlan } from '../../types';
import { calculateCost, getLanguageInstruction } from '../adapters/promptService';
import { aiService, getVertex } from '../adapters/aiService';
import { promptTemplates, VISUAL_STYLE_GUIDE } from '../adapters/promptTemplates';

const ensureDataUrl = (value: string, mimeType = 'image/png'): string | null => {
  if (!value) return null;
  if (value.startsWith('data:') || value.startsWith('http')) return value;
  return `data:${mimeType};base64,${value}`;
};

/**
 * Generates an image using Vercel AI SDK
 */
import { MODEL } from '../../config/constants';
import { generateText } from 'ai';

export const generateImage = async (
  prompt: string
): Promise<ServiceResponse<string | null>> => {
  const startTs = Date.now();

  try {
    // Gemini 2.5 Flash Image is a multimodal language model, not a strict image generation model in the SDK sense
    // We must use generateText and extract the image from the response files
    const result = await generateText({
      model: getVertex()(MODEL.IMAGE_GEN),
      prompt: prompt,
    });

    let imageData: string | null = null;

    // Check if the model returned any files (images)
    const rawResult = result as any;
    if (rawResult.files && Array.isArray(rawResult.files)) {
      const imageFile = rawResult.files.find((f: any) => f.contentType?.startsWith('image/') || f.mediaType?.startsWith('image/'));

      if (imageFile) {
        if (imageFile.base64) {
          imageData = `data:${imageFile.mediaType || 'image/png'};base64,${imageFile.base64}`;
        }
      }
    }

    const metrics = calculateCost({}, 'IMAGE_GEN');

    return {
      data: imageData,
      ...metrics,
      duration: Date.now() - startTs,
    };
  } catch (e) {
    console.error('[ImageService] SDK Generation failed:', e);
    throw e;
  }
};

/**
 * 分析圖片與視覺風格
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
    return {
      data: 'Clean, modern professional photography with natural lighting.',
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
      duration: Date.now() - startTs,
    };
  }
};

/**
 * 預先規劃全文章圖片 (整體規劃邏輯)
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
  const maxImages = Math.max(2, paragraphCount);

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
        plans: z.array(z.object({
          generatedPrompt: z.string(),
          category: z.enum(['BRANDED_LIFESTYLE', 'PRODUCT_DETAIL', 'INFOGRAPHIC', 'PRODUCT_INFOGRAPHIC', 'ECOMMERCE_WHITE_BG']),
          insertAfter: z.string(),
          rationale: z.string().optional()
        }))
      })
    });

    const finalPlans: ImageAssetPlan[] = (response.data.plans || []).map((p: any, index: number) => ({
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
    return { data: [], usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: Date.now() - startTs };
  }
};

/**
 * Generates image prompt options based on specific textual context.
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