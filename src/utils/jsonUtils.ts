/**
 * Robustly extracts and parses JSON from potentially messy AI output
 */
export const JsonUtils = {
  /**
   * Extracts the JSON portion of a string by finding the first '{' or '[' 
   * and the corresponding last '}' or ']'.
   */
  extractJsonString(text: string): string {
    if (!text) return '';
    
    // Attempt to find the first '{' and last '}'
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return text.substring(firstBrace, lastBrace + 1);
    }
    
    // Fallback to finding '[' and ']'
    const firstBracket = text.indexOf('[');
    const lastBracket = text.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      return text.substring(firstBracket, lastBracket + 1);
    }

    // Last resort: Clean markdown fences
    return text.replace(/```(?:json)?\n?|\n?```/gi, '').trim();
  },

  /**
   * Safely parses JSON with a robust extraction fallback
   */
  robustParse<T>(text: string, fallback?: T): T {
    if (!text || typeof text !== 'string') return (fallback ?? {} as T);
    
    try {
      // Try direct parse first
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

  /**
   * Normalizes common AI naming inconsistencies (camelCase vs snake_case)
   */
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
