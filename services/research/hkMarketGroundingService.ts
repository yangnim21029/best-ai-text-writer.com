/**
 * HK Market Grounding Service
 * Uses Vertex AI Google Search grounding to validate and adapt content for Hong Kong market
 */

import { aiService } from '../engine/aiService';
import { TokenUsage, CostBreakdown, TargetAudience } from '../../types';

export interface HKGroundingIssue {
    type: 'entity' | 'brand' | 'regulation' | 'currency' | 'location' | 'service';
    original: string;
    hkEquivalent: string;
    confidence: number;
    context: string;
    searchSource?: string;
}

export interface HKGroundingResult {
    isHKRelevant: boolean;
    relevanceScore: number;
    issues: HKGroundingIssue[];
    suggestions: { original: string; rewritten: string }[];
}

/**
 * Analyze content to detect non-HK entities that need grounding search
 */
export const detectNonHKEntities = async (
    content: string
): Promise<{
    entities: { text: string; type: string; region: string }[];
    usage: TokenUsage;
    cost: CostBreakdown;
    duration: number;
}> => {
    const prompt = `
你是一位香港市場內容分析專家。請分析以下內容，找出所有非香港本地的實體（品牌、機構、地點、服務、法規等）。

**分析標準：**
1. 台灣特定實體：如「蝦皮」、「momo購物」、「台北捷運」、「健保」、「高鐵」、「全聯」、「7-11（台灣）」
2. 中國大陸特定實體：如「微信支付」、「支付寶」、「淘寶（大陸版）」、「小紅書」
3. 地區法規：如「台灣衛福部」、「中國藥監局」
4. 貨幣表達：如「NT$」、「新台幣」、「人民幣」
5. 地點引用：如「台北」、「高雄」、「上海」（除非是一般地理描述）

**內容：**
${content.substring(0, 6000)}

**輸出 JSON 格式：**
{
  "entities": [
    { "text": "實體名稱", "type": "brand|service|location|regulation|currency", "region": "TW|CN|OTHER" }
  ]
}

只輸出 JSON，找不到就返回空陣列。`;

    const response = await aiService.runJson<{
        entities: { text: string; type: string; region: string }[];
    }>(prompt, 'FLASH');

    return {
        entities: response.data.entities || [],
        usage: response.usage,
        cost: response.cost,
        duration: response.duration
    };
};

/**
 * Use Google Search grounding to find HK equivalents for detected entities
 */
export const findHKEquivalents = async (
    entities: { text: string; type: string; region: string }[]
): Promise<{
    mappings: HKGroundingIssue[];
    usage: TokenUsage;
    cost: CostBreakdown;
    duration: number;
}> => {
    if (entities.length === 0) {
        return {
            mappings: [],
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: 0
        };
    }

    // Limit to top 10 entities per request
    const targetEntities = entities.slice(0, 10);
    const entityList = targetEntities.map(e => `- ${e.text} (${e.type}, from ${e.region})`).join('\n');

    const prompt = `
你是一位香港市場專家。請為以下非香港實體找出香港對應的替代選項。

**需要查找替代的實體：**
${entityList}

**請使用 Google 搜尋找出：**
1. 香港市場對應的品牌/服務/機構
2. 香港慣用的名稱或說法
3. 香港相關的法規或標準

**輸出 JSON 格式：**
{
  "mappings": [
    {
      "type": "entity|brand|regulation|currency|location|service",
      "original": "原實體",
      "hkEquivalent": "香港對應",
      "confidence": 0.0-1.0,
      "context": "說明為何這是合適的替代",
      "searchSource": "來源說明"
    }
  ]
}

只輸出 JSON。如果某實體找不到合適替代，可以省略或設 hkEquivalent 為空。`;

    // Use grounding config for Google Search
    const response = await aiService.runJson<{
        mappings: HKGroundingIssue[];
    }>(prompt, 'FLASH', {
        type: 'object',
        properties: {
            mappings: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        type: { type: 'string' },
                        original: { type: 'string' },
                        hkEquivalent: { type: 'string' },
                        confidence: { type: 'number' },
                        context: { type: 'string' },
                        searchSource: { type: 'string' }
                    }
                }
            }
        }
    });

    return {
        mappings: (response.data.mappings || []).filter(m => m.hkEquivalent),
        usage: response.usage,
        cost: response.cost,
        duration: response.duration
    };
};

/**
 * Rewrite content sections using HK grounding mappings
 */
