import { aiService } from '../engine/aiService';
import { Type } from '../engine/schemaTypes';
import { TokenUsage, CostBreakdown, TargetAudience, SectionAnalysis } from '../../types';
import { REGION_CONFIG } from '../../config/regionConfig';
import { RegionIssue } from './regionGroundingService';

/**
 * AI logic for detecting entities from other regions
 */
export const detectForeignEntitiesAI = async (
  content: string,
  targetAudience: TargetAudience
): Promise<{
  entities: { text: string; type: string; region: string }[];
  usage: TokenUsage;
  cost: CostBreakdown;
  duration: number;
}> => {
  const config = REGION_CONFIG[targetAudience];
  if (!config) return { entities: [], usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: 0 };

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
  }>(prompt, 'FLASH', {
    schema: {
      type: Type.OBJECT,
      properties: {
        entities: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              type: { type: Type.STRING },
              region: { type: Type.STRING },
            },
          },
        },
      },
    },
  });

  const foreignEntities = (response.data.entities || []).filter(
    (e) => config.excludeRegions.includes(e.region) || e.region === 'OTHER'
  );

  return { entities: foreignEntities, usage: response.usage, cost: response.cost, duration: response.duration };
};

/**
 * AI logic for finding regional equivalents
 */
export const findRegionEquivalentsAI = async (
  entities: { text: string; type: string; region: string }[],
  targetAudience: TargetAudience
): Promise<{
  mappings: RegionIssue[];
  usage: TokenUsage;
  cost: CostBreakdown;
  duration: number;
}> => {
  const config = REGION_CONFIG[targetAudience];
  if (entities.length === 0 || !config) return { mappings: [], usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: 0 };

  const entityList = entities.map((e) => `- ${e.text} (${e.type})`).join('\n');
  const prompt = `
你是一位${config.name}市場專家。請為以下非${config.name}實體找出${config.name}適合的替代選項。

**需要查找替代的實體：**
${entityList}

**替代選項優先順序（請依序嘗試）：**
1. **直接對應** - ${config.name}市場中功能相同的品牌/服務
2. **同類替代** - 同品類中${config.name}較知名的品牌
3. **通用描述** - 如果找不到具體品牌，使用通用描述
4. **刪除** - 只有在完全無法描述時才使用「[刪除]」

**重要規則：**
- 盡量提供替代，不要輕易使用「[刪除]」
- 通用描述也是可接受的替代
- 每個輸入的實體都必須有一個對應的輸出`;

  const response = await aiService.runJson<{
    mappings: RegionIssue[];
  }>(prompt, 'FLASH', {
    schema: {
      type: Type.OBJECT,
      properties: {
        mappings: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING },
              original: { type: Type.STRING },
              regionEquivalent: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              context: { type: Type.STRING },
              sourceRegion: { type: Type.STRING },
            },
            required: ['original', 'regionEquivalent', 'context'],
          },
        },
      },
      required: ['mappings'],
    },
    useSearch: true,
  });

  return { mappings: response.data.mappings || [], usage: response.usage, cost: response.cost, duration: response.duration };
};

/**
 * AI logic for rewriting content
 */
export const rewriteForRegionAI = async (
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
  if (mappings.length === 0 || !config) return { rewrittenContent: content, changes: [], usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: 0 };

  const mappingInstructions = mappings
    .map((m) => `- 「${m.original}」→「${m.regionEquivalent}」：${m.context}`)
    .join('\n');

  const prompt = `
你是一位${config.name}市場內容編輯專家。請根據以下替換指引，改寫內容使其適合${config.name}讀者。

**替換指引：**
${mappingInstructions}

**改寫規則：**
1. 保持原文語意和結構
2. 只替換指定的實體，其他內容保持不變
3. 確保替換後的句子通順自然

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
  }>(prompt, 'FLASH', {
    schema: {
      type: Type.OBJECT,
      properties: {
        rewrittenContent: { type: Type.STRING },
        changes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING },
              rewritten: { type: Type.STRING },
            },
          },
        },
      },
    },
  });

  return {
    rewrittenContent: response.data.rewrittenContent || content,
    changes: response.data.changes || [],
    usage: response.usage,
    cost: response.cost,
    duration: response.duration,
  };
};
