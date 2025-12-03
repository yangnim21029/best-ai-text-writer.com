// 在浏览器控制台运行这个测试
// 测试 Key Points tracking

(async () => {
    console.log('🧪 Testing Key Points Tracking in Browser...\n');

    const { generateSectionContent } = await import('./services/contentGenerationService');
    const { useAnalysisStore } = await import('./store/useAnalysisStore');

    const keyInfoPoints = [
        'AI 寫作工具可以提高內容創作效率 50%',
        'GPT-4 是目前最先進的語言模型',
        '自動化內容生成可以節省時間成本'
    ];

    const mockConfig = {
        title: 'AI 寫作工具完整指南',
        referenceContent: '',
        targetAudience: 'zh-TW',
        brandKnowledge: '',
        referenceAnalysis: {
            structure: [],
            generalPlan: ['專業、權威的語氣', '使用具體例子'],
            conversionPlan: [],
            keyInformationPoints: keyInfoPoints,
            brandExclusivePoints: []
        },
        authorityAnalysis: null,
    };

    try {
        console.log('📤 Calling generateSectionContent API...');
        console.log('Input Key Points:', keyInfoPoints);

        const result = await generateSectionContent(
            mockConfig,
            'AI 寫作工具的優勢',
            ['列出 AI 寫作工具的主要優勢'],
            ['專業、權威的語氣'],
            [],
            [],
            ['結論'],
            null,
            keyInfoPoints,
            [],
            0,
            {}
        );

        console.log('\n✅ API Response received\n');
        console.log('📊 Result Data:');
        console.log('- Content length:', result.data.content.length, 'chars');
        console.log('- Used Points:', result.data.usedPoints);
        console.log('- Injected Count:', result.data.injectedCount);
        console.log('\n💰 Cost & Usage:');
        console.log('- Total cost:', result.cost.totalCost);
        console.log('- Total tokens:', result.usage.totalTokens);
        console.log('- Duration:', result.duration, 'ms');

        // Verification
        console.log('\n🔍 Verification:');

        if (!result.data.usedPoints || !Array.isArray(result.data.usedPoints)) {
            console.error('❌ FAIL: usedPoints is not an array!');
            console.error('   Actual:', result.data.usedPoints);
            return;
        }

        if (result.data.usedPoints.length === 0) {
            console.warn('⚠️  WARNING: usedPoints is empty array');
        } else {
            console.log('✅ PASS: usedPoints is a valid array with', result.data.usedPoints.length, 'items');

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

        console.log('\n📝 Generated Content Preview:');
        console.log(result.data.content.substring(0, 300) + '...');
        console.log('\n✅ Test completed!');

        return result;

    } catch (error) {
        console.error('❌ Test failed:');
        console.error(error);
    }
})();
