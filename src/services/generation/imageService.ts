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
// ...
export const generateImage = async (
  prompt: string
): Promise<ServiceResponse<string | null>> => {
  const startTs = Date.now();

  try {
    const { image } = await generateImageSDK({
      model: getVertex().imageModel(MODEL.IMAGE_PREVIEW),
      prompt: prompt,
      aspectRatio: '16:9',
    });

    const imageData = image.base64 ? `data:image/png;base64,${image.base64}` : null;
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
 * 段落計劃時的圖片生成邏輯 (0~1 張圖片)
 * 這是獨立於整體規劃的邏輯
 */
export const generateSectionImage = async (
  sectionTitle: string,
  sectionContent: string,
  visualStyle: string,
  targetAudience: TargetAudience
): Promise<ServiceResponse<string | null>> => {
  const startTs = Date.now();
  
  // 1. 判斷此段落是否需要圖片
  const decisionPrompt = `You are a visual editor. Analyze the section and decide if it needs an illustration. 
  Section: ${sectionTitle}
  Content: ${sectionContent.substring(0, 500)}...
  
  Return JSON: { "needsImage": boolean, "prompt": "English prompt if true, else empty" }`;

  try {
    const decision = await aiService.runJson<{ needsImage: boolean; prompt: string }>(decisionPrompt, 'FLASH', {
      schema: z.object({
        needsImage: z.boolean(),
        prompt: z.string()
      })
    });

    if (!decision.data.needsImage || !decision.data.prompt) {
      return {
        data: null,
        usage: decision.usage,
        cost: decision.cost,
        duration: Date.now() - startTs
      };
    }

    // 2. 生成圖片
    const fullPrompt = `${decision.data.prompt}. Style: ${visualStyle}. ${VISUAL_STYLE_GUIDE}`;
    const imgRes = await generateImage(fullPrompt);

    return {
      data: imgRes.data,
      usage: {
        inputTokens: decision.usage.inputTokens + imgRes.usage.inputTokens,
        outputTokens: decision.usage.outputTokens + imgRes.usage.outputTokens,
        totalTokens: decision.usage.totalTokens + imgRes.usage.totalTokens,
      },
      cost: {
        inputCost: decision.cost.inputCost + imgRes.cost.inputCost,
        outputCost: decision.cost.outputCost + imgRes.cost.outputCost,
        totalCost: decision.cost.totalCost + imgRes.cost.totalCost,
      },
      duration: Date.now() - startTs
    };
  } catch (e) {
    console.warn('[ImageService] Section image generation skipped', e);
    return {
      data: null,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
      duration: Date.now() - startTs
    };
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