import { TargetAudience, TokenUsage, CostBreakdown } from '../../types';
import { PRICING } from '../../config/constants';

const asNumber = (...values: any[]): number => {
  for (const value of values) {
    const num = typeof value === 'string' ? Number(value) : value;
    if (typeof num === 'number' && Number.isFinite(num)) {
      return num;
    }
  }
  return 0;
};

const pickUsageContainer = (usage: any): any => {
  if (!usage || typeof usage !== 'object') return null;

  // Prefer totalUsage when present (Vercel AI SDK format)
  if (usage.totalUsage || usage.usage) {
    return usage.totalUsage || usage.usage;
  }

  // Sometimes usage is nested under data/metadata
  if (usage.data?.totalUsage || usage.data?.usage) {
    return usage.data.totalUsage || usage.data.usage;
  }
  if (usage.metadata?.totalUsage || usage.metadata?.usage) {
    return usage.metadata.totalUsage || usage.metadata.usage;
  }

  return usage;
};

export const normalizeTokenUsage = (usage: any): TokenUsage => {
  const source = pickUsageContainer(usage) || {};

  let inputTokens = asNumber(
    source.inputTokens,
    source.promptTokens,
    source.prompt_tokens,
    source.input_tokens,
    source.promptTokenCount,
    source.inputTokenCount,
    source.tokens?.inputTokens,
    source.tokens?.promptTokens
  );

  let outputTokens = asNumber(
    source.outputTokens,
    source.completionTokens,
    source.output_tokens,
    source.completion_tokens,
    source.candidatesTokenCount,
    source.outputTokenCount,
    source.tokens?.outputTokens,
    source.tokens?.completionTokens
  );

  let totalTokens = asNumber(
    source.totalTokens,
    source.total_tokens,
    source.totalTokenCount,
    source.tokens?.totalTokens
  );

  if (!totalTokens) {
    totalTokens = inputTokens + outputTokens;
  } else if (!inputTokens && outputTokens && totalTokens >= outputTokens) {
    inputTokens = totalTokens - outputTokens;
  } else if (!outputTokens && inputTokens && totalTokens >= inputTokens) {
    outputTokens = totalTokens - inputTokens;
  } else if (!inputTokens && !outputTokens) {
    inputTokens = totalTokens;
  }

  return {
    inputTokens,
    outputTokens,
    totalTokens,
  };
};

// Helper: Calculate Cost
export const calculateCost = (
  usage: any,
  modelType: keyof typeof PRICING
): { usage: TokenUsage; cost: CostBreakdown } => {
  const normalized = normalizeTokenUsage(usage);
  const rates = PRICING[modelType] || { input: 0, output: 0 };

  const inputCost = normalized.inputTokens * (rates.input || 0);
  const outputCost = normalized.outputTokens * (rates.output || 0);

  return {
    usage: normalized,
    cost: { inputCost, outputCost, totalCost: inputCost + outputCost },
  };
};

// Helper: Normalize usage to TokenUsage shape
export const toTokenUsage = (usage: any): TokenUsage => normalizeTokenUsage(usage);

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
export const extractRawSnippets = (
  text: string,
  keyword: string,
  contextWindowChars: number = 100
): string[] => {
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
    const snippet = '...' + text.substring(start, end).replace(/\s+/g, ' ').trim() + '...';
    matches.push(snippet);
  }

  // Deduplicate snippets
  const uniqueMatches = Array.from(new Set(matches));

  // Return max 3 snippets to avoid token overflow and UI clutter
  return uniqueMatches.slice(0, 3);
};
