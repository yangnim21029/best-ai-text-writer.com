/**
 * High-Quality Web Scraping Test with Deep Content Analysis
 * 
 * Not just "pass/fail" - provides detailed quality metrics:
 * - Content structure integrity
 * - Noise detection (ads, navigation, junk)
 * - Cleaning effectiveness
 * - Information density
 * - Readability scores
 */

import { fetchUrlContent } from '../src/services/research/webScraper';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    'https://www.harpersbazaar.com.tw/beauty/nail-design/g33989797/french-nail-collection/',
    'https://www.cosmopolitan.com.hk/beauty/gel-nail-hot-trends',
    'https://www.elle.com/tw/beauty/hair/g36495209/korean-hairstyle-for-mid-length-hair/',
    'https://www.elle.com.hk/beauty_and_health/10-style-tips-for-trendy-princess-cut-hairstyles-updated',
    'https://www.cosmopolitan.com/tw/beauty/make-up/g64708927/2025-feet-nail/',
    'https://www.beauty321.com/post/65398',
    'https://wandou.tw/olive-young/',
    'https://www.elle.com.hk/beauty_and_health/top-25-products-from-olive-young-new'
];

// ============================================================
// QUALITY STANDARDS
// ============================================================

const QUALITY_STANDARDS = {
    minContentLength: 800,        // 最少內容長度
    maxNoiseRatio: 0.15,          // 最多 15% 噪音
    minParagraphCount: 3,         // 至少 3 段
    minInfoDensity: 0.6,          // 資訊密度 > 60%
    maxShortLineRatio: 0.2,       // 短行（<20 字）不超過 20%
    requiredStructure: ['heading', 'content'], // 必須有標題和內容
};

// ============================================================
// NOISE PATTERNS (用於檢測清理效果)
// ============================================================

const NOISE_PATTERNS = {
    ads: [
        /advertisement/i,
        /ad placement/i,
        /sponsored/i,
        /贊助/,
        /廣告/
    ],
    navigation: [
        /^(home|login|sign in|登入|註冊)$/i,
        /^(share|subscribe|follow)/i,
        /分享至|追蹤我們/,
        /相關文章|延伸閱讀|推薦文章/
    ],
    ui: [
        /^continue reading below$/i,
        /scroll to continue/i,
        /read more/i,
        /繼續閱讀|閱讀更多/
    ],
    social: [
        /^(facebook|instagram|twitter|line)/i,
        /點擊訂閱/
    ],
    metadata: [
        /^published:?/i,
        /^author:?/i,
        /^tags?:/i,
        /發布時間|作者：|標籤：/
    ]
};

// ============================================================
// QUALITY METRICS
// ============================================================

interface ContentMetrics {
    // Basic Stats
    totalChars: number;
    totalLines: number;
    paragraphCount: number;
    headingCount: number;
    listItemCount: number;

    // Noise Detection
    noiseLineCount: number;
    noiseRatio: number;
    detectedNoiseTypes: string[];

    // Structure Analysis
    hasTitle: boolean;
    hasHeadings: boolean;
    hasParagraphs: boolean;
    hasLists: boolean;
    structureScore: number; // 0-100

    // Content Quality
    infoDensity: number;      // 有效內容 / 總內容
    avgLineLength: number;
    shortLineRatio: number;   // 短行比例（<20字）
    chineseRatio: number;     // 中文內容比例

    // Readability
    readabilityScore: number; // 0-100

    // Issues
    issues: string[];
    warnings: string[];
}

interface QualityReport {
    url: string;
    success: boolean;
    error?: string;

    // Raw Data
    title: string;
    contentLength: number;
    imageCount: number;
    duration: number;

    // Quality Metrics
    metrics?: ContentMetrics;

    // Quality Score
    qualityScore: number; // 0-100
    grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

    // Pass/Fail
    passed: boolean;
    failedCriteria: string[];
}

// ============================================================
// ANALYSIS FUNCTIONS
// ============================================================

