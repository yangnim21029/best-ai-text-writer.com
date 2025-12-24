'use server';

import { fetchUrlContent } from '@/services/research/webScraper';
import { isAuthorizedAction } from './auth';

/**
 * Server Action to scrape content from a URL.
 */
export async function scrapeUrlAction(url: string, options: { includeNav?: boolean } = {}) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  try {
    return await fetchUrlContent(url, options);
  } catch (error) {
    console.error('[scrapeUrlAction] Failed:', error);
    throw error;
  }
}
