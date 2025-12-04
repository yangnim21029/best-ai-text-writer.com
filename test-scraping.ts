/**
 * Web Scraping Test Script
 * Tests Jina AI Reader with rate limiting for free plan
 * 
 * Jina Reader Free Plan Limits:
 * - 200 requests/hour
 * - 1 request/second recommended
 */

import { fetchUrlContent } from './services/webScraper';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test URLs from various Taiwan/HK beauty & lifestyle sites
const TEST_URLS = [
    'https://www.cosmopolitan.com.hk/cosmobody/partridge-soup-recipe-recommendations',
    'https://www.womenshealthmag.com/tw/beauty/hair/g62835899/2025-girl-hairstyle/',
    'https://pandafishtravel.tw/world_travel/archives/6839/',
    'https://www.harpersbazaar.com/tw/beauty/hair/g62040390/2025-hair-styles/',
    'https://www.elle.com/tw/beauty/news/g65456238/olive-young-2025-top15-new/',
    'https://www.round2hairsalon.com.tw/news-detail/5-wolf-tail-hairstyles/',
    'https://www.marieclaire.com.tw/beauty/perfume-and-nails/88121',
    'https://allaspect.tw/article/2025-man-hair-top10',
    'https://www.vogue.com.tw/beauty/article/%E5%85%89%E7%99%82%E7%BE%8E%E7%94%B2%E6%8C%87%E7%94%B2%E6%B2%B9%E5%BF%85%E7%9F%A5%E7%9A%84%E7%A7%98%E8%A8%A3',
    'https://www.perfectcorp.com/zh-tw/consumer/blog/hair/hairstyles-for-round-face-shape',
    'https://rakuraku-jp.com/blogs/news/whitening-tablets',
    'https://www.commonhealth.com.tw/article/88999',
    'https://www.commonhealth.com.tw/article/87720',
    'https://www.marieclaire.com.tw/beauty/hair/84130',
    'https://www.beauty321.com/post/66710',
    'https://www.harpersbazaar.com/tw/beauty/nail-design/g33989797/french-nail-collection/',
    'https://www.cosmopolitan.com.hk/beauty/gel-nail-hot-trends',
    'https://www.elle.com/tw/beauty/hair/g36495209/korean-hairstyle-for-mid-length-hair/',
    'https://www.elle.com.hk/beauty_and_health/10-style-tips-for-trendy-princess-cut-hairstyles-updated',
    'https://www.cosmopolitan.com/tw/beauty/make-up/g64708927/2025-feet-nail/',
    'https://www.pinterest.com/pin/1121537113433744041/',
    'https://www.beauty321.com/post/65398',
    'https://wandou.tw/olive-young/',
    'https://www.elle.com.hk/beauty_and_health/top-25-products-from-olive-young-new'
];

interface ScrapingResult {
    url: string;
    success: boolean;
    title?: string;
    contentLength?: number;
    imageCount?: number;
    error?: string;
    duration: number;
}

// Rate limiter: 1 request per second (safe for free plan)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testSingleUrl(url: string): Promise<ScrapingResult> {
    const startTime = Date.now();

    try {
        console.log(`\n🔍 Scraping: ${url}`);

        const result = await fetchUrlContent(url);
        const duration = Date.now() - startTime;

        const scrapingResult: ScrapingResult = {
            url,
            success: true,
            title: result.title,
            contentLength: result.content.length,
            imageCount: result.images.length,
            duration
        };

        console.log(`✅ Success: "${result.title}"`);
        console.log(`   📄 Content: ${result.content.length} chars`);
        console.log(`   🖼️  Images: ${result.images.length}`);
        console.log(`   ⏱️  Time: ${duration}ms`);

        return scrapingResult;

    } catch (error: any) {
        const duration = Date.now() - startTime;

        console.log(`❌ Failed: ${error.message}`);

        return {
            url,
            success: false,
            error: error.message,
            duration
        };
    }
}

async function runTests(urls: string[], batchSize: number = 5) {
    const results: ScrapingResult[] = [];
    const outputDir = path.join(__dirname, 'output');

    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`\n🚀 Starting Web Scraping Test`);
    console.log(`📊 Total URLs: ${urls.length}`);
    console.log(`⏱️  Rate Limit: 1 request/second`);
    console.log(`📦 Batch Size: ${batchSize} URLs`);
    console.log(`⏳ Estimated Time: ~${urls.length} seconds\n`);
    console.log('='.repeat(60));

    // Process in batches
    for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, Math.min(i + batchSize, urls.length));
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(urls.length / batchSize);

        console.log(`\n📦 Batch ${batchNumber}/${totalBatches} (${batch.length} URLs)`);
        console.log('-'.repeat(60));

        for (const url of batch) {
            const result = await testSingleUrl(url);
            results.push(result);

            // Rate limiting: 1 second delay between requests
            if (results.length < urls.length) {
                await delay(1000);
            }
        }

        // Extra delay between batches
        if (i + batchSize < urls.length) {
            console.log(`\n⏸️  Waiting 2 seconds before next batch...`);
            await delay(2000);
        }
    }

    // Generate summary
    console.log('\n' + '='.repeat(60));
    console.log('\n📊 SUMMARY REPORT\n');
    console.log('='.repeat(60));

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    console.log(`📈 Success Rate: ${((successful.length / results.length) * 100).toFixed(1)}%`);

    if (successful.length > 0) {
        const avgContent = successful.reduce((sum, r) => sum + (r.contentLength || 0), 0) / successful.length;
        const avgImages = successful.reduce((sum, r) => sum + (r.imageCount || 0), 0) / successful.length;
        const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;

        console.log(`\n📊 Averages (Successful):`);
        console.log(`   Content Length: ${Math.round(avgContent)} chars`);
        console.log(`   Images per URL: ${Math.round(avgImages)}`);
        console.log(`   Duration: ${Math.round(avgDuration)}ms`);
    }

    // Show failures
    if (failed.length > 0) {
        console.log(`\n❌ Failed URLs:`);
        failed.forEach((r, idx) => {
            console.log(`   ${idx + 1}. ${r.url}`);
            console.log(`      Error: ${r.error}`);
        });
    }

    // Top performers
    if (successful.length > 0) {
        console.log(`\n🏆 Top 5 Content-Rich URLs:`);
        const top5 = [...successful]
            .sort((a, b) => (b.contentLength || 0) - (a.contentLength || 0))
            .slice(0, 5);

        top5.forEach((r, idx) => {
            console.log(`   ${idx + 1}. ${r.title}`);
            console.log(`      ${r.contentLength} chars, ${r.imageCount} images`);
            console.log(`      ${r.url}`);
        });
    }

    // Save results to JSON
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `scraping-test-${timestamp}.json`);

    fs.writeFileSync(outputFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        totalUrls: urls.length,
        successful: successful.length,
        failed: failed.length,
        successRate: (successful.length / results.length) * 100,
        results
    }, null, 2));

    console.log(`\n💾 Results saved to: ${outputFile}`);
    console.log('\n' + '='.repeat(60));
}

// Run tests
runTests(TEST_URLS, 5).catch(error => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
});
