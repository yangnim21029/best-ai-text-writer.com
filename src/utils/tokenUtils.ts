import { encodingForModel, TiktokenModel } from "js-tiktoken";

/**
 * Robust token counting and truncation using js-tiktoken.
 */
export const TokenUtils = {
  /**
   * Estimates tokens for a given string.
   * Defaults to gpt-4o encoding as a safe high-water mark for modern LLMs.
   */
  countTokens(text: string, model: string = "gpt-4o"): number {
    try {
      const enc = encodingForModel(model as TiktokenModel);
      return enc.encode(text).length;
    } catch {
      // Fallback to rough character-based estimation if model not supported
      return Math.ceil(text.length / 4);
    }
  },

  /**
   * Truncates a string to stay within a specific token limit.
   */
  truncateToTokens(text: string, maxTokens: number, model: string = "gpt-4o"): string {
    try {
      const enc = encodingForModel(model as TiktokenModel);
      const tokens = enc.encode(text);
      if (tokens.length <= maxTokens) return text;
      
      return enc.decode(tokens.slice(0, maxTokens));
    } catch {
      // Fallback to character-based truncation
      return text.substring(0, maxTokens * 4);
    }
  }
};
