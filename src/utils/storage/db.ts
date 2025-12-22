import Dexie, { type EntityTable } from 'dexie';

export interface CachedImage {
  id: string;
  data: string; // Base64 or URL
  timestamp: number;
}

/**
 * ImageDatabase using Dexie.js
 * Provides a clean API for IndexedDB storage with observability support.
 */
export class ImageDatabase extends Dexie {
  images!: EntityTable<CachedImage, 'id'>;

  constructor() {
    super('image_cache_db');
    this.version(1).stores({
      images: 'id, timestamp',
    });
  }
}

export const db = new ImageDatabase();

// Wrapper functions to maintain compatibility with existing code
export const saveImageToCache = async (id: string, data: string) => {
  try {
    await db.images.put({
      id,
      data,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Dexie: Failed to save image to cache:', error);
  }
};

export const getImageFromCache = async (id: string): Promise<string | null> => {
  try {
    const record = await db.images.get(id);
    return record ? record.data : null;
  } catch (error) {
    console.error('Dexie: Failed to get image from cache:', error);
    return null;
  }
};

export const deleteImageFromCache = async (id: string) => {
  try {
    await db.images.delete(id);
  } catch (error) {
    console.error('Dexie: Failed to delete image from cache:', error);
  }
};

export const clearImageCache = async () => {
  try {
    await db.images.clear();
  } catch (error) {
    console.error('Dexie: Failed to clear image cache:', error);
  }
};
