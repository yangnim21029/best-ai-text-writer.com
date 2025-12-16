/**
 * Region Grounding Service
 * Uses AI to validate and adapt content for the target market region
 * Supports: zh-TW (Taiwan), zh-HK (Hong Kong), zh-MY (Malaysia)
 */

import { aiService } from '../engine/aiService';
import { TokenUsage, CostBreakdown, TargetAudience } from '../../types';

export interface RegionIssue {
    type: 'entity' | 'brand' | 'regulation' | 'currency' | 'location' | 'service';
    original: string;
    regionEquivalent: string;
    confidence: number;
    context: string;
    sourceRegion: string;
}

export interface RegionGroundingResult {
    isRegionRelevant: boolean;
    relevanceScore: number;
    issues: RegionIssue[];
    suggestions: { original: string; rewritten: string }[];
}

const REGION_CONFIG: Record<TargetAudience, {
    name: string;
    currency: string;
    excludeRegions: string[];
    examples: string[];
}> = {
    'zh-TW': {
        name: '台灣',
        currency: 'NT$/新台幣',
        excludeRegions: ['HK', 'CN', 'MY'],
        examples: ['蝦皮', 'momo購物', '台北捷運', '健保', '高鐵', '全聯', '7-11']
    },
    'zh-HK': {
        name: '香港',
        currency: 'HKD/$港幣',
        excludeRegions: ['TW', 'CN', 'MY'],
        examples: ['HKTVmall', '港鐵', 'OK便利店', '八達通', '強積金']
    },
    'zh-MY': {
        name: '馬來西亞',
        currency: 'RM/馬幣',
        excludeRegions: ['TW', 'HK', 'CN'],
        examples: ['Lazada', 'Shopee', 'Grab', 'Touch \'n Go', 'EPF']
    }
};

/**
 * Get region label for display
 */
export const getRegionLabel = (audience: TargetAudience): string => {
    return REGION_CONFIG[audience]?.name || audience;
};

/**
 * Analyze content to detect entities from other regions
 */
export const detectForeignEntities = async (
    content: string,
    targetAudience: TargetAudience
): Promise<{
    entities: { text: string; type: string; region: string }[];
    usage: TokenUsage;
    cost: CostBreakdown;
    duration: number;
}> => {
    const config = REGION_CONFIG[targetAudience];
    if (!config) {
        return {
            entities: [],
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: 0
        };
    }

    const prompt = `
你是一位${config.name}市場內容分析專家。請分析以下內容，找出所有非${config.name}本地的實體（品牌、機構、地點、服務、法規等）。

**目標市場：** ${config.name}
**貨幣：** ${config.currency}
**本地品牌範例：** ${config.examples.join('、')}

**分析標準：**
1. 其他地區特定實體（品牌、服務、機構）
2. 其他地區法規或政策
3. 其他地區貨幣表達
4. 其他地區地點引用（除非是一般地理描述）

**內容：**
${content.substring(0, 6000)}

**輸出 JSON 格式：**
{
  "entities": [
    { "text": "實體名稱", "type": "brand|service|location|regulation|currency", "region": "TW|HK|CN|MY|OTHER" }
  ]
}

只輸出 JSON，找不到就返回空陣列。`;

    const response = await aiService.runJson<{
        entities: { text: string; type: string; region: string }[];
    }>(prompt, 'FLASH');

    // Filter out entities that belong to the target region
    const foreignEntities = (response.data.entities || []).filter(e =>
        config.excludeRegions.includes(e.region) || e.region === 'OTHER'
    );

    return {
        entities: foreignEntities,
        usage: response.usage,
        cost: response.cost,
        duration: response.duration
    };
};

/**
 * Find regional equivalents for detected foreign entities
 */
