
import { ServiceResponse, ProductBrief, ProblemProductMapping, TargetAudience } from '../types';
import { calculateCost, getLanguageInstruction } from './promptService';
import { generateContent } from './ai';
import { Type } from './schemaTypes';
import { promptRegistry } from './promptRegistry';
import { MODEL } from '../config/constants';

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

    const prompt = promptRegistry.build('productBrief', { productName, productUrl, languageInstruction });

    try {
        const response = await generateContent(
            MODEL.FLASH,
            prompt,
            {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        brandName: { type: Type.STRING },
                        productName: { type: Type.STRING },
                        productDescription: { type: Type.STRING },
                        usp: { type: Type.STRING },
                        primaryPainPoint: { type: Type.STRING },
                        ctaLink: { type: Type.STRING }
                    }
                }
            }
        );

        const data = JSON.parse(response.text || "{}");
        const metrics = calculateCost(response.usageMetadata, 'FLASH');

        return {
            data: {
                brandName: data.brandName || "Brand",
                productName: data.productName || productName,
                usp: data.usp || "",
                ctaLink: data.ctaLink || productUrl
            },
            ...metrics,
            duration: Date.now() - startTs
        };

    } catch (e) {
        console.error("Product Brief Generation Failed", e);
        return {
            data: { brandName: "", productName: productName, usp: "", ctaLink: productUrl },
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: Date.now() - startTs
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

    const prompt = promptRegistry.build('productMapping', { productBrief, articleTopic, languageInstruction });

    try {
        const response = await generateContent(
            MODEL.FLASH,
            prompt,
            {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            painPoint: { type: Type.STRING },
                            productFeature: { type: Type.STRING },
                            relevanceKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            }
        );

        const data = JSON.parse(response.text || "[]");
        const metrics = calculateCost(response.usageMetadata, 'FLASH');

        return {
            data: data,
            ...metrics,
            duration: Date.now() - startTs
        };

    } catch (e) {
        console.error("Brand Content Summarization Failed", e);
        return {
            data: [],
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: Date.now() - startTs
        };
    }
};

// Parse product context from raw text
export const parseProductContext = async (
    rawText: string
): Promise<ServiceResponse<ProductBrief>> => {
    const startTs = Date.now();

    const prompt = promptRegistry.build('productContextFromText', { rawText });

    try {
        const response = await generateContent(
            MODEL.FLASH,
            prompt,
            {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        brandName: { type: Type.STRING },
                        productName: { type: Type.STRING },
                        usp: { type: Type.STRING },
                        primaryPainPoint: { type: Type.STRING },
                        ctaLink: { type: Type.STRING }
                    }
                }
            }
        );

        const data = JSON.parse(response.text || "{}");
        const metrics = calculateCost(response.usageMetadata, 'FLASH');

        return {
            data: {
                brandName: data.brandName || "",
                productName: data.productName || "",
                usp: data.usp || "",
                ctaLink: data.ctaLink || ""
            },
            ...metrics,
            duration: Date.now() - startTs
        };

    } catch (e) {
        console.error("Product Context Parsing Failed", e);
        return {
            data: { brandName: "", productName: "", usp: "", ctaLink: "" },
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: Date.now() - startTs
        };
    }
};

// Alias for backward compatibility with App.tsx
export const generateProblemProductMapping = async (
    productBrief: ProductBrief,
    targetAudience: TargetAudience,
    articleTopic: string = "General Content"
): Promise<ServiceResponse<ProblemProductMapping[]>> => {
    return mapProblemsToProduct(productBrief, articleTopic, targetAudience);
};

export const summarizeBrandContent = async (
    urls: string[],
    targetAudience: TargetAudience
): Promise<ServiceResponse<string>> => {
    const startTs = Date.now();
    const languageInstruction = getLanguageInstruction(targetAudience);

    const prompt = promptRegistry.build('brandSummary', { urls, languageInstruction });

    try {
        const response = await generateContent(MODEL.FLASH, prompt);
        const metrics = calculateCost(response.usageMetadata, 'FLASH');

        return {
            data: response.text?.trim() || "",
            ...metrics,
            duration: Date.now() - startTs
        };
    } catch (e) {
        console.error("Brand Summary Failed", e);
        return {
            data: "",
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: Date.now() - startTs
        };
    }
};
