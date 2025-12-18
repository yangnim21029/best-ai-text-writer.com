import fetch from 'node-fetch';
import pLimit from 'p-limit';

const API_URL = 'http://localhost:3000/ai/generate';
const MODEL = 'gemini-3-flash-preview';
const AI_TOKEN = 'aiseokim24708053';

const TERMS = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she'
];

async function callAi(prompt: string, schema?: any) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_TOKEN}`
            },
            body: JSON.stringify({
                prompt,
                model: MODEL,
                schema
            }),
            signal: controller.signal
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`HTTP ${response.status}: ${text}`);
        }

        return await response.json();
    } finally {
        clearTimeout(timeout);
    }
}

async function callAiWithRetry(prompt: string, delays: number[] = [500, 1000, 2000]) {
    let attempt = 0;
    while (true) {
        try {
            return await callAi(prompt);
        } catch (e: any) {
            if (attempt >= delays.length) throw e;
            const wait = delays[attempt];
            console.warn(`    [Retry] Attempt ${attempt + 1} failed. Waiting ${wait}ms...`);
            await new Promise(r => setTimeout(r, wait));
            attempt++;
        }
    }
}

async function executeTest() {
    const results: any[] = [];

    const testStrategies = [
        {
            name: 'Stress Test: Concurrent 30 (0ms Delay)',
            fn: async () => {
                console.log(`  [Stress] Launching 30 requests simultaneously...`);
                await Promise.all(TERMS.map(term => callAi(`Analyze usage of word "${term}" highly concisely.`)));
            }
        },
        {
            name: 'Stress Test: Rapid Batches (Batch 10, 0ms Delay)',
            fn: async () => {
                const chunks = [TERMS.slice(0, 10), TERMS.slice(10, 20), TERMS.slice(20, 30)];
                for (let i = 0; i < chunks.length; i++) {
                    console.log(`  [Stress] Processing batch ${i + 1}/3 with 0ms delay...`);
                    await callAi(`Analyze usage of these 10 words concisely: ${chunks[i].join(', ')}`);
                }
            }
        },
        {
            name: 'Retry Test: Force Overload & Recovery',
            fn: async () => {
                console.log(`  [Retry Test] Bombarding server to find breaking point...`);
                // Launch 50 requests in parallel to see if it breaks
                const largeSet = Array(50).fill('test');
                try {
                    await Promise.all(largeSet.map((_, i) => callAi(`Task ${i}`)));
                    console.log(`  [Retry Test] Server handled 50 concurrent requests without breaking!`);
                } catch (e: any) {
                    console.log(`  [Retry Test] Server broke as expected: ${e.message}`);
                    console.log(`  [Retry Test] Testing recovery with 500ms delay...`);
                    const start = Date.now();
                    await callAiWithRetry(`Recover focus`, [500, 1000, 2000]);
                    console.log(`  [Retry Test] Recovered in ${Date.now() - start}ms`);
                }
            }
        }
    ];

    console.log(`Starting Stress Benchmark for ${MODEL}...`);
    console.log(`Using API_URL: ${API_URL}`);

    for (const strat of testStrategies) {
        console.log(`\n>>> Running Strategy: ${strat.name}`);
        const start = Date.now();
        let success = true;
        let error = '';
        try {
            await strat.fn();
        } catch (e: any) {
            success = false;
            error = e.message;
            console.error(`  [FAILED] ${strat.name}: ${error}`);
        }
        const duration = Date.now() - start;
        results.push({ name: strat.name, success, duration, error });
        console.log(`<<< ${strat.name}: ${success ? '✅' : '❌'} (${duration}ms)`);

        console.log(`Cooldown 5s before next strategy...`);
        await new Promise(r => setTimeout(r, 5000));
    }

    console.log('\n--- Final Stress Test Results ---');
    console.table(results);
}

executeTest().catch(err => {
    console.error('Fatal Error during benchmark:', err);
});
