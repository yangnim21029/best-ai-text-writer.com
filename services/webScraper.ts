
import { ScrapedImage } from '../types';

/**
 * Web Scraper Service
 * Uses Jina AI Reader (https://jina.ai/reader) to turn URLs into LLM-friendly Markdown.
 */

// Added options interface
interface FetchOptions {
    includeNav?: boolean;
}

export const fetchUrlContent = async (url: string, options: FetchOptions = {}): Promise<{ title: string, content: string, images: ScrapedImage[] }> => {
  if (!url) return { title: '', content: '', images: [] };

  try {
    new URL(url);
  } catch (_) {
    throw new Error("Invalid URL format");
  }

  try {
    // Construct headers, optionally including/excluding nav
    const headers: Record<string, string> = {
        'x-no-cache': 'true'
    };

    if (!options.includeNav) {
        // Default behavior: Remove nav, header, footer for article reading
        headers['X-Remove-Selector'] = 'header, footer, nav, aside';
    } else {
        // If includeNav is true, we might still want to remove ads/sidebars but keep header/footer
        headers['X-Remove-Selector'] = 'aside'; // Keep header/footer/nav for contact info
    }

    const response = await fetch(`https://r.jina.ai/${url}`, {
        method: 'GET',
        headers: headers
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.statusText}`);
    }

    const rawText = await response.text();
    
    if (!rawText || rawText.length < 50) {
        throw new Error("Content retrieved is too short or empty.");
    }

    return cleanJinaBySeparator(rawText);

  } catch (error: any) {
    console.error("Web Scraping Error:", error);
    throw new Error(error.message || "Failed to scrape URL");
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
        postContext
      }
    });
  }

  if (rawMatches.length <= 10) {
      return rawMatches.map(item => item.image);
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

const cleanJinaBySeparator = (rawText: string): { title: string, content: string, images: ScrapedImage[] } => {
    const titleMatch = rawText.match(/^Title:\s*(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : '';

    let contentBody = rawText;
    if (rawText.includes('Markdown Content:')) {
        const parts = rawText.split('Markdown Content:');
        contentBody = parts.slice(1).join('Markdown Content:'); 
    }

    let cleanContent = contentBody.trim();

    // Extract images BEFORE cleaning them out
    const images = extractImagesFromContent(cleanContent);

    // Apply cleaning
    cleanContent = cleanArtifacts(cleanContent);

    if (title && !cleanContent.startsWith('#')) {
        cleanContent = `# ${title}\n\n${cleanContent}`;
    }

    return { title, content: cleanContent, images };
};

/**
 * FIXED: Optimized Cleaning Logic
 * Corrects issues with leftover image markdown and broken links.
 */
const cleanArtifacts = (text: string): string => {
    let cleaned = text;

    // ============================================================
    // 1. Image Cleanup (優先處理)
    // ============================================================

    // 修正：使用標準 Markdown 語法移除圖片 `![Alt](Url)`
    // 原本的 Regex 漏掉了 `[`，導致 `![Image 11:...]` 沒被抓到
    cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, '');

    // 針對 Jina 可能產生的非標準 Image 標記進行清理
    // 移除開頭是 "!Image 數字:" 的整行 (即使沒有連結)
    cleaned = cleaned.replace(/^!Image\s+\d+:.*$/gm, '');
    // 移除文字中間的 "!Image [數字]"
    cleaned = cleaned.replace(/!Image\s*\[.*?\]/gi, '');
    
    // 移除殘留的孤兒 "](url)" (這是你截圖中出現的錯誤)
    // 發生原因通常是 Regex 沒配對好，導致前半段不見但後半段留著
    cleaned = cleaned.replace(/^\]\(.*?\)/gm, '');


    // ============================================================
    // 2. Link Density Filter (連結密度過濾)
    // ============================================================

    const linkRegex = /\[(.*?)\]\(.*?\)/g;
    const linkMatches: {index: number, length: number}[] = [];
    let lMatch;
    
    while ((lMatch = linkRegex.exec(cleaned)) !== null) {
        linkMatches.push({ index: lMatch.index, length: lMatch[0].length });
    }

    if (linkMatches.length > 6) {
        const indicesToRemove: {start: number, end: number}[] = [];
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
    // 3. General Link Cleaning (一般連結清理)
    // ============================================================

    // 刪除空連結 `[](...)` 或 `[ ](...)`
    cleaned = cleaned.replace(/\[\s*\]\(.*?\)/g, '');

    // 刪除因此產生的空 list item (例如 "* ")
    cleaned = cleaned.replace(/^\s*([-*]|\d+\.)\s*$/gm, '');

    // Flatten Links: 將 `[Text](Url)` 轉為 `Text`
    // 使用更精確的 Regex: `[^\]]+` 確保不會吃到多餘的括號
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

    // ============================================================
    // 4. Noise & Metadata Cleanup
    // ============================================================

    // Google Analytics / Ads artifacts
    cleaned = cleaned.replace(/^\s*(UA-\d+-\d+|G-[A-Z0-9]+)\s*$/gm, '');
    
    // Common noise words (Case insensitive)
    cleaned = cleaned.replace(/^(holiday|girlstyle|businessfocus|mamidaily)\s*$/gim, '');
    
    // HK style "All Chinese" navs
    cleaned = cleaned.replace(/^All\s+[\u4e00-\u9fa5]+.*$/gm, '');
    
    // Final Whitespace Cleanup
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

    return cleaned;
};