export const findRegionEquivalents = async (
    entities: { text: string; type: string; region: string }[],
    targetAudience: TargetAudience
): Promise<{
    mappings: RegionIssue[];
    usage: TokenUsage;
    cost: CostBreakdown;
    duration: number;
}> => {
    const config = REGION_CONFIG[targetAudience];
    if (entities.length === 0 || !config) {
        return {
            mappings: [],
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: 0
        };
    }

    const targetEntities = entities.slice(0, 10);
    const entityList = targetEntities.map(e => `- ${e.text} (${e.type}, from ${e.region})`).join('\n');

    const prompt = `
你是一位${config.name}市場專家。請為以下非${config.name}實體找出${config.name}對應的替代選項。

**需要查找替代的實體：**
${entityList}

**請找出：**
1. ${config.name}市場對應的品牌/服務/機構
2. ${config.name}慣用的名稱或說法
3. ${config.name}相關的法規或標準

**輸出 JSON 格式：**
{
  "mappings": [
    {
      "type": "entity|brand|regulation|currency|location|service",
      "original": "原實體",
      "regionEquivalent": "${config.name}對應",
      "confidence": 0.0-1.0,
      "context": "說明為何這是合適的替代",
      "sourceRegion": "來源地區"
    }
  ]
}

只輸出 JSON。如果某實體找不到合適替代，可以省略或設 regionEquivalent 為空。`;

    const response = await aiService.runJson<{
        mappings: RegionIssue[];
    }>(prompt, 'FLASH');

    return {
        mappings: (response.data.mappings || []).filter(m => m.regionEquivalent),
        usage: response.usage,
        cost: response.cost,
        duration: response.duration
    };
};

/**
 * Rewrite content for target region
 */
export const rewriteForRegion = async (
    content: string,
    mappings: RegionIssue[],
    targetAudience: TargetAudience
): Promise<{
    rewrittenContent: string;
    changes: { original: string; rewritten: string }[];
    usage: TokenUsage;
    cost: CostBreakdown;
    duration: number;
}> => {
    const config = REGION_CONFIG[targetAudience];
    if (mappings.length === 0 || !config) {
        return {
            rewrittenContent: content,
            changes: [],
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: 0
        };
    }

    const mappingInstructions = mappings.map(m =>
        `- 「${m.original}」→「${m.regionEquivalent}」：${m.context}`
    ).join('\n');

    const prompt = `
你是一位${config.name}市場內容編輯專家。請根據以下替換指引，改寫內容使其適合${config.name}讀者。

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
 * Full region grounding validation pipeline
 */
export const validateAndAdaptForRegion = async (
    content: string,
    targetAudience: TargetAudience
): Promise<{
    result: RegionGroundingResult;
    rewrittenContent: string;
    usage: TokenUsage;
    cost: CostBreakdown;
    duration: number;
}> => {
    const config = REGION_CONFIG[targetAudience];
    const regionName = config?.name || targetAudience;

    const startTime = Date.now();
    let totalUsage: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    let totalCost: CostBreakdown = { inputCost: 0, outputCost: 0, totalCost: 0 };

    // Step 1: Detect foreign entities
    const detectResult = await detectForeignEntities(content, targetAudience);
    totalUsage.inputTokens += detectResult.usage.inputTokens;
    totalUsage.outputTokens += detectResult.usage.outputTokens;
    totalUsage.totalTokens += detectResult.usage.totalTokens;
    totalCost.inputCost += detectResult.cost.inputCost;
    totalCost.outputCost += detectResult.cost.outputCost;
    totalCost.totalCost += detectResult.cost.totalCost;

    console.log(`[RegionGrounding] Detected ${detectResult.entities.length} foreign entities for ${regionName}`);

    if (detectResult.entities.length === 0) {
        return {
            result: {
                isRegionRelevant: true,
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

    // Step 2: Find regional equivalents
    const groundingResult = await findRegionEquivalents(detectResult.entities, targetAudience);
    totalUsage.inputTokens += groundingResult.usage.inputTokens;
    totalUsage.outputTokens += groundingResult.usage.outputTokens;
    totalUsage.totalTokens += groundingResult.usage.totalTokens;
    totalCost.inputCost += groundingResult.cost.inputCost;
    totalCost.outputCost += groundingResult.cost.outputCost;
    totalCost.totalCost += groundingResult.cost.totalCost;

    console.log(`[RegionGrounding] Found ${groundingResult.mappings.length} ${regionName} equivalents`);

    // Step 3: Rewrite content if we have mappings
    let finalContent = content;
    let changes: { original: string; rewritten: string }[] = [];

    if (groundingResult.mappings.length > 0) {
        const rewriteResult = await rewriteForRegion(content, groundingResult.mappings, targetAudience);
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
    const relevanceScore = Math.round(((resolvedEntities) / Math.max(1, totalEntities)) * 100);

    return {
        result: {
            isRegionRelevant: detectResult.entities.length === 0 || relevanceScore >= 80,
            relevanceScore: Math.max(0, Math.min(100, 100 - (totalEntities - resolvedEntities) * 10)),
            issues: groundingResult.mappings,
            suggestions: changes
        },
        rewrittenContent: finalContent,
        usage: totalUsage,
        cost: totalCost,
        duration: Date.now() - startTime
    };
};
