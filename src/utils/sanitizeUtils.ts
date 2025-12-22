import DOMPurify from 'dompurify';

/**
 * Sanitizes AI-generated HTML to prevent XSS.
 */
export const SanitizeUtils = {
  /**
   * Sanitizes a string of HTML.
   */
  sanitizeHtml(html: string): string {
    if (typeof window === 'undefined') {
      // In server-side rendering, we return as is or use a Node-compatible sanitizer
      // For now, most generation happens client-side in the Tiptap context.
      return html;
    }
    return DOMPurify.sanitize(html);
  },

  /**
   * Clean markdown text (optional helper)
   */
  cleanMarkdown(text: string): string {
    return text.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '');
  }
};
