
import { ServiceResponse, ProductBrief, ProblemProductMapping, TargetAudience } from '../types';
import { calculateCost, getLanguageInstruction } from './promptService';
import { generateContent } from './ai';
import { Type } from "@google/genai";

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

    const prompt = `
    I need to create a "Product Brief" for a marketing article.
    
    PRODUCT NAME: "${productName}"
    URL: "${productUrl}"
    
    ${languageInstruction}
    
    TASK:
    1. Infer the Brand Name and USP from the Product Name/URL.
    2. Write a short "Product Description" (2 sentences).
    3. Identify the "Primary Pain Point" this product solves.
    4. Create a "Call to Action (CTA)" link text.
    
    OUTPUT FORMAT (JSON):
    {
        "brandName": "Brand Name",
        "productName": "Full Product Name",
        "productDescription": "...",
        "usp": "...",
        "primaryPainPoint": "...",
        "ctaLink": "${productUrl}" 
    }
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

    const prompt = `
    I have a Product and an Article Topic.
    
    PRODUCT: ${productBrief.productName} (${productBrief.usp})
    TOPIC: ${articleTopic}
    
    ${languageInstruction}
    
    TASK:
    Identify 3-5 "Problem-Solution Mappings".
    For each mapping:
    1. **Pain Point**: A specific problem the reader has related to the Topic.
    2. **Product Feature**: The specific feature of the product that solves it.
    3. **Relevance Keywords**: List of keywords (from the topic) where this mapping is most relevant.
    
    OUTPUT JSON:
    [
        { "painPoint": "...", "productFeature": "...", "relevanceKeywords": ["...", "..."] }
    ]
    `;

    try {
        const response = await generateContent(
            'gemini-2.5-flash',
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
        console.error("Product Mapping Failed", e);
        return {
            data: [],
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: Date.now() - startTs
        };
    }
};

export const summarizeBrandContent = async (
    urls: string[],
    targetAudience: TargetAudience
): Promise<ServiceResponse<string>> => {
    const startTs = Date.now();
    const languageInstruction = getLanguageInstruction(targetAudience);

    const prompt = `
    I have a list of URLs from a Brand's website (Product pages, About Us, Contact).
    
    TASK:
    Extract and summarize the key Service/Product information into a concise, structured format.
    
    ${languageInstruction}
    
    INCLUDE:
    1. Store/Brand Name
    2. Main Services/Products offered
    3. Contact Info (Address, Phone, Email if found)
    4. Unique Selling Points (USP)
    5. Any specific product models, technologies, or certifications
    
    OUTPUT FORMAT:
    Return a single paragraph or structured list (max 200 words).
    
    URLs:
    ${urls.join('\n')}
    `;

    try {
        const response = await generateContent('gemini-2.5-flash', prompt);
        const metrics = calculateCost(response.usageMetadata, 'FLASH');

        return {
            data: response.text?.trim() || "",
            ...metrics,
            duration: Date.now() - startTs
        };

    } catch (e) {
        console.error("Brand Content Summarization Failed", e);
        return {
            data: "",
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

    const prompt = `
    Extract product/service information from the following text:
    
    "${rawText}"
    
    TASK:
    Extract structured information in JSON format:
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