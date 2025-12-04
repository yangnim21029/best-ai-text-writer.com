/**
 * Web Scraping Before/After Comparison Test
 * 
 * 展示清理邏輯的實際效果：
 * - 原始 Jina 響應（清理前）
 * - 清理後的內容
 * - 被移除的噪音分析
 * - 清理效果評分
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 測試 URLs（少量以便詳細檢查）
const TEST_URLS = [
    'https://www.womenshealthmag.com/tw/beauty/hair/g62835899/2025-girl-hairstyle/',
    'https://www.elle.com/tw/beauty/news/g65456238/olive-young-2025-top15-new/',
    'https://www.vogue.com.tw/beauty/article/%E5%85%89%E7%99%82%E7%BE%8E%E7%94%B2%E6%8C%87%E7%94%B2%E6%B2%B9%E5%BF%85%E7%9F%A5%E7%9A%84%E7%A7%98%E8%A8%A3',
    'https://www.commonhealth.com.tw/article/87720',
    'https://pandafishtravel.tw/world_travel/archives/6839/'
];

// ============================================================
// 1. 獲取原始 Jina 響應（不清理）
// ============================================================

async function fetchRawJina(url: string): Promise<{ title: string; raw: string; images: number }> {
    const response = await fetch(`https://r.jina.ai/${url}`, {
        method: 'GET',
        headers: {
            'x-no-cache': 'false',
            'X-Md-Heading-Style': 'setext',
            'X-Remove-Selector': 'header, footer, nav, aside'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const rawText = await response.text();

    // 提取標題
    const titleMatch = rawText.match(/^Title:\s*(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : '';

    // 計算圖片數量
    const imageCount = (rawText.match(/!\[.*?\]\(.*?\)/g) || []).length;

    return { title, raw: rawText, images: imageCount };
}

// ============================================================
// 2. 應用清理邏輯（從 webScraper.ts 複製）
// ============================================================

function cleanArtifacts(text: string): string {
    let cleaned = text;

    // === 特定垃圾短語 ===
    const junkPhrases = [
        /^Ad Placement\s*:.*$/gim,
        /^(Login|登入|Sign In).*$/gim,
        /^ADVERTISEMENT$/gim,
        /^CONTINUE READING BELOW$/gim,
        /^Share on:.*$/gim,
        /^recommended$/gim,
        /^Related Articles:?$/gim,
        /^Read More:?$/gim,
        /^SCROLL TO CONTINUE\s*:.*$/gim,
        /^[ \t]*\S{1,2}[ \t]*$/gm
    ];

    junkPhrases.forEach(regex => {
        cleaned = cleaned.replace(regex, '');
    });

    // === 圖片清理 ===
    cleaned = cleaned.replace(/!\[.*?\]\(.*?\)/g, '');
    cleaned = cleaned.replace(/^!Image\s+\d+:.*$/gm, '');
    cleaned = cleaned.replace(/!Image\s*\[.*?\]/gi, '');
    cleaned = cleaned.replace(/^\]\(.*?\)/gm, '');

    // === 鏈接密度過濾 ===
    const linkRegex = /\[(.*?)\]\(.*?\)/g;
    const linkMatches: { index: number, length: number }[] = [];
    let lMatch;

    while ((lMatch = linkRegex.exec(cleaned)) !== null) {
        linkMatches.push({ index: lMatch.index, length: lMatch[0].length });
    }

    if (linkMatches.length > 6) {
        const indicesToRemove: { start: number, end: number }[] = [];
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

        for (let i = indicesToRemove.length - 1; i >= 0; i--) {
            const range = indicesToRemove[i];
            cleaned = cleaned.substring(0, range.start) + cleaned.substring(range.end);
        }
    }

    // === 通用鏈接清理 ===
    cleaned = cleaned.replace(/\[\s*\]\(.*?\)/g, '');
    cleaned = cleaned.replace(/^\s*([-*]|\d+\.)\s*$/gm, '');
    cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');

    // === 噪音和元數據 ===
    cleaned = cleaned.replace(/^\s*(UA-\d+-\d+|G-[A-Z0-9]+)\s*$/gm, '');
    cleaned = cleaned.replace(/^(holiday|girlstyle|businessfocus|mamidaily)\s*$/gim, '');
    cleaned = cleaned.replace(/^All\s+[\u4e00-\u9fa5]+.*$/gm, '');
    cleaned = cleaned.replace(/^\s*-{3,}\s*$/gm, '');
    cleaned = cleaned.replace(/^\s*▲?\s*Cosmopolitan\.com\.hk\s*$/gim, '');

    // === 壓縮空行 ===
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

    return cleaned;
}

// ============================================================
// 3. 對比分析
// ============================================================

interface ComparisonResult {
    url: string;
    title: string;
    success: boolean;
    error?: string;

    // 原始數據
    rawLength: number;
    rawLines: number;
    rawImages: number;

    // 清理後數據
    cleanedLength: number;
    cleanedLines: number;

    // 差異分析
    removedChars: number;
    removedLines: number;
    removedImages: number;
    reductionRate: number; // 減少比例

    // 被移除的內容樣本
    removedSamples: string[];

    // 評分
    cleaningScore: number; // 0-100

    duration: number;
}

function extractRemovedSamples(raw: string, cleaned: string): string[] {
    const rawLines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const cleanedLines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    // 找出在原始中但不在清理後的行
    const removed = rawLines.filter(rawLine => {
        // 如果這行在清理後的內容中找不到
        return !cleanedLines.some(cleanLine => cleanLine.includes(rawLine) || rawLine.includes(cleanLine));
    });

    // 返回前 10 個被移除的行作為樣本
    return removed.slice(0, 10);
}

function calculateCleaningScore(result: ComparisonResult): number {
    let score = 0;

    // 1. 減少了多少冗餘內容（20分）
    const idealReduction = 0.15; // 理想情況下減少 15%
    const reductionScore = Math.min(20, (result.reductionRate / idealReduction) * 20);
    score += reductionScore;

    // 2. 移除的圖片數量（20分）
    const imageRemovalScore = Math.min(20, (result.removedImages / 10) * 20);
    score += imageRemovalScore;

    // 3. 移除的噪音行數（30分）
    const lineRemovalScore = Math.min(30, (result.removedLines / 50) * 30);
    score += lineRemovalScore;

    // 4. 沒有過度清理（保留足夠內容）（30分）
    if (result.cleanedLength > 800) score += 30;
    else if (result.cleanedLength > 500) score += 20;
    else score += 10;

    return Math.min(100, score);
}

// ============================================================
// 4. 測試執行
// ============================================================

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testUrlComparison(url: string, index: number, total: number): Promise<ComparisonResult> {
    const startTime = Date.now();

    try {
        console.log(`\n[${index + 1}/${total}] ${'='.repeat(70)}`);
        console.log(`🔍 Testing: ${url}\n`);

        // 獲取原始數據
        console.log('📥 Step 1: Fetching raw Jina response...');
        const { title, raw, images: rawImages } = await fetchRawJina(url);
        const rawLength = raw.length;
        const rawLines = raw.split('\n').filter(l => l.trim().length > 0).length;

        console.log(`   Raw: ${rawLength} chars, ${rawLines} lines, ${rawImages} images`);

        // 應用清理
        console.log('\n🧹 Step 2: Applying cleaning logic...');
        const cleaned = cleanArtifacts(raw);
        const cleanedLength = cleaned.length;
        const cleanedLines = cleaned.split('\n').filter(l => l.trim().length > 0).length;

        const removedChars = rawLength - cleanedLength;
        const removedLines = rawLines - cleanedLines;
        const removedImages = rawImages;
        const reductionRate = rawLength > 0 ? removedChars / rawLength : 0;

        console.log(`   Cleaned: ${cleanedLength} chars, ${cleanedLines} lines`);
        console.log(`   📉 Removed: ${removedChars} chars (${(reductionRate * 100).toFixed(1)}%), ${removedLines} lines, ${removedImages} images`);

        // 提取被移除的內容樣本
        console.log('\n🔬 Step 3: Analyzing removed content...');
        const removedSamples = extractRemovedSamples(raw, cleaned);
        console.log(`   Found ${removedSamples.length} removed lines samples`);

        if (removedSamples.length > 0) {
            console.log('\n   📋 Removed Content Samples (first 5):');
            removedSamples.slice(0, 5).forEach((sample, idx) => {
                const preview = sample.substring(0, 60) + (sample.length > 60 ? '...' : '');
                console.log(`      ${idx + 1}. "${preview}"`);
            });
        }

        const result: ComparisonResult = {
            url,
            title,
            success: true,
            rawLength,
            rawLines,
            rawImages,
            cleanedLength,
            cleanedLines,
            removedChars,
            removedLines,
            removedImages,
            reductionRate,
            removedSamples,
            cleaningScore: 0,
            duration: Date.now() - startTime
        };

        result.cleaningScore = calculateCleaningScore(result);

        console.log(`\n📊 Cleaning Score: ${result.cleaningScore.toFixed(1)}/100`);
        console.log(`⏱️  Duration: ${result.duration}ms`);

        return result;

    } catch (error: any) {
        console.log(`\n❌ ERROR: ${error.message}`);

        return {
            url,
            title: '',
            success: false,
            error: error.message,
            rawLength: 0,
            rawLines: 0,
            rawImages: 0,
            cleanedLength: 0,
            cleanedLines: 0,
            removedChars: 0,
            removedLines: 0,
            removedImages: 0,
            reductionRate: 0,
            removedSamples: [],
            cleaningScore: 0,
            duration: Date.now() - startTime
        };
    }
}

async function runComparisonTests(urls: string[]) {
    const results: ComparisonResult[] = [];
    const outputDir = path.join(__dirname, 'output');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('\n' + '='.repeat(80));
    console.log('🔬 WEB SCRAPING CLEANING EFFECTIVENESS TEST');
    console.log('='.repeat(80));
    console.log(`\n📝 Testing ${urls.length} URLs with before/after comparison`);
    console.log(`⏳ Rate limit: 1 req/sec\n`);
    console.log('='.repeat(80));

    // 測試每個 URL
    for (let i = 0; i < urls.length; i++) {
        const result = await testUrlComparison(urls[i], i, urls.length);
        results.push(result);

        if (i < urls.length - 1) {
            console.log(`\n⏸️  Rate limiting: waiting 1 second...`);
            await delay(1000);
        }
    }

    // ============================================================
    // 5. 生成對比報告
    // ============================================================

    console.log('\n\n' + '='.repeat(80));
    console.log('📊 CLEANING EFFECTIVENESS SUMMARY');
    console.log('='.repeat(80) + '\n');

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`✅ Successful: ${successful.length}/${results.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}\n`);

    if (successful.length > 0) {
        const avgReduction = successful.reduce((sum, r) => sum + r.reductionRate, 0) / successful.length;
        const avgScore = successful.reduce((sum, r) => sum + r.cleaningScore, 0) / successful.length;
        const totalCharsRemoved = successful.reduce((sum, r) => sum + r.removedChars, 0);
        const totalLinesRemoved = successful.reduce((sum, r) => sum + r.removedLines, 0);
        const totalImagesRemoved = successful.reduce((sum, r) => sum + r.removedImages, 0);

        console.log('📈 Average Metrics:');
        console.log(`   Reduction Rate: ${(avgReduction * 100).toFixed(1)}%`);
        console.log(`   Cleaning Score: ${avgScore.toFixed(1)}/100`);
        console.log(`\n📉 Total Removed:`);
        console.log(`   Characters: ${totalCharsRemoved.toLocaleString()}`);
        console.log(`   Lines: ${totalLinesRemoved}`);
        console.log(`   Images: ${totalImagesRemoved}`);
    }

    // 最佳和最差清理效果
    if (successful.length > 0) {
        const sorted = [...successful].sort((a, b) => b.cleaningScore - a.cleaningScore);

        console.log('\n🏆 Top 3 - Best Cleaning Results:');
        sorted.slice(0, 3).forEach((r, idx) => {
            console.log(`   ${idx + 1}.Score: ${r.cleaningScore.toFixed(1)}/100, Reduction: ${(r.reductionRate * 100).toFixed(1)}%`);
            console.log(`      ${r.title}`);
            console.log(`      Removed: ${r.removedChars} chars, ${r.removedLines} lines, ${r.removedImages} images`);
        });

        console.log('\n⚠️  Bottom 3 - Need Improvement:');
        sorted.slice(-3).reverse().forEach((r, idx) => {
            console.log(`   ${idx + 1}. Score: ${r.cleaningScore.toFixed(1)}/100, Reduction: ${(r.reductionRate * 100).toFixed(1)}%`);
            console.log(`      ${r.title}`);
            console.log(`      Removed: ${r.removedChars} chars, ${r.removedLines} lines, ${r.removedImages} images`);
        });
    }

    // 常見被移除的內容類型分析
    console.log('\n🔍 Common Removed Content Analysis:');
    const allRemovedSamples = successful.flatMap(r => r.removedSamples);

    const categories = {
        ads: allRemovedSamples.filter(s => /ad|advertisement|sponsored|贊助|廣告/i.test(s)).length,
        navigation: allRemovedSamples.filter(s => /home|login|sign in|登入|share|subscribe|分享/i.test(s)).length,
        ui: allRemovedSamples.filter(s => /continue reading|scroll|read more|繼續閱讀/i.test(s)).length,
        social: allRemovedSamples.filter(s => /facebook|instagram|twitter|line/i.test(s)).length,
        images: successful.reduce((sum, r) => sum + r.removedImages, 0),
        shortJunk: allRemovedSamples.filter(s => s.length <= 3).length
    };

    Object.entries(categories).forEach(([type, count]) => {
        if (count > 0) {
            console.log(`   ${type}: ${count} instances`);
        }
    });

    // 保存詳細報告
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(outputDir, `comparison-report-${timestamp}.json`);

    fs.writeFileSync(reportFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: {
            total: urls.length,
            successful: successful.length,
            failed: failed.length,
            avgReductionRate: successful.length > 0 ? successful.reduce((sum, r) => sum + r.reductionRate, 0) / successful.length : 0,
            avgCleaningScore: successful.length > 0 ? successful.reduce((sum, r) => sum + r.cleaningScore, 0) / successful.length : 0,
            totalCharsRemoved: successful.reduce((sum, r) => sum + r.removedChars, 0),
            totalLinesRemoved: successful.reduce((sum, r) => sum + r.removedLines, 0),
            totalImagesRemoved: successful.reduce((sum, r) => sum + r.removedImages, 0)
        },
        removedContentCategories: categories,
        results
    }, null, 2));

    console.log(`\n💾 Detailed report saved: ${reportFile}`);

    // 保存 Before/After 樣本
    if (successful.length > 0) {
        const sampleUrl = successful[0];
        const sampleDir = path.join(outputDir, 'samples');
        if (!fs.existsSync(sampleDir)) {
            fs.mkdirSync(sampleDir, { recursive: true });
        }

        // 這裡我們沒有保存原始內容，但可以在下次運行時添加
        console.log(`💡 Tip: Check JSON report for removed content samples`);
    }

    console.log('\n' + '='.repeat(80) + '\n');
}

// 運行測試
runComparisonTests(TEST_URLS).catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
});
