import 'server-only';
import { z } from 'zod';
import { ServiceResponse, ProductBrief, ProblemProductMapping, TargetAudience } from '../../types';
import { getLanguageInstruction } from '../adapters/promptService';
import { aiService } from '../adapters/aiService';
import { promptTemplates } from '../adapters/promptTemplates';

export const generateProductBrief = async (
  productName: string,
  productUrl: string,
  targetAudience: TargetAudience
): Promise<ServiceResponse<ProductBrief>> => {
  const startTs = Date.now();
  const languageInstruction = getLanguageInstruction(targetAudience);

  const prompt = promptTemplates.productBrief({ productName, productUrl, languageInstruction });

  try {
    const response = await aiService.runJson<ProductBrief>(prompt, 'FLASH', {
      schema: z.object({
        brandName: z.string(),
        productName: z.string(),
        productDescription: z.string().optional(),
        usp: z.string(),
        primaryPainPoint: z.string().optional(),
        ctaLink: z.string(),
      }),
    });

    // Fill in defaults if missing
    const data = response.data;
    const finalData: ProductBrief = {
      brandName: data.brandName || 'Brand',
      productName: data.productName || productName,
      usp: data.usp || '',
      ctaLink: data.ctaLink || productUrl,
      targetPainPoints: (data as any).primaryPainPoint, // Map if exists
    };

    return {
      data: finalData,
      usage: response.usage,
      cost: response.cost,
      duration: response.duration,
    };
  } catch (e) {
    console.error('Product Brief Generation Failed', e);
    return {
      data: { brandName: '', productName: productName, usp: '', ctaLink: productUrl },
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
      duration: Date.now() - startTs,
    };
  }
};

export const mapProblemsToProduct = async (
  productBrief: ProductBrief,
  articleTopic: string,
  targetAudience: TargetAudience
): Promise<ServiceResponse<ProblemProductMapping[]>> => {
  const startTs = Date.now();
  const languageInstruction = getLanguageInstruction(targetAudience);

  const prompt = promptTemplates.productMapping({
    productBrief,
    articleTopic,
    languageInstruction,
  });

  try {
    const response = await aiService.runJson<ProblemProductMapping[]>(prompt, 'FLASH', {
      schema: z.array(
        z.object({
          painPoint: z.string(),
          productFeature: z.string(),
          relevanceKeywords: z.array(z.string()),
        })
      ),
    });

    return {
      data: response.data,
      usage: response.usage,
      cost: response.cost,
      duration: response.duration,
    };
  } catch (e) {
    console.error('Brand Content Summarization Failed', e);
    return {
      data: [],
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
      duration: Date.now() - startTs,
    };
  }
};

// Parse product context from raw text
export const parseProductContext = async (
  rawText: string
): Promise<ServiceResponse<ProductBrief>> => {
  const startTs = Date.now();

  const prompt = promptTemplates.productContextFromText({ rawText });

  try {
    const response = await aiService.runJson<ProductBrief>(prompt, 'FLASH', {
      schema: z.object({
        brandName: z.string(),
        productName: z.string(),
        usp: z.string(),
        primaryPainPoint: z.string().optional(),
        ctaLink: z.string(),
      }),
    });

    const data = response.data;
    return {
      data: {
        brandName: data.brandName || '',
        productName: data.productName || '',
        usp: data.usp || '',
        ctaLink: data.ctaLink || '',
        targetPainPoints: (data as any).primaryPainPoint,
      },
      usage: response.usage,
      cost: response.cost,
      duration: response.duration,
    };
  } catch (e) {
    console.error('Product Context Parsing Failed', e);
    return {
      data: { brandName: '', productName: '', usp: '', ctaLink: '' },
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
      duration: Date.now() - startTs,
    };
  }
};

// Alias for backward compatibility with App.tsx
export const generateProblemProductMapping = async (
  productBrief: ProductBrief,
  targetAudience: TargetAudience,
  articleTopic: string = 'General Content'
): Promise<ServiceResponse<ProblemProductMapping[]>> => {
  return mapProblemsToProduct(productBrief, articleTopic, targetAudience);
};

export const summarizeBrandContent = async (
  urls: string[],
  targetAudience: TargetAudience
): Promise<ServiceResponse<string>> => {
  const startTs = Date.now();
  const languageInstruction = getLanguageInstruction(targetAudience);

  const prompt = promptTemplates.brandSummary({ urls, languageInstruction });

  try {
    const response = await aiService.runText(prompt, 'FLASH');

    return {
      data: response.text,
      usage: response.usage,
      cost: response.cost,
      duration: response.duration,
    };
  } catch (e) {
    console.error('Brand Summary Failed', e);
    return {
      data: '',
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
      duration: Date.now() - startTs,
    };
  }
};