function analyzeContent(content: string): ContentMetrics {
    const lines = content.split('\n');
    const nonEmptyLines = lines.filter(l => l.trim().length > 0);

    // Basic Stats
    const totalChars = content.length;
    const totalLines = nonEmptyLines.length;

    // Structure Detection
    const headingLines = lines.filter(l => /^#{1,6}\s+/.test(l));
    const paragraphLines = lines.filter(l => l.trim().length > 50 && !l.startsWith('#'));
    const listLines = lines.filter(l => /^\s*[-*]\s+/.test(l) || /^\s*\d+\.\s+/.test(l));

    const headingCount = headingLines.length;
    const paragraphCount = paragraphLines.length;
    const listItemCount = listLines.length;

    const hasTitle = headingLines.some(l => l.startsWith('# '));
    const hasHeadings = headingCount > 0;
    const hasParagraphs = paragraphCount >= 3;
    const hasLists = listItemCount > 0;

    // Structure Score
    let structureScore = 0;
    if (hasTitle) structureScore += 25;
    if (hasHeadings) structureScore += 25;
    if (hasParagraphs) structureScore += 30;
    if (hasLists) structureScore += 20;

    // Noise Detection
    const detectedNoiseTypes: string[] = [];
    let noiseLineCount = 0;

    for (const line of nonEmptyLines) {
        let isNoise = false;

        for (const [type, patterns] of Object.entries(NOISE_PATTERNS)) {
            if (patterns.some(p => p.test(line))) {
                if (!detectedNoiseTypes.includes(type)) {
                    detectedNoiseTypes.push(type);
                }
                isNoise = true;
                break;
            }
        }

        // 檢測短垃圾行（<3 字元且不是標題）
        if (!isNoise && line.trim().length <= 3 && !line.startsWith('#')) {
            isNoise = true;
            if (!detectedNoiseTypes.includes('shortJunk')) {
                detectedNoiseTypes.push('shortJunk');
            }
        }

        if (isNoise) noiseLineCount++;
    }

    const noiseRatio = totalLines > 0 ? noiseLineCount / totalLines : 0;

    // Content Quality
    const contentLines = nonEmptyLines.filter(l => !l.startsWith('#'));
    const totalContentLength = contentLines.reduce((sum, l) => sum + l.length, 0);
    const avgLineLength = contentLines.length > 0 ? totalContentLength / contentLines.length : 0;

    const shortLines = contentLines.filter(l => l.length < 20);
    const shortLineRatio = contentLines.length > 0 ? shortLines.length / contentLines.length : 0;

    // Chinese Content Ratio
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    const chineseRatio = totalChars > 0 ? chineseChars / totalChars : 0;

    // Info Density (有效內容行 / 總行數)
    const effectiveLines = totalLines - noiseLineCount;
    const infoDensity = totalLines > 0 ? effectiveLines / totalLines : 0;

    // Readability Score
    let readabilityScore = 0;
    if (avgLineLength >= 30 && avgLineLength <= 150) readabilityScore += 30;
    if (shortLineRatio < 0.2) readabilityScore += 20;
    if (chineseRatio > 0.5) readabilityScore += 30;
    if (paragraphCount >= 5) readabilityScore += 20;

    // Issues Detection
    const issues: string[] = [];
    const warnings: string[] = [];

    if (noiseRatio > QUALITY_STANDARDS.maxNoiseRatio) {
        issues.push(`高噪音比例: ${(noiseRatio * 100).toFixed(1)}% (標準: <${QUALITY_STANDARDS.maxNoiseRatio * 100}%)`);
    }

    if (paragraphCount < QUALITY_STANDARDS.minParagraphCount) {
        issues.push(`段落不足: ${paragraphCount} (標準: >=${QUALITY_STANDARDS.minParagraphCount})`);
    }

    if (infoDensity < QUALITY_STANDARDS.minInfoDensity) {
        warnings.push(`資訊密度低: ${(infoDensity * 100).toFixed(1)}% (建議: >${QUALITY_STANDARDS.minInfoDensity * 100}%)`);
    }

    if (shortLineRatio > QUALITY_STANDARDS.maxShortLineRatio) {
        warnings.push(`過多短行: ${(shortLineRatio * 100).toFixed(1)}% (建議: <${QUALITY_STANDARDS.maxShortLineRatio * 100}%)`);
    }

    if (!hasTitle) {
        warnings.push('缺少主標題 (H1)');
    }

    if (chineseRatio < 0.3) {
        warnings.push(`中文內容少: ${(chineseRatio * 100).toFixed(1)}%`);
    }

    return {
        totalChars,
        totalLines,
        paragraphCount,
        headingCount,
        listItemCount,
        noiseLineCount,
        noiseRatio,
        detectedNoiseTypes,
        hasTitle,
        hasHeadings,
        hasParagraphs,
        hasLists,
        structureScore,
        infoDensity,
        avgLineLength,
        shortLineRatio,
        chineseRatio,
        readabilityScore,
        issues,
        warnings
    };
}

function calculateQualityScore(metrics: ContentMetrics): number {
    let score = 0;

    // Structure (30 points)
    score += metrics.structureScore * 0.3;

    // Readability (25 points)
    score += metrics.readabilityScore * 0.25;

    // Info Density (25 points)
    score += metrics.infoDensity * 25;

    // Noise Control (20 points)
    score += (1 - metrics.noiseRatio) * 20;

    return Math.min(100, Math.max(0, score));
}

function getGrade(score: number): 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' {
    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 75) return 'B';
    if (score >= 65) return 'C';
    if (score >= 50) return 'D';
    return 'F';
}