export const rewriteForHKMarket = async (
    content: string,
    mappings: HKGroundingIssue[]
): Promise<{
    rewrittenContent: string;
    changes: { original: string; rewritten: string }[];
    usage: TokenUsage;
    cost: CostBreakdown;
    duration: number;
}> => {
    if (mappings.length === 0) {
        return {
            rewrittenContent: content,
            changes: [],
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: 0
        };
    }

    const mappingInstructions = mappings.map(m =>
        `- 「${m.original}」→「${m.hkEquivalent}」：${m.context}`
    ).join('\n');

    const prompt = `
你是一位香港市場內容編輯專家。請根據以下替換指引，改寫內容使其適合香港讀者。

**替換指引：**
${mappingInstructions}

**改寫規則：**
1. 保持原文語意和結構
2. 只替換指定的實體，其他內容保持不變
3. 確保替換後的句子通順自然
4. 如果某處替換會造成語意不通，可以適度調整上下文

**原始內容：**
${content.substring(0, 8000)}

**輸出 JSON 格式：**
{
  "rewrittenContent": "改寫後的完整內容",
  "changes": [
    { "original": "原句子", "rewritten": "改寫後句子" }
  ]
}

只輸出 JSON。`;

    const response = await aiService.runJson<{
        rewrittenContent: string;
        changes: { original: string; rewritten: string }[];
    }>(prompt, 'FLASH');

    return {
        rewrittenContent: response.data.rewrittenContent || content,
        changes: response.data.changes || [],
        usage: response.usage,
        cost: response.cost,
        duration: response.duration
    };
};

/**
 * Full HK market grounding validation pipeline
 */
export const validateAndAdaptForHKMarket = async (
    content: string,
    targetAudience: TargetAudience
): Promise<{
    result: HKGroundingResult;
    rewrittenContent: string;
    usage: TokenUsage;
    cost: CostBreakdown;
    duration: number;
}> => {
    // Skip if not targeting HK
    if (targetAudience !== 'zh-HK') {
        return {
            result: {
                isHKRelevant: true,
                relevanceScore: 100,
                issues: [],
                suggestions: []
            },
            rewrittenContent: content,
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: 0
        };
    }

    const startTime = Date.now();
    let totalUsage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    let totalCost: CostBreakdown = { inputCost: 0, outputCost: 0, totalCost: 0 };

    // Step 1: Detect non-HK entities
    const detectResult = await detectNonHKEntities(content);
    totalUsage.inputTokens += detectResult.usage.inputTokens;
    totalUsage.outputTokens += detectResult.usage.outputTokens;
    totalUsage.totalTokens += detectResult.usage.totalTokens;
    totalCost.inputCost += detectResult.cost.inputCost;
    totalCost.outputCost += detectResult.cost.outputCost;
    totalCost.totalCost += detectResult.cost.totalCost;

    console.log(`[HKGrounding] Detected ${detectResult.entities.length} non-HK entities`);

    if (detectResult.entities.length === 0) {
        return {
            result: {
                isHKRelevant: true,
                relevanceScore: 100,
                issues: [],
                suggestions: []
            },
            rewrittenContent: content,
            usage: totalUsage,
            cost: totalCost,
            duration: Date.now() - startTime
        };
    }

    // Step 2: Find HK equivalents using grounding
    const groundingResult = await findHKEquivalents(detectResult.entities);
    totalUsage.inputTokens += groundingResult.usage.inputTokens;
    totalUsage.outputTokens += groundingResult.usage.outputTokens;
    totalUsage.totalTokens += groundingResult.usage.totalTokens;
    totalCost.inputCost += groundingResult.cost.inputCost;
    totalCost.outputCost += groundingResult.cost.outputCost;
    totalCost.totalCost += groundingResult.cost.totalCost;

    console.log(`[HKGrounding] Found ${groundingResult.mappings.length} HK equivalents`);

    // Step 3: Rewrite content if we have mappings
    let finalContent = content;
    let changes: { original: string; rewritten: string }[] = [];

    if (groundingResult.mappings.length > 0) {
        const rewriteResult = await rewriteForHKMarket(content, groundingResult.mappings);
        finalContent = rewriteResult.rewrittenContent;
        changes = rewriteResult.changes;
        totalUsage.inputTokens += rewriteResult.usage.inputTokens;
        totalUsage.outputTokens += rewriteResult.usage.outputTokens;
        totalUsage.totalTokens += rewriteResult.usage.totalTokens;
        totalCost.inputCost += rewriteResult.cost.inputCost;
        totalCost.outputCost += rewriteResult.cost.outputCost;
        totalCost.totalCost += rewriteResult.cost.totalCost;
    }

    // Calculate relevance score
    const totalEntities = detectResult.entities.length;
    const resolvedEntities = groundingResult.mappings.filter(m => m.confidence > 0.7).length;
    const relevanceScore = Math.round(((totalEntities - detectResult.entities.length + resolvedEntities) / Math.max(1, totalEntities)) * 100);

    return {
        result: {
            isHKRelevant: detectResult.entities.length === 0 || relevanceScore >= 80,
            relevanceScore: Math.max(0, Math.min(100, relevanceScore)),
            issues: groundingResult.mappings,
            suggestions: changes
        },
        rewrittenContent: finalContent,
        usage: totalUsage,
        cost: totalCost,
        duration: Date.now() - startTime
    };
};
