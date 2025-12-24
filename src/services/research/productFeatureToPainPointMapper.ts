import 'server-only';
import { ServiceResponse, ProductBrief, ProblemProductMapping, TargetAudience } from '../../types';
import { calculateCost, getLanguageInstruction } from '../engine/promptService';
import { aiService } from '../engine/aiService';
import { Type } from '../engine/schemaTypes';
import { promptTemplates } from '../engine/promptTemplates';
import { MODEL } from '../../config/constants';

export const generateProductBrief = async (
  productName: string,
  productUrl: string,
  targetAudience: TargetAudience
): Promise<ServiceResponse<ProductBrief>> => {
  const startTs = Date.now();
  const languageInstruction = getLanguageInstruction(targetAudience);

  // 1. Fetch Product Page Content (Mock/Proxy)
  // In a real app, we'd use a server-side proxy to fetch the HTML.
  // For now, we'll ask the AI to "Infer" based on the name/URL if it knows it,
  // or we can pass a "Context" string if the user provided one.
  // Assuming we rely on the AI's internal knowledge or the URL structure for now.

  const prompt = promptTemplates.productBrief({ productName, productUrl, languageInstruction });

  try {
    const response = await aiService.runJson<ProductBrief>(prompt, 'FLASH', {
      schema: {
        type: Type.OBJECT,
        properties: {
          brandName: { type: Type.STRING },
          productName: { type: Type.STRING },
          productDescription: { type: Type.STRING },
          usp: { type: Type.STRING },
          primaryPainPoint: { type: Type.STRING },
          ctaLink: { type: Type.STRING },
        },
        required: ['brandName', 'productName', 'usp', 'ctaLink'],
      },
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
      schema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            painPoint: { type: Type.STRING },
            productFeature: { type: Type.STRING },
            relevanceKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['painPoint', 'productFeature', 'relevanceKeywords'],
        },
      },
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
      schema: {
        type: Type.OBJECT,
        properties: {
          brandName: { type: Type.STRING },
          productName: { type: Type.STRING },
          usp: { type: Type.STRING },
          primaryPainPoint: { type: Type.STRING },
          ctaLink: { type: Type.STRING },
        },
        required: ['brandName', 'productName', 'usp', 'ctaLink'],
      },
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
