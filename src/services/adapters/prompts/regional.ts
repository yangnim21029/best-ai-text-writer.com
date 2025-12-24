import { REGION_CONFIG } from '../../../config/regionConfig';
import { TargetAudience, RegionIssue, SectionAnalysis } from '../../../types';

export const regionalPrompts = {
  detectForeignEntities: (config: any, content: string) => `
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

只輸出 JSON，找不到就返回空陣列。`,

  findRegionEquivalents: (config: any, entityList: string) => `
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
- 每個輸入的實體都必須有一個對應的輸出`,

  rewriteForRegion: (config: any, mappingInstructions: string, content: string) => `
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

只輸出 JSON。`,

  localizePlanWithAI: (replacementGuide: string, plansJson: string) => `你是一位市場內容本地化專家。請將以下段落計劃進行本地化改寫：\n\n替換指引：\n${replacementGuide}\n\n原始計劃：\n${plansJson}`,

  regionalBrandAnalysis: ({ 
    content,
    targetAudience,
  }: { 
    content: string;
    targetAudience: string;
  }) => `
TASK: Analyze the content for ** Regional Terminology ** and ** Brand Availability ** conflicts in: ${targetAudience}.

<TargetAudience>
  ${targetAudience}
</TargetAudience>

    Using Google Search(Grounding), verify:
1. ** Brand Availability **: Are mentioned brands / products actually available / popular in ${targetAudience}?(e.g.A Taiwan - only clinic appearing in a Hong Kong article is a mismatch).
2. ** Regional Vocabulary **: Replace obvious dialect terms(e.g. "視頻" -> "影片" for TW).

    <ContentSnippet>
    ${content.slice(0, 15000)}...
</ContentSnippet>

    OUTPUT JSON:
[
  { "original": "Wrong Term", "replacement": "Correct Term", "reason": "Reason (e.g. 'Taiwan-only brand')" }
]
    Return JSON only.If no issues, return [].
    `,
};
