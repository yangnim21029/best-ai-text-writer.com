import { TargetAudience, TokenUsage, CostBreakdown } from '../types';
import { PRICING } from '../config/constants';

// Helper: Calculate Cost
export const calculateCost = (usage: any, modelType: keyof typeof PRICING): { usage: TokenUsage, cost: CostBreakdown } => {
    const inputTokens = usage?.promptTokenCount || 0;
    const outputTokens = usage?.candidatesTokenCount || 0;
    const totalTokens = usage?.totalTokenCount || 0;

    const rates = PRICING[modelType];
    const inputCost = inputTokens * rates.input;
    const outputCost = outputTokens * rates.output;

    return {
        usage: { inputTokens, outputTokens, totalTokens },
        cost: { inputCost, outputCost, totalCost: inputCost + outputCost }
    };
};

// Helper: Get Language Instruction
export const getLanguageInstruction = (audience: TargetAudience): string => {
    switch (audience) {
        case 'zh-HK':
            return `
          **OUTPUT LANGUAGE:** Traditional Chinese (Hong Kong).
          - Use Hong Kong specific vocabulary (e.g., '質素' instead of '品質', '互聯網' instead of '網際網路', '智能手機').
          - Style should be natural for Hong Kong readers (Standard Written Chinese with HK nuances).
          - **STRICTLY FORBIDDEN:** Spoken Cantonese particles (e.g., 嘅, 係, 咗, 佢, 咁) unless explicitly requested.
          - Maintain a professional written tone (Standard Written Chinese).
          `;
        case 'zh-MY':
            return `
          **OUTPUT LANGUAGE:** Simplified Chinese (Malaysia).
          - Use Simplified characters.
          - Use Malaysia-specific Chinese vocabulary and context where applicable (e.g., '巴刹' for market, '巴士' for bus, local currency references if needed).
          - Tone: Relatable to Malaysian Chinese readers.
          `;
        case 'zh-TW':
        default:
            return `
          **OUTPUT LANGUAGE:** Traditional Chinese (Taiwan).
          - Use Taiwan specific vocabulary (e.g., '品質', '網際網路', '計程車').
          - Style should be natural for Taiwanese readers.
          - **STRICTLY FORBIDDEN:** Cantonese particles (e.g., 嘅, 係, 咗, 佢, 咁) and Hong Kong specific vocabulary (e.g., '質素').
          - Ensure the tone is standard written Chinese suitable for Taiwan.
          `;
    }
};

// Helper: Extract raw snippets from text based on keywords
export const extractRawSnippets = (text: string, keyword: string, contextWindowChars: number = 100): string[] => {
    if (!text || !keyword) return [];

    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches: string[] = [];
    let match;

    // Limit processing to prevent hang on massive texts
    let count = 0;
    const MAX_LOOPS = 50;

    while ((match = regex.exec(text)) !== null && count < MAX_LOOPS) {
        count++;
        const start = Math.max(0, match.index - contextWindowChars);
        const end = Math.min(text.length, match.index + keyword.length + contextWindowChars);

        // Clean up whitespace
        const snippet = "..." + text.substring(start, end).replace(/\s+/g, ' ').trim() + "...";
        matches.push(snippet);
    }

    // Deduplicate snippets
    const uniqueMatches = Array.from(new Set(matches));

    // Return max 3 snippets to avoid token overflow and UI clutter
    return uniqueMatches.slice(0, 3);
};
