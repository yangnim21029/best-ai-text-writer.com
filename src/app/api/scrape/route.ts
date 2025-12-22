import { NextRequest, NextResponse } from 'next/server';
import { fetchUrlContent } from '../../../services/research/webScraper';

export async function POST(request: NextRequest) {
  let timeoutId: NodeJS.Timeout | undefined;

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'URL_REQUIRED', message: 'URL is required' }, { status: 400 });
    }

    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout (slightly more than fetchUrlContent)

    try {
      const result = await fetchUrlContent(url, { signal: controller.signal });
      return NextResponse.json(result);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return NextResponse.json(
          { error: 'SCRAPE_TIMEOUT', message: 'Scraping timed out after 35 seconds' },
          { status: 408 }
        );
      }
      throw err;
    }
  } catch (error: any) {
    console.error('[API/Scrape] Error:', error);
    return NextResponse.json(
      {
        error: 'SCRAPE_FAILED',
        message: 'Failed to scrape URL',
        details: error.message,
      },
      { status: 500 }
    );
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
