import { GoogleGenAI, Type } from "@google/genai";
import { ServiceResponse, ProductBrief, ProblemProductMapping, TargetAudience } from '../types';
import { calculateCost, getLanguageInstruction } from './promptService';
import { fetchUrlContent } from './webScraper';

// NEW: Multi-URL Content Summarizer for Human-Readable Context
export const summarizeBrandContent = async (urls: string[], targetAudience: TargetAudience): Promise<ServiceResponse<string>> => {
    const startTs = Date.now();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const languageInstruction = getLanguageInstruction(targetAudience);

    // 1. Scrape all URLs (Aggregate content)
    // Limit to 3 URLs to prevent timeout, and truncate content
    let aggregatedContent = "";
    
    // Parallel fetch for speed
    const fetchPromises = urls.slice(0, 5).map(async (url) => {
        try {
            // includeNav: true -> We need header/footer for Address/Phone
            const res = await fetchUrlContent(url, { includeNav: true });
            return `--- SOURCE: ${url} ---\n${res.content.substring(0, 10000)}`;
        } catch (e) {
            console.error(`Failed to fetch ${url}`, e);
            return `--- FAILED: ${url} ---`;
        }
    });

    const contents = await Promise.all(fetchPromises);
    aggregatedContent = contents.join("\n\n");

    if (aggregatedContent.length < 50) {
        return { data: "Failed to scrape content from provided URLs.", usage: {inputTokens:0, outputTokens:0, totalTokens:0}, cost: {inputCost:0, outputCost:0, totalCost:0}, duration: Date.now() - startTs };
    }

    // 2. Specialized Prompt with "Few-Shot" Example
    const prompt = `
    I have scraped content from a Brand's website.
    
    TASK: 
    Create a **Human-Readable Summary** of "What this company offers". 
    
    STYLE RULES:
    1. **Categorize by Function:** Group products not by their technical model name, but by **what they do for the user** (e.g., "Face Lifting", "Skin Brightening").
    2. **Translate Jargon:** If you see technical terms (e.g., "HIFU", "755nm", "Volnewmer"), explain them simply in brackets or descriptions.
    3. **Simple & Direct:** Write as if explaining to a friend.
    4. **Contact Info:** At the very end, list the Address, Phone, and Business Hours if found.

    ${languageInstruction}

    ### FEW-SHOT EXAMPLE (Follow this style):
    
    根據 TopGlow 官網的資訊，他們主要提供的是**醫學美容**服務。為了讓你更容易理解，我將那些充滿專有名詞（如 HIFU、Volnewmer、Onda 等）的產品項目，翻譯成**「它們能幫你做什麼」**的簡單描述：

    他們家的產品主要分為三大類：

    ### 1. 臉部輪廓與緊緻（讓臉變小、變緊）
    這些療程主要是針對雙下巴、臉部鬆弛或想讓線條更明顯的人。
    * **非手術拉提/緊緻：** 利用熱能或超音波讓皮膚變緊，改善下垂（對應產品：Ultraformer MPT、MTight 動能緊緻貼）。
    * **膠原蛋白增生：** 刺激皮膚自己長出膠原蛋白，讓臉看起來比較飽滿有彈性（對應產品：Volnewmer 黃金膠原重組）。

    ### 2. 膚質改善（讓皮膚變亮、去斑、細緻）
    * **去斑與美白：** 打散黑色素，淡化斑點並提亮膚色（對應產品：Pico Laser 皮秒激光）。
    * **深層保濕與煥膚：** 幫皮膚補水、去角質，讓皮膚比較透亮（對應產品：氫氧水光嫩膚）。

    **總結來說**，這是一家提供全方位「變美」服務的診所。

    ### END OF EXAMPLE

    TARGET CONTENT TO SUMMARIZE:
    ${aggregatedContent.substring(0, 40000)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const metrics = calculateCost(response.usageMetadata, 'FLASH');

        return {
            data: response.text || "Could not summarize content.",
            ...metrics,
            duration: Date.now() - startTs
        };

    } catch (e) {
        console.error("Brand Summarization failed", e);
        return { 
            data: "Error during summarization.", 
            usage: {inputTokens:0, outputTokens:0, totalTokens:0}, 
            cost: {inputCost:0, outputCost:0, totalCost:0},
            duration: Date.now() - startTs
        };
    }
};

// Pre-processing Service to parse raw product text
export const parseProductContext = async (rawText: string): Promise<ServiceResponse<ProductBrief>> => {
    const startTs = Date.now();
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
    I have a raw text describing a business, product, or service.
    
    TASK: Extract the structured information into JSON.
    
    CRITICAL IDENTIFICATION:
    1. **brandName**: The short name of the company or entity (e.g., "TopGlow", "Nike", "Dr. Smith's Clinic").
    2. **productName**: The specific full name of the offering (e.g., "TopGlow 755nm Laser", "Air Max 90", "Painless Implant Service"). 
       - If no specific product is mentioned, use the Brand Name + Main Service.
    3. **usp**: Unique Selling Proposition (1 short sentence).
    4. **ctaLink**: The main URL (default to https://example.com if missing).
    5. **targetPainPoints**: A comma-separated list of problems this solves.

    RAW TEXT:
    ${rawText.substring(0, 5000)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        brandName: { type: Type.STRING, description: "The Entity Name (e.g. TopGlow)" },
                        productName: { type: Type.STRING, description: "The Full Product/Service Name" },
                        usp: { type: Type.STRING },
                        ctaLink: { type: Type.STRING },
                        targetPainPoints: { type: Type.STRING }
                    },
                    required: ["brandName", "productName", "usp", "ctaLink"]
                }
            }
        });

        const data = JSON.parse(response.text || "{}");
        const metrics = calculateCost(response.usageMetadata, 'FLASH');

        // Fallback if brandName is missing but product exists
        const finalBrand = data.brandName || data.productName?.split(' ')[0] || "Our Brand";
        const finalProduct = data.productName || finalBrand;

        return {
            data: {
                brandName: finalBrand,
                productName: finalProduct,
                usp: data.usp || "",
                ctaLink: data.ctaLink || "",
                targetPainPoints: data.targetPainPoints || ""
            },
            ...metrics,
            duration: Date.now() - startTs
        };

    } catch (e) {
        console.error("Product parsing failed", e);
        // Return a safe fallback so the app doesn't crash, but generation might be generic
        return { 
            data: { brandName: "Our Brand", productName: "Our Service", usp: "", ctaLink: "", targetPainPoints: "" }, 
            usage: {inputTokens:0, outputTokens:0, totalTokens:0}, 
            cost: {inputCost:0, outputCost:0, totalCost:0},
            duration: Date.now() - startTs
        };
    }
};

// Pre-Generation Step - Problem Product Mapping
export const generateProblemProductMapping = async (
    product: ProductBrief, 
    targetAudience: TargetAudience
): Promise<ServiceResponse<ProblemProductMapping[]>> => {
    const startTs = Date.now();
    if (!product.productName) {
        return { data: [], usage: {inputTokens:0, outputTokens:0, totalTokens:0}, cost: {inputCost:0, outputCost:0, totalCost:0}, duration: 0 };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const languageInstruction = getLanguageInstruction(targetAudience);

    const prompt = `
    PRODUCT BRIEF:
    Brand: ${product.brandName}
    Item: ${product.productName}
    USP: ${product.usp}
    Context: ${product.targetPainPoints || "General Solution"}
    
    ${languageInstruction}

    TASK:
    Generate a "Problem-Product Mapping" for content writing. 
    Identify 5-8 common Pain Points that this product solves.
    For each Pain Point, identify the specific Product Feature that solves it.
    
    Also provide "Relevance Keywords" to help me match this pain point to article section titles (e.g., if pain is "Dry Skin", keywords might be "hydration", "winter", "cracked").
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        mappings: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    painPoint: { type: Type.STRING, description: "The user problem" },
                                    productFeature: { type: Type.STRING, description: "The solution feature" },
                                    relevanceKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }
                                }
                            }
                        }
                    }
                }
            }
        });

        const data = JSON.parse(response.text || "{}");
        const metrics = calculateCost(response.usageMetadata, 'FLASH');

        return {
            data: data.mappings || [],
            ...metrics,
            duration: Date.now() - startTs
        };

    } catch (e) {
        console.error("Product Mapping failed", e);
        return { data: [], usage: {inputTokens:0, outputTokens:0, totalTokens:0}, cost: {inputCost:0, outputCost:0, totalCost:0}, duration: Date.now() - startTs };
    }
};