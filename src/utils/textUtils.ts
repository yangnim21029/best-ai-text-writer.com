export const cleanHeadingText = (value: string | undefined): string => {
    return (value || '')
        .replace(/^#+\s*/, '')
        .replace(/["“”]/g, '')
        .trim();
};

export const stripLeadingHeading = (content: string): string => {
    if (!content) return '';
    // Remove a leading H1/H2/H3 tag or markdown heading to avoid duplicates after we inject headings ourselves.
    const withoutHtmlHeading = content.replace(/^\s*<h[1-6][^>]*>.*?<\/h[1-6]>\s*/i, '');
    const withoutMdHeading = withoutHtmlHeading.replace(/^\s*#{1,6}\s.*(\r?\n|$)/, '');
    return withoutMdHeading.trim();
};

/**
 * Ensures proper markdown formatting from AI output.
 * Fixes missing newlines before headers and list items that often occur in JSON mode.
 */
export const normalizeMarkdown = (content: string): string => {
    if (!content) return '';

    let normalized = content;

    // 1. Ensure newline before H3 headers if they are smashed against text (e.g. "text### Heading")
    normalized = normalized.replace(/([^\n])(###\s)/g, '$1\n\n$2');

    // 2. Ensure newline before list items if they are smashed against text (e.g. "text1. Item")
    // Fixes "text1. Item" -> "text\n1. Item"
    normalized = normalized.replace(/([^\n])(\d+\.\s)/g, '$1\n$2');

    // Fixes "text- Item" -> "text\n- Item"
    normalized = normalized.replace(/([^\n])(-\s)/g, '$1\n$2');

    // 3. Ensure double newlines between block elements if they only have one
    // But be careful not to break lists which only need one newline between items.
    // For now, let's just focus on H3 and Paragraph separation.
    normalized = normalized.replace(/(\n###\s)/g, '\n\n$1');

    // Cleanup triple+ newlines
    normalized = normalized.replace(/\n{3,}/g, '\n\n');

    return normalized.trim();
};
