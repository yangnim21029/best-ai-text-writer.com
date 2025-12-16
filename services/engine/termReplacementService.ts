/**
 * Term Replacement Service
 * Fetches term mappings from Google Sheet and replaces terms in content
 * for Hong Kong market localization.
 */

interface TermMapping {
    original: string;
    replacement: string;
}

interface TermReplacementResult {
    content: string;
    replacements: { original: string; replacement: string; count: number }[];
    totalReplacements: number;
}

// Cache for term mappings to avoid repeated fetches
let cachedMappings: TermMapping[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch term mappings from Google Sheet (published as CSV)
 * Sheet format: Column A = Original Term, Column B = Corrected Term for HK
 */
export const fetchTermMappings = async (
    sheetUrl?: string
): Promise<TermMapping[]> => {
    // Check cache first
    if (cachedMappings && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
        return cachedMappings;
    }

    // Default Google Sheet URL (published as CSV)
    const url = sheetUrl ||
        'https://docs.google.com/spreadsheets/d/e/2PACX-1vTHV66jgGnax4Yo_5z7NL_fbMTdGvGsQLipT5qA5BfF5ekm-c9P8joQ-boJdlU0g1S74jqjMpegeZAC/pub?output=csv';

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch term mappings: ${response.status}`);
        }

        const csvText = await response.text();
        const mappings = parseCSV(csvText);

        // Update cache
        cachedMappings = mappings;
        cacheTimestamp = Date.now();

        console.log(`[TermReplacement] Loaded ${mappings.length} term mappings`);
        return mappings;
    } catch (error) {
        console.error('[TermReplacement] Failed to fetch mappings:', error);
        // Return cached data if available, even if expired
        return cachedMappings || [];
    }
};

/**
 * Parse CSV text into term mappings
 * Expects format: Original Term,Corrected Term for HK
 */
const parseCSV = (csvText: string): TermMapping[] => {
    const lines = csvText.trim().split('\n');
    const mappings: TermMapping[] = [];

    // Skip header row (first line)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Handle CSV with potential quoted values
        const parts = parseCSVLine(line);
        if (parts.length >= 2 && parts[0] && parts[1]) {
            mappings.push({
                original: parts[0].trim(),
                replacement: parts[1].trim()
            });
        }
    }

    return mappings;
};

/**
 * Parse a single CSV line, handling quoted values
 */
const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    return result;
};

/**
 * Replace terms in content based on mappings
 * Returns the modified content and replacement statistics
 */
export const replaceTerms = async (
    content: string,
    sheetUrl?: string
): Promise<TermReplacementResult> => {
    const mappings = await fetchTermMappings(sheetUrl);

    if (mappings.length === 0) {
        return {
            content,
            replacements: [],
            totalReplacements: 0
        };
    }

    let modifiedContent = content;
    const replacementStats: { original: string; replacement: string; count: number }[] = [];
    let totalReplacements = 0;

    // Sort mappings by length (longest first) to handle overlapping terms correctly
    const sortedMappings = [...mappings].sort(
        (a, b) => b.original.length - a.original.length
    );

    for (const mapping of sortedMappings) {
        // Create regex for global replacement (case-sensitive for Chinese)
        const regex = new RegExp(escapeRegex(mapping.original), 'g');
        const matches = modifiedContent.match(regex);

        if (matches && matches.length > 0) {
            modifiedContent = modifiedContent.replace(regex, mapping.replacement);
            replacementStats.push({
                original: mapping.original,
                replacement: mapping.replacement,
                count: matches.length
            });
            totalReplacements += matches.length;
        }
    }

    return {
        content: modifiedContent,
        replacements: replacementStats,
        totalReplacements
    };
};

/**
 * Escape special regex characters
 */
const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Clear the cached mappings (useful for forcing refresh)
 */
export const clearTermCache = (): void => {
    cachedMappings = null;
    cacheTimestamp = 0;
};

/**
 * Get current cached mappings (for debugging/display)
 */
export const getCachedMappings = (): TermMapping[] => {
    return cachedMappings || [];
};
