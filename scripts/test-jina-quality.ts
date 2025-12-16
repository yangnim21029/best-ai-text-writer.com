/**
 * Jina Response Quality Test Script
 * 
 * Purpose: Evaluate the quality of Jina AI Reader's scraping and our cleanup logic
 * Test URLs: Various beauty/lifestyle articles from major Taiwan/HK publishers
 * 
 * Usage:
 *   npm run test:jina
 * 
 * Evaluation Criteria:
 * 1. Title Extraction - Is the article title correctly identified?
 * 2. Content Completeness - Is the main content captured without truncation?
 * 3. Noise Removal - Are ads, navigation, and UI elements removed?
 * 4. Image Extraction - Are relevant images with context captured?
 * 5. Link Quality - Are navigation links removed while keeping content links?
 * 6. Heading Structure - Are H1/H2/H3 properly preserved?
 */

import { fetchUrlContent } from '../services/research/webScraper';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test URLs provided by user
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
    'https://www.elle.com.hk/beauty_and_health/top-25-products-from-olive-young-new',
];

interface TestResult {
    url: string;
    success: boolean;
    title: string;
    contentLength: number;
    imageCount: number;
    headingCount: {
        h1: number;
        h2: number;
        h3: number;
    };
    issues: string[];
    rawSnippet: string; // First 500 chars
}

interface QualityMetrics {
    totalTests: number;
    successRate: number;
    avgContentLength: number;
    avgImageCount: number;
    commonIssues: Record<string, number>;
}

const analyzeContent = (content: string): {
    headingCount: { h1: number; h2: number; h3: number };
    issues: string[];
} => {
    const issues: string[] = [];

    // Count headings
    const h1Count = (content.match(/^# /gm) || []).length;
    const h2Count = (content.match(/^## /gm) || []).length;
    const h3Count = (content.match(/^### /gm) || []).length;

    // Check for common noise patterns that should have been removed
    if (content.includes('Ad Placement')) issues.push('Contains "Ad Placement"');
    if (content.includes('ADVERTISEMENT')) issues.push('Contains "ADVERTISEMENT"');
    if (content.includes('Login') || content.includes('登入')) issues.push('Contains login prompts');
    if (content.includes('Share on:')) issues.push('Contains "Share on:"');
    if (content.includes('CONTINUE READING')) issues.push('Contains "CONTINUE READING"');

    // Check for orphaned image syntax
    if (content.includes('![')) issues.push('Contains leftover image markdown');
    if (content.includes('!Image')) issues.push('Contains Jina image artifacts');

    // Check for excessive links (might indicate nav not cleaned)
    const linkCount = (content.match(/\[.*?\]\(.*?\)/g) || []).length;
    if (linkCount > 20) issues.push(`High link count: ${linkCount}`);

    // Check for very short content (might be truncated)
    if (content.length < 500) issues.push('Content suspiciously short');

    return {
        headingCount: { h1: h1Count, h2: h2Count, h3: h3Count },
        issues
    };
};

const testUrl = async (url: string): Promise<TestResult> => {
    try {
        const result = await fetchUrlContent(url);
        const analysis = analyzeContent(result.content);

        return {
            url,
            success: true,
            title: result.title,
            contentLength: result.content.length,
            imageCount: result.images.length,
            headingCount: analysis.headingCount,
            issues: analysis.issues,
            rawSnippet: result.content.substring(0, 500)
        };
    } catch (error: any) {
        return {
            url,
            success: false,
            title: '',
            contentLength: 0,
            imageCount: 0,
            headingCount: { h1: 0, h2: 0, h3: 0 },
            issues: [`FAILED: ${error.message}`],
            rawSnippet: ''
        };
    }
};

const runTests = async (): Promise<void> => {
    console.log('🧪 Starting Jina Response Quality Tests...\n');
    console.log(`Testing ${TEST_URLS.length} URLs\n`);

    const results: TestResult[] = [];

    for (let i = 0; i < TEST_URLS.length; i++) {
        const url = TEST_URLS[i];
        console.log(`[${i + 1}/${TEST_URLS.length}] Testing: ${url}`);

        const result = await testUrl(url);
        results.push(result);

        if (result.success) {
            console.log(`  ✅ Success - Title: "${result.title}"`);
            console.log(`  📝 Content: ${result.contentLength} chars, ${result.imageCount} images`);
            if (result.issues.length > 0) {
                console.log(`  ⚠️  Issues: ${result.issues.join(', ')}`);
            }
        } else {
            console.log(`  ❌ Failed: ${result.issues[0]}`);
        }
        console.log('');

        // Rate limit: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Calculate metrics
    const successfulTests = results.filter(r => r.success);
    const metrics: QualityMetrics = {
        totalTests: results.length,
        successRate: (successfulTests.length / results.length) * 100,
        avgContentLength: successfulTests.reduce((sum, r) => sum + r.contentLength, 0) / successfulTests.length,
        avgImageCount: successfulTests.reduce((sum, r) => sum + r.imageCount, 0) / successfulTests.length,
        commonIssues: {}
    };

    // Count common issues
    results.forEach(r => {
        r.issues.forEach(issue => {
            metrics.commonIssues[issue] = (metrics.commonIssues[issue] || 0) + 1;
        });
    });

    // Save results
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(outputDir, `jina-test-report-${timestamp}.json`);

    fs.writeFileSync(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        metrics,
        results
    }, null, 2));

    // Print summary
    console.log('\n📊 Test Summary\n');
    console.log(`Total Tests: ${metrics.totalTests}`);
    console.log(`Success Rate: ${metrics.successRate.toFixed(1)}%`);
    console.log(`Avg Content Length: ${Math.round(metrics.avgContentLength)} chars`);
    console.log(`Avg Images Extracted: ${metrics.avgImageCount.toFixed(1)}`);
    console.log('\nCommon Issues:');
    Object.entries(metrics.commonIssues)
        .sort((a, b) => b[1] - a[1])
        .forEach(([issue, count]) => {
            console.log(`  - ${issue}: ${count} occurrences`);
        });

    console.log(`\n📄 Full report saved to: ${reportPath}`);
};

// Run if executed directly (ESM-safe)
const invokedViaCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (invokedViaCli) {
    runTests().catch(console.error);
}

export { runTests, testUrl, TEST_URLS };
