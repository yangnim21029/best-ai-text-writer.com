/**
 * Parsing & Formatting Utilities
 * Consolidated utilities for processing text, markdown, and JSON from AI output.
 */

/**
 * Cleans heading text by removing markdown symbols and quotes.
 */
export const cleanHeadingText = (value: string | undefined): string => {
  return (value || '')
    .replace(/^#+\s*/, '')
    .replace(/["“”]/g, '')
    .trim();
};

/**
 * Removes leading HTML or Markdown headings from a string.
 */
export const stripLeadingHeading = (content: string): string => {
  if (!content) return '';
  const withoutHtmlHeading = content.replace(/^\s*<h[1-6][^>]*>.*?<\/h[1-6]>\s*/i, '');
  const withoutMdHeading = withoutHtmlHeading.replace(/^\s*#{1,6}\s.*(\r?\n|$)/, '');
  return withoutMdHeading.trim();
};

/**
 * Ensures proper markdown formatting from AI output.
 */
export const normalizeMarkdown = (content: string): string => {
  if (!content) return '';
  let normalized = content;
  normalized = normalized.replace(/([^\n])(###\s)/g, '$1\n\n$2');
  normalized = normalized.replace(/([^\n])(\d+\.\s)/g, '$1\n$2');
  normalized = normalized.replace(/([^\n])(-\s)/g, '$1\n$2');
  normalized = normalized.replace(/(\n###\s)/g, '\n\n$1');
  normalized = normalized.replace(/\n{3,}/g, '\n\n');
  return normalized.trim();
};

/**
 * Simple throttle function.
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Robustly extracts and parses JSON from potentially messy AI output.
 */
export const JsonUtils = {
  extractJsonString(text: string): string {
    if (!text) return '';
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return text.substring(firstBrace, lastBrace + 1);
    }
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      return text.substring(firstBracket, lastBracket + 1);
    }
    return text.replace(/```(?:json)?\n?|\n?```/gi, '').trim();
  },

  robustParse<T>(text: string, fallback?: T): T {
    if (!text || typeof text !== 'string') return (fallback ?? {} as T);
    try {
      return JSON.parse(text) as T;
    } catch {
      try {
        const extracted = this.extractJsonString(text);
        return JSON.parse(extracted) as T;
      } catch (e) {
        console.warn('[JsonUtils] Failed to parse JSON even after extraction', {
          preview: text.substring(0, 100),
          error: e
        });
        return (fallback ?? {} as T);
      }
    }
  },

  normalizeKeys<T extends object>(data: any, mapping: Record<string, keyof T>): T {
    if (!data || typeof data !== 'object') return data;
    const result = { ...data };
    for (const [aiKey, targetKey] of Object.entries(mapping)) {
      if (data[aiKey] !== undefined && data[targetKey] === undefined) {
        result[targetKey] = data[aiKey];
      }
    }
    return result as T;
  }
};
