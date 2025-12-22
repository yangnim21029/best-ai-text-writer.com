import { NextRequest, NextResponse } from 'next/server';
import { fetchUrlContent } from '../../../services/research/webScraper';

export async function POST(request: NextRequest) {
    try {
        const { url } = await request.json();

        if (!url) {
            return NextResponse.json(
                { error: 'URL is required' },
                { status: 400 }
            );
        }

        // Add a 30-second timeout race
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Scraping timed out (30s)')), 30000)
        );

        const scrapePromise = fetchUrlContent(url);

        const result = await Promise.race([scrapePromise, timeoutPromise]) as Awaited<ReturnType<typeof fetchUrlContent>>;

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('[API/Scrape] Error:', error);
        return NextResponse.json(
            {
                error: 'Failed to scrape URL',
                details: error.message
            },
            { status: 500 }
        );
    }
}
