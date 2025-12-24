import 'server-only';
import { ScrapedImage } from '../../types';
import { fetchWithRetry } from '../../utils/fetchUtils';
import { SCRAPING_JUNK_PHRASES, SCRAPING_NOISE_WORDS, BRAND_UI_JUNK } from '../../config/scrapingRules';

/**
 * Web Scraper Service
 * Uses Jina AI Reader (https://jina.ai/reader) to turn URLs into LLM-friendly Markdown.
 */

// Added options interface
interface FetchOptions {
  includeNav?: boolean;
  signal?: AbortSignal;
}

// In-memory cache for successful scrapes
const SCRAPE_CACHE = new Map<string, { data: { title: string; content: string; images: ScrapedImage[] }; ts: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export const fetchUrlContent = async (
  url: string,
  options: FetchOptions = {}
): Promise<{ title: string; content: string; images: ScrapedImage[] }> => {
  if (!url) return { title: '', content: '', images: [] };

  const cacheKey = `${url}|nav:${!!options.includeNav}`;
  const cached = SCRAPE_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    console.log(`[WebScraper] Serving cached content for: ${url}`);
    return cached.data;
  }

  try {
    new URL(url);
  } catch (_) {
    throw new Error('Invalid URL format');
  }

  try {
    // Construct headers, optionally including/excluding nav
    const headers: Record<string, string> = {
      'x-no-cache': 'false', // bypass cached content
      'X-Md-Heading-Style': 'setext', // setext headings (=== for H1, --- for H2)
    };

    if (!options.includeNav) {
      // Default behavior: Remove nav, header, footer for article reading
      headers['X-Remove-Selector'] = 'header, footer, nav, aside';
    } else {
      // If includeNav is true, we might still want to remove ads/sidebars but keep header/footer
      headers['X-Remove-Selector'] = 'aside'; // Keep header/footer/nav for contact info
    }

    const response = await fetchWithRetry(`https://r.jina.ai/${url}`, {
      method: 'GET',
      headers: headers,
      signal: options.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.statusText}`);
    }

    const rawText = await response.text();

    if (!rawText || rawText.length < 50) {
      throw new Error('Content retrieved is too short or empty.');
    }

    const cleaned = cleanJinaBySeparator(rawText);

    // Cache only on success AND if content is substantial (>500 chars)
    // This avoids caching "soft 404s" or captcha pages
    if (cleaned.content.length > 500) {
      SCRAPE_CACHE.set(cacheKey, { data: cleaned, ts: Date.now() });
    }

    return { ...cleaned };
  } catch (error: any) {
    console.error('Web Scraping Error:', error);
    throw new Error(error.message || 'Failed to scrape URL');
  }
};

const extractImagesFromContent = (text: string, range: number = 50): ScrapedImage[] => {
  // Regex to capture ![alt](url)
  const regex = /!\[(.*?)\]\((.*?)\)/g;
  let match;
  const rawMatches: { index: number; length: number; image: ScrapedImage }[] = [];

  while ((match = regex.exec(text)) !== null) {
    const fullMatchStr = match[0];
    const altText = match[1];
    const url = match[2];
    const matchIndex = match.index;
    const matchLength = fullMatchStr.length;

    const startPos = Math.max(0, matchIndex - range);
    const endPos = Math.min(text.length, matchIndex + matchLength + range);

    const preContext = text.substring(startPos, matchIndex).trim();
    const postContext = text.substring(matchIndex + matchLength, endPos).trim();

    rawMatches.push({
      index: matchIndex,
      length: matchLength,
      image: {
        url,
        preContext,
        altText,
        postContext,
      },
    });
  }

  if (rawMatches.length <= 10) {
    return rawMatches.map((item) => item.image);
  }

  const filteredImages: ScrapedImage[] = [];
  let lastEndPos = -1;

  for (const item of rawMatches) {
    if (lastEndPos === -1) {
      filteredImages.push(item.image);
      lastEndPos = item.index + item.length;
      continue;
    }

    const textBetween = text.substring(lastEndPos, item.index);
    const meaningfulContent = textBetween.replace(/\s/g, '');

    if (meaningfulContent.length >= 30) {
      filteredImages.push(item.image);
      lastEndPos = item.index + item.length;
    }
  }

  return filteredImages;
};

const cleanJinaBySeparator = (
  rawText: string
): { title: string; content: string; images: ScrapedImage[] } => {
  const titleMatch = rawText.match(/^Title:\s*(.+)$/m);
  let title = titleMatch ? titleMatch[1].trim() : '';

  let contentBody = rawText;
  if (rawText.includes('Markdown Content:')) {
    const parts = rawText.split('Markdown Content:');
    contentBody = parts.slice(1).join('Markdown Content:');
  }

  // Fallback: If no metadata title, find first H1
  if (!title) {
    const h1Match = contentBody.match(/^\s*#\s+(.+)$/m);
    if (h1Match) {
      title = h1Match[1].trim();
    }
  }

  // Preserve heading structure: convert setext (=== / ---) to ATX (# / ##)
  let cleanContent = convertSetextToAtx(contentBody.trim());

  // Extract images BEFORE cleaning them out
  const images = extractImagesFromContent(cleanContent);

  // Apply cleaning
  cleanContent = cleanArtifacts(cleanContent);

  if (title && !cleanContent.startsWith('#')) {
    cleanContent = `# ${title}\n\n${cleanContent}`;
  }

  return { title, content: cleanContent, images };
};

// Convert setext headings (text + === / ---) into ATX (# / ##) so they survive later cleanup.
// Skip fenced code blocks to avoid rewriting literal divider lines inside code samples.
const convertSetextToAtx = (text: string): string => {
  const lines = text.split('\n');
  const out: string[] = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Toggle code fence state
    if (/^\s*(```|~~~)/.test(line.trim())) {
      inFence = !inFence;
      out.push(line);
      continue;
    }

    if (!inFence && i + 1 < lines.length) {
      const underline = lines[i + 1];
      const match = underline.match(/^\s*(=+|-+)\s*$/);
      const hasText = line.trim().length > 0;
      const prevIsBlank = i === 0 || lines[i - 1].trim() === '';

      if (match && hasText && prevIsBlank) {
        const level = match[1].startsWith('=') ? '#' : '##';
        out.push(`${level} ${line.trim()}`);
        i++; // Skip underline line
        continue;
      }
    }

    out.push(line);
  }

  return out.join('\n');
};

/**
 * FIXED: Optimized Cleaning Logic
 * Corrects issues with leftover image markdown, broken links, and specific UI junk.
 */
const cleanArtifacts = (text: string): string => {
  let cleaned = text;

  // ============================================================
  // 1. Specific Junk Phrase Removal (Requested User Rules)
  // ============================================================

  const junkPhrases = [
    ...SCRAPING_JUNK_PHRASES,
    ...SCRAPING_NOISE_WORDS,
    ...BRAND_UI_JUNK,
  ];

  junkPhrases.forEach((regex) => {
    cleaned = cleaned.replace(regex, '');
  });

  // ============================================================
  // 2. Image Cleanup (Prioritized)
  // ============================================================

  // Fix: Remove standard markdown images `![Alt](Url)`
  cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, '');

  // Jina non-standard image artifacts cleanup
  cleaned = cleaned.replace(/^!Image\s+\d+:.*$/gm, '');
  cleaned = cleaned.replace(/!Image\s*\[.*?\]/gi, '');

  // Remove orphaned closing link syntax often left behind
  cleaned = cleaned.replace(/^\]\(.*?\)/gm, '');

  // ============================================================
  // 3. Link Density Filter
  // ============================================================

  const linkRegex = /\[(.*?)\]\(.*?\)/g;
  const linkMatches: { index: number; length: number }[] = [];
  let lMatch;

  while ((lMatch = linkRegex.exec(cleaned)) !== null) {
    linkMatches.push({ index: lMatch.index, length: lMatch[0].length });
  }

  if (linkMatches.length > 6) {
    const indicesToRemove: { start: number; end: number }[] = [];
    let lastValidEnd = -1;

    for (let i = 0; i < linkMatches.length; i++) {
      const m = linkMatches[i];
      const mStart = m.index;
      const mEnd = mStart + m.length;

      if (i === 0) {
        lastValidEnd = mEnd;
        continue;
      }

      const textBetween = cleaned.substring(lastValidEnd, mStart);
      if (textBetween.replace(/\s/g, '').length < 30) {
        indicesToRemove.push({ start: mStart, end: mEnd });
      } else {
        lastValidEnd = mEnd;
      }
    }

    // Reverse loop removal to keep indices valid
    for (let i = indicesToRemove.length - 1; i >= 0; i--) {
      const range = indicesToRemove[i];
      cleaned = cleaned.substring(0, range.start) + cleaned.substring(range.end);
    }
  }

  // ============================================================
  // 4. General Link Cleaning
  // ============================================================

  // Remove empty links
  cleaned = cleaned.replace(/\[\s*\]\(.*?\)/g, '');

  // Remove resulting empty list items
  cleaned = cleaned.replace(/^\s*([-*]|\d+\.)\s*$/gm, '');

  // Flatten Links: Convert `[Text](Url)` to `Text`
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

  // ============================================================
  // 5. Noise & Metadata Cleanup
  // ============================================================

  // Google Analytics / Ads artifacts
  cleaned = cleaned.replace(/^\s*(UA-\d+-\d+|G-[A-Z0-9]+)\s*$/gm, '');

  // HK style "All Chinese" navs
  cleaned = cleaned.replace(/^All\s+[\u4e00-\u9fa5]+.*$/gm, '');

  // User-requested noise lines between content
  cleaned = cleaned.replace(/^\s*-{3,}\s*$/gm, ''); // ----- separators

  // Final Whitespace Cleanup
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
};
