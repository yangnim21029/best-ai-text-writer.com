import { ScrapedImage } from '../types';

export const toggleImage = (
  images: ScrapedImage[],
  imageToToggle: ScrapedImage
): ScrapedImage[] => {
  const keyToMatch = imageToToggle.id || imageToToggle.url || imageToToggle.altText;

  return images.map((img, idx) => {
    const key = img.id || img.url || img.altText || `${idx}`;
    if (key !== keyToMatch) return img;
    return { ...img, ignored: !img.ignored };
  });
};

export const getActiveImages = (images: ScrapedImage[]): ScrapedImage[] => {
  return images.filter((img) => !img.ignored);
};

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

/**
 * Get a compressed version of an image URL using images.weserv.nl proxy.
 */
export const getCompressedImageUrl = (url: string, quality = 85): string => {
  if (!url || url.startsWith('data:')) return url;
  // Proxies through weserv.nl for compression
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&q=${quality}&output=webp&we`;
};

/**
 * Compress a Data URL (base64) by drawing to a canvas and re-exporting.
 */
export const compressImageDataUrl = async (
  dataUrl: string,
  quality = 0.8,
  maxWidth = 1200
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/webp', quality));
    };
    img.onerror = () => resolve(dataUrl); // Fallback to original
    img.src = dataUrl;
  });
};

/**
 * High-level compression that handles both URLs and Data URLs.
 */
export const compressImage = async (path: string): Promise<string> => {
  if (path.startsWith('data:')) {
    return compressImageDataUrl(path);
  }

  try {
    const compressedUrl = getCompressedImageUrl(path);
    const res = await fetch(compressedUrl);
    if (!res.ok) return path;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return path;
  }
};
/**
 * Download an image from a URL.
 */
export const downloadImage = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Failed to download image:', error);
  }
};