// ============================================================
// TEST RUNNER
// ============================================================

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function testUrlWithQualityAnalysis(url: string): Promise<QualityReport> {
    const startTime = Date.now();

    try {
        console.log(`\n🔍 Analyzing: ${url}`);

        const result = await fetchUrlContent(url);
        const duration = Date.now() - startTime;

        // Deep Content Analysis
        const metrics = analyzeContent(result.content);
        const qualityScore = calculateQualityScore(metrics);
        const grade = getGrade(qualityScore);

        // Check Criteria
        const failedCriteria: string[] = [];

        if (result.content.length < QUALITY_STANDARDS.minContentLength) {
            failedCriteria.push(`內容過短: ${result.content.length} chars`);
        }

        if (metrics.noiseRatio > QUALITY_STANDARDS.maxNoiseRatio) {
            failedCriteria.push(`噪音過多: ${(metrics.noiseRatio * 100).toFixed(1)}%`);
        }

        if (metrics.paragraphCount < QUALITY_STANDARDS.minParagraphCount) {
            failedCriteria.push(`段落不足: ${metrics.paragraphCount}`);
        }

        if (metrics.infoDensity < QUALITY_STANDARDS.minInfoDensity) {
            failedCriteria.push(`資訊密度低: ${(metrics.infoDensity * 100).toFixed(1)}%`);
        }

        const passed = failedCriteria.length === 0 && qualityScore >= 65;

        // Console Output
        console.log(`\n✅ Title: "${result.title}"`);
        console.log(`📊 Quality Score: ${qualityScore.toFixed(1)}/100 [${grade}]`);
        console.log(`\n📈 Metrics:`);
        console.log(`   Structure: ${metrics.structureScore}/100`);
        console.log(`   Readability: ${metrics.readabilityScore}/100`);
        console.log(`   Info Density: ${(metrics.infoDensity * 100).toFixed(1)}%`);
        console.log(`   Noise Ratio: ${(metrics.noiseRatio * 100).toFixed(1)}%`);
        console.log(`\n📝 Content Stats:`);
        console.log(`   Total: ${metrics.totalChars} chars, ${metrics.totalLines} lines`);
        console.log(`   Paragraphs: ${metrics.paragraphCount}, Headings: ${metrics.headingCount}`);
        console.log(`   Images: ${result.images.length}`);
        console.log(`   Chinese Ratio: ${(metrics.chineseRatio * 100).toFixed(1)}%`);

        if (metrics.detectedNoiseTypes.length > 0) {
            console.log(`\n⚠️  Detected Noise: ${metrics.detectedNoiseTypes.join(', ')}`);
        }

        if (metrics.issues.length > 0) {
            console.log(`\n❌ Issues:`);
            metrics.issues.forEach(issue => console.log(`   - ${issue}`));
        }

        if (metrics.warnings.length > 0) {
            console.log(`\n⚠️  Warnings:`);
            metrics.warnings.forEach(warn => console.log(`   - ${warn}`));
        }

        console.log(`\n${passed ? '✅ PASSED' : '❌ FAILED'}`);
        if (!passed) {
            console.log(`   Failed Criteria:`);
            failedCriteria.forEach(c => console.log(`   - ${c}`));
        }

        console.log(`⏱️  Duration: ${duration}ms`);

        return {
            url,
            success: true,
            title: result.title,
            contentLength: result.content.length,
            imageCount: result.images.length,
            duration,
            metrics,
            qualityScore,
            grade,
            passed,
            failedCriteria
        };

    } catch (error: any) {
        const duration = Date.now() - startTime;

        console.log(`\n❌ SCRAPING FAILED: ${error.message}`);
        console.log(`⏱️  Duration: ${duration}ms`);

        return {
            url,
            success: false,
            error: error.message,
            title: '',
            contentLength: 0,
            imageCount: 0,
            duration,
            qualityScore: 0,
            grade: 'F',
            passed: false,
            failedCriteria: ['Scraping failed']
        };
    }
}

