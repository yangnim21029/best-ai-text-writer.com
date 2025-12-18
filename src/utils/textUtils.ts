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
