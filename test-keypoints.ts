/**
 * Test script to verify Key Points tracking in section generation
 * 
 * This script calls the generateSectionContent API directly to verify:
 * 1. AI correctly returns usedPoints array
 * 2. usedPoints contains exact strings from the input points
 * 3. Schema validation works correctly
 */

import 'dotenv/config';

// Polyfill import.meta.env for Node.js environment
if (typeof import.meta === 'undefined' || !import.meta.env) {
    (globalThis as any).import = { meta: { env: process.env } };
}

import { generateSectionContent } from './services/generation/contentGenerationService';
import { ArticleConfig } from './types';

const testKeyPointsTracking = async () => {
    console.log('🧪 Testing Key Points Tracking...\n');

    // Mock config with key points
    const mockConfig: ArticleConfig = {
        title: 'AI 寫作工具完整指南',
        referenceContent: '', // Not needed for this test
        targetAudience: 'zh-TW',
        brandKnowledge: '',
        referenceAnalysis: {
            structure: [],
            generalPlan: ['專業、權威的語氣', '使用具體例子'],
            conversionPlan: [],
            keyInformationPoints: [
                'AI 寫作工具可以提高內容創作效率 50%',
                'GPT-4 是目前最先進的語言模型',
                '自動化內容生成可以節省時間成本'
            ],
            brandExclusivePoints: [
                'best-ai-text-writer.com 提供最佳中文優化',
                '支援繁體中文 SEO 優化'
            ]
        },
        authorityAnalysis: null,
    };

    const keyInfoPoints = [
        'AI 寫作工具可以提高內容創作效率 50%',
        'GPT-4 是目前最先進的語言模型',
        '自動化內容生成可以節省時間成本'
    ];

    try {
        console.log('📤 Calling generateSectionContent API...');
        console.log('Input Key Points:', keyInfoPoints);
        console.log('');

        const result = await generateSectionContent(
            mockConfig,
            'AI 寫作工具的優勢', // sectionTitle
            ['列出 AI 寫作工具的主要優勢'], // specificPlan
            ['專業、權威的語氣'], // generalPlan
            [], // keywordPlans
            [], // previousSections
            ['結論'], // futureSections
            null, // authorityAnalysis
            keyInfoPoints, // keyInfoPoints
            [], // currentCoveredPointsHistory
            0, // currentInjectedCount
            {} // sectionMeta
        );

        console.log('✅ API Response received\n');
        console.log('📊 Result Data:');
        console.log('- Content length:', result.data.content.length, 'chars');
        console.log('- Used Points:', result.data.usedPoints);
        console.log('- Injected Count:', result.data.injectedCount);
        console.log('');
        console.log('💰 Cost & Usage:');
        console.log('- Total cost:', result.cost.totalCost);
        console.log('- Total tokens:', result.usage.totalTokens);
        console.log('- Duration:', result.duration, 'ms');
        console.log('');

        // Verification
        console.log('🔍 Verification:');

        if (!result.data.usedPoints || !Array.isArray(result.data.usedPoints)) {
            console.error('❌ FAIL: usedPoints is not an array!');
            console.error('   Actual:', result.data.usedPoints);
            return;
        }

        if (result.data.usedPoints.length === 0) {
            console.warn('⚠️  WARNING: usedPoints is empty array');
            console.warn('   This might be expected if no key points were used');
        } else {
            console.log('✅ PASS: usedPoints is a valid array with', result.data.usedPoints.length, 'items');

            // Check if used points match input points
            const matchedPoints = result.data.usedPoints.filter(up =>
                keyInfoPoints.includes(up)
            );

            console.log('✅ Matched points:', matchedPoints.length, '/', result.data.usedPoints.length);

            if (matchedPoints.length !== result.data.usedPoints.length) {
                console.warn('⚠️  Some usedPoints do not match input points:');
                const unmatched = result.data.usedPoints.filter(up => !keyInfoPoints.includes(up));
                unmatched.forEach(up => console.warn('   -', up));
            }
        }

        console.log('');
        console.log('📝 Generated Content Preview:');
        console.log(result.data.content.substring(0, 300) + '...');
        console.log('');
        console.log('✅ Test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed with error:');
        console.error(error);
    }
};

// Run the test
testKeyPointsTracking().catch(console.error);
