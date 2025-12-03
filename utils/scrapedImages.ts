import { ScrapedImage } from '../types';

const buildKey = (img: ScrapedImage, idx: number) => {
    if (img.url?.trim()) return `url:${img.url.trim()}`;
    if (img.altText?.trim()) return `alt:${img.altText.trim()}`;
    return `idx:${idx}`;
};

/**
 * Remove duplicate images while preserving the first occurrence order.
 * Prefers URL for uniqueness, then alt text as a fallback.
 */
export const dedupeScrapedImages = (images: ScrapedImage[]) => {
    const seen = new Set<string>();
    return images.filter((img, idx) => {
        const key = buildKey(img, idx);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};
