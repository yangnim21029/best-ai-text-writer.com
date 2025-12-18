/**
 * Region Grounding Service
 * Uses AI to validate and adapt content for the target market region
 * Supports: zh-TW (Taiwan), zh-HK (Hong Kong), zh-MY (Malaysia)
 */

import { aiService } from '../engine/aiService';
import { TokenUsage, CostBreakdown, TargetAudience, SectionAnalysis } from '../../types';

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

    // Process ALL entities in a single grounding call (no limit)
    const entityList = entities.map(e => `- ${e.text} (${e.type})`).join('\n');

    const prompt = `
你是一位${config.name}市場專家。請為以下非${config.name}實體找出${config.name}適合的替代選項。

**需要查找替代的實體：**
${entityList}

**替代選項優先順序（請依序嘗試）：**
1. **直接對應** - ${config.name}市場中功能相同的品牌/服務（如：台灣「全聯」→ 香港「百佳/惠康」）
2. **同類替代** - 同品類中${config.name}較知名的品牌（如：台灣服裝品牌 → 任何香港知名服裝品牌）
3. **通用描述** - 如果找不到具體品牌，使用通用描述（如：「韌 REN」→「本地運動服飾品牌」或「知名運動服裝店」）
4. **刪除** - 只有在完全無法描述時才使用「[刪除]」

**重要規則：**
- 盡量提供替代，不要輕易使用「[刪除]」
- 通用描述也是可接受的替代（如「大型藥妝連鎖店」、「本地電商平台」）
- 每個輸入的實體都必須有一個對應的輸出`;

    // Schema for structured output
    const schema = {
        type: 'object',
        properties: {
            mappings: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        type: { type: 'string', description: 'entity|brand|regulation|currency|location|service' },
                        original: { type: 'string', description: '原實體名稱' },
                        regionEquivalent: { type: 'string', description: `${config.name}對應的真實品牌/服務名稱，如找不到則填 "[刪除]"` },
                        confidence: { type: 'number', description: '0.0-1.0 置信度' },
                        context: { type: 'string', description: '說明為何這是合適的替代，或為何建議刪除' },
                        sourceRegion: { type: 'string', description: '來源地區' }
                    },
                    required: ['original', 'regionEquivalent', 'context']
                }
            }
        },
        required: ['mappings']
    };

    // Use runJsonWithSearch with schema for stable structured output
    const response = await aiService.runJsonWithSearch<{
        mappings: RegionIssue[];
    }>(prompt, 'FLASH', schema);

    // Ensure ALL input entities have a mapping
    const aiMappings = response.data.mappings || [];
    const finalMappings: RegionIssue[] = entities.map(entity => {
        const found = aiMappings.find(m => m.original === entity.text);
        if (found) {
            // Convert "[刪除]" to empty string for actual deletion
            return {
                ...found,
                regionEquivalent: found.regionEquivalent === '[刪除]' ? '' : found.regionEquivalent
            };
        }
        // If AI didn't return this entity, create empty replacement (for deletion)
        return {
            type: entity.type as any,
            original: entity.text,
            regionEquivalent: '',
            confidence: 0,
            context: '未找到合適替代，建議從內容中移除',
            sourceRegion: entity.region
        };
    });

    return {
        mappings: finalMappings,
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

/**
 * AI-powered localization for section plans
 * Intelligently rewrites plans for target region, not just string replacement
 */
export const localizePlanWithAI = async (
    data: {
        generalPlan: string[];
        conversionPlan: string[];
        sections: SectionAnalysis[];
        humanWritingVoice?: string;
    },
    replacements: { original: string; replacement: string; reason?: string }[],
    targetAudience: TargetAudience
): Promise<{
    localizedGeneralPlan: string[];
    localizedConversionPlan: string[];
    localizedSections: SectionAnalysis[];
    localizedHumanWritingVoice?: string;
    usage: TokenUsage;
    cost: CostBreakdown;
    duration: number;
}> => {
    const config = REGION_CONFIG[targetAudience];
    if (!config || replacements.length === 0) {
        return {
            localizedGeneralPlan: data.generalPlan,
            localizedConversionPlan: data.conversionPlan,
            localizedSections: data.sections,
            localizedHumanWritingVoice: data.humanWritingVoice,
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: 0
        };
    }

    // Build replacement instructions
    const replacementGuide = replacements.map(r =>
        r.replacement
            ? `- 「${r.original}」→「${r.replacement}」${r.reason ? `（${r.reason}）` : ''}`
            : `- 「${r.original}」→ 刪除此詞，重寫相關句子使其通順`
    ).join('\n');

    // Serialize plans for AI
    const plansJson = JSON.stringify({
        generalPlan: data.generalPlan,
        conversionPlan: data.conversionPlan,
        humanWritingVoice: data.humanWritingVoice || '',
        sections: data.sections.map(s => ({
            title: s.title,
            narrativePlan: s.narrativePlan || [],
            coreQuestion: s.coreQuestion || '',
            difficulty: s.difficulty || 'easy',
            writingMode: s.writingMode || 'direct',
            solutionAngles: s.solutionAngles || [],
            subheadings: s.subheadings || [],
            keyFacts: s.keyFacts || [],
            uspNotes: s.uspNotes || [],
            isChecklist: s.isChecklist || false,
            suppress: s.suppress || [],
            augment: s.augment || [],
            logicalFlow: s.logicalFlow || '',
            coreFocus: s.coreFocus || '',
            sentenceStartFeatures: s.sentenceStartFeatures || [],
            sentenceEndFeatures: s.sentenceEndFeatures || []
        }))
    }, null, 2);

    const prompt = `
你是一位${config.name}市場內容本地化專家。請將以下段落計劃進行本地化改寫，使其完全適合${config.name}讀者。

**本地化替換指引：**
${replacementGuide}

**原始段落計劃：**
${plansJson}

**本地化規則：**
1. 應用上述替換指引，將指令或計劃中的非${config.name}的品牌/服務/實體替換為本地選項
2. 保持原有的 JSON 結構，對每個字段內容進行市場適應性改寫
3. 如果替換後導致句子或邏輯不連貫，請調整上下文
4. 對於寫作模式 (writingMode) 和難度 (difficulty) 字段，除非替換內容顯著改變了寫作難度，否則保持原樣
5. 本地化 humanWritingVoice，確保語調建議符合${config.name}讀者的文化習慣

**請輸出 JSON，格式與輸入相同：**
{
  "generalPlan": [...],
  "conversionPlan": [...],
  "humanWritingVoice": "...",
  "sections": [
    {
      "title": "...",
      "narrativePlan": [...],
      "coreQuestion": "...",
      "difficulty": "easy|medium|unclear",
      "writingMode": "direct|multi_solutions",
      "solutionAngles": [...],
      "subheadings": [...],
      "keyFacts": [...],
      "uspNotes": [...],
      "isChecklist": boolean,
      "suppress": [...],
      "augment": [...],
      "logicalFlow": "...",
      "coreFocus": "...",
      "sentenceStartFeatures": [...],
      "sentenceEndFeatures": [...]
    }
  ]
}

只輸出 JSON，不要其他文字。`;

    const schema = {
        type: 'object',
        properties: {
            generalPlan: { type: 'array', items: { type: 'string' } },
            conversionPlan: { type: 'array', items: { type: 'string' } },
            humanWritingVoice: { type: 'string' },
            sections: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        narrativePlan: { type: 'array', items: { type: 'string' } },
                        coreQuestion: { type: 'string' },
                        difficulty: { type: 'string', enum: ['easy', 'medium', 'unclear'] },
                        writingMode: { type: 'string', enum: ['direct', 'multi_solutions'] },
                        solutionAngles: { type: 'array', items: { type: 'string' } },
                        subheadings: { type: 'array', items: { type: 'string' } },
                        keyFacts: { type: 'array', items: { type: 'string' } },
                        uspNotes: { type: 'array', items: { type: 'string' } },
                        isChecklist: { type: 'boolean' },
                        suppress: { type: 'array', items: { type: 'string' } },
                        augment: { type: 'array', items: { type: 'string' } },
                        logicalFlow: { type: 'string' },
                        coreFocus: { type: 'string' },
                        sentenceStartFeatures: { type: 'array', items: { type: 'string' } },
                        sentenceEndFeatures: { type: 'array', items: { type: 'string' } }
                    }
                }
            }
        },
        required: ['generalPlan', 'conversionPlan', 'sections', 'humanWritingVoice']
    };

    const response = await aiService.runJson<{
        generalPlan: string[];
        conversionPlan: string[];
        humanWritingVoice: string;
        sections: SectionAnalysis[];
    }>(prompt, 'FLASH', schema);

    return {
        localizedGeneralPlan: response.data.generalPlan || data.generalPlan,
        localizedConversionPlan: response.data.conversionPlan || data.conversionPlan,
        localizedSections: response.data.sections || data.sections,
        localizedHumanWritingVoice: response.data.humanWritingVoice || data.humanWritingVoice,
        usage: response.usage,
        cost: response.cost,
        duration: response.duration
    };
};