async function runQualityTests(urls: string[]) {
    const results: QualityReport[] = [];
    const outputDir = path.join(__dirname, 'output');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔬 HIGH-QUALITY WEB SCRAPING ANALYSIS`);
    console.log(`${'='.repeat(80)}`);
    console.log(`\n📊 Quality Standards:`);
    console.log(`   Min Content Length: ${QUALITY_STANDARDS.minContentLength} chars`);
    console.log(`   Max Noise Ratio: ${QUALITY_STANDARDS.maxNoiseRatio * 100}%`);
    console.log(`   Min Paragraphs: ${QUALITY_STANDARDS.minParagraphCount}`);
    console.log(`   Min Info Density: ${QUALITY_STANDARDS.minInfoDensity * 100}%`);
    console.log(`\n📋 Testing ${urls.length} URLs with 1 req/sec rate limit`);
    console.log(`⏳ Estimated Time: ~${urls.length} seconds\n`);
    console.log(`${'='.repeat(80)}`);

    for (let i = 0; i < urls.length; i++) {
        console.log(`\n\n[${i + 1}/${urls.length}] ${'─'.repeat(70)}`);

        const result = await testUrlWithQualityAnalysis(urls[i]);
        results.push(result);

        if (i < urls.length - 1) {
            console.log(`\n⏸️  Rate limiting: waiting 1 second...`);
            await delay(1000);
        }
    }

    // ============================================================
    // SUMMARY REPORT
    // ============================================================

    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📊 QUALITY ANALYSIS SUMMARY`);
    console.log(`${'='.repeat(80)}\n`);

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const passed = successful.filter(r => r.passed);

    console.log(`✅ Scraped Successfully: ${successful.length}/${results.length}`);
    console.log(`✅ Passed Quality Standards: ${passed.length}/${successful.length}`);
    console.log(`❌ Failed: ${failed.length}/${results.length}`);
    console.log(`📈 Overall Pass Rate: ${((passed.length / results.length) * 100).toFixed(1)}%\n`);

    // Grade Distribution
    const gradeCount = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
    successful.forEach(r => gradeCount[r.grade]++);

    console.log(`📊 Grade Distribution:`);
    Object.entries(gradeCount).forEach(([grade, count]) => {
        const percentage = successful.length > 0 ? (count / successful.length * 100).toFixed(1) : '0.0';
        const bar = '█'.repeat(Math.floor(count / 2));
        console.log(`   ${grade}: ${count.toString().padStart(2)} (${percentage.padStart(5)}%) ${bar}`);
    });

    // Average Metrics
    if (successful.length > 0) {
        const avgQuality = successful.reduce((sum, r) => sum + r.qualityScore, 0) / successful.length;
        const avgNoise = successful.reduce((sum, r) => sum + (r.metrics?.noiseRatio || 0), 0) / successful.length;
        const avgInfo = successful.reduce((sum, r) => sum + (r.metrics?.infoDensity || 0), 0) / successful.length;
        const avgReadability = successful.reduce((sum, r) => sum + (r.metrics?.readabilityScore || 0), 0) / successful.length;

        console.log(`\n📈 Average Metrics (Successful):`);
        console.log(`   Quality Score: ${avgQuality.toFixed(1)}/100`);
        console.log(`   Noise Ratio: ${(avgNoise * 100).toFixed(1)}%`);
        console.log(`   Info Density: ${(avgInfo * 100).toFixed(1)}%`);
        console.log(`   Readability: ${avgReadability.toFixed(1)}/100`);
    }

    // Common Issues
    const allIssues: { [key: string]: number } = {};
    successful.forEach(r => {
        r.failedCriteria.forEach(criterion => {
            const key = criterion.split(':')[0];
            allIssues[key] = (allIssues[key] || 0) + 1;
        });
    });

    if (Object.keys(allIssues).length > 0) {
        console.log(`\n⚠️  Common Issues:`);
        Object.entries(allIssues)
            .sort(([, a], [, b]) => b - a)
            .forEach(([issue, count]) => {
                console.log(`   - ${issue}: ${count} URLs`);
            });
    }

    // Top Performers
    const topPerformers = [...successful]
        .sort((a, b) => b.qualityScore - a.qualityScore)
        .slice(0, 5);

    if (topPerformers.length > 0) {
        console.log(`\n🏆 Top 5 Highest Quality:`);
        topPerformers.forEach((r, idx) => {
            console.log(`   ${idx + 1}. [${r.grade}] ${r.qualityScore.toFixed(1)}/100`);
            console.log(`      ${r.title}`);
            console.log(`      ${r.url.substring(0, 60)}...`);
        });
    }

    // Bottom Performers
    const bottomPerformers = [...successful]
        .filter(r => !r.passed)
        .sort((a, b) => a.qualityScore - b.qualityScore)
        .slice(0, 5);

    if (bottomPerformers.length > 0) {
        console.log(`\n⚠️  Bottom 5 - Need Attention:`);
        bottomPerformers.forEach((r, idx) => {
            console.log(`   ${idx + 1}. [${r.grade}] ${r.qualityScore.toFixed(1)}/100`);
            console.log(`      ${r.title}`);
            console.log(`      Issues: ${r.failedCriteria.join(', ')}`);
        });
    }

    // Failed Scrapes
    if (failed.length > 0) {
        console.log(`\n❌ Failed to Scrape:`);
        failed.forEach((r, idx) => {
            console.log(`   ${idx + 1}. ${r.url}`);
            console.log(`      Error: ${r.error}`);
        });
    }

    // Save Detailed Results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = path.join(outputDir, `quality-report-${timestamp}.json`);

    fs.writeFileSync(reportFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        standards: QUALITY_STANDARDS,
        summary: {
            total: urls.length,
            successful: successful.length,
            passed: passed.length,
            failed: failed.length,
            passRate: (passed.length / results.length) * 100,
            gradeDistribution: gradeCount
        },
        results
    }, null, 2));

    console.log(`\n💾 Detailed report saved: ${reportFile}`);

    // Save Failed URLs for Retry
    if (bottomPerformers.length > 0 || failed.length > 0) {
        const problemUrls = [
            ...bottomPerformers.map(r => r.url),
            ...failed.map(r => r.url)
        ];

        const problemFile = path.join(outputDir, `problem-urls-${timestamp}.txt`);
        fs.writeFileSync(problemFile, problemUrls.join('\n'));
        console.log(`⚠️  Problem URLs saved: ${problemFile}`);
    }

    console.log(`\n${'='.repeat(80)}\n`);
}

// Run Tests
runQualityTests(TEST_URLS).catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
});
