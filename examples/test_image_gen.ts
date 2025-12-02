
import { planImagesForArticle, generateImage } from '../services/imageService';
import { ScrapedImage } from '../types';

async function testImageGeneration() {
    console.log("Starting Image Generation Test...");

    const mockArticleContent = `
    # The Future of AI Writing
    AI writing tools are revolutionizing content creation. They help writers generate ideas, draft outlines, and even write full articles.
    However, human oversight is still crucial to ensure quality and accuracy.
    `;

    const mockScrapedImages: ScrapedImage[] = [
        { url: 'http://example.com/img1.jpg', altText: 'AI Robot', aiDescription: 'A robot writing on a futuristic tablet' }
    ];

    const targetAudience = 'zh-TW';
    const visualStyle = 'Cyberpunk, neon lights, high contrast';

    try {
        console.log("Testing planImagesForArticle...");
        const planRes = await planImagesForArticle(mockArticleContent, mockScrapedImages, targetAudience, visualStyle);

        if (planRes.data && planRes.data.length > 0) {
            console.log(`Successfully planned ${planRes.data.length} images.`);
            console.log("First plan:", planRes.data[0]);

            const firstPlan = planRes.data[0];
            console.log(`Testing generateImage for prompt: "${firstPlan.generatedPrompt}"...`);

            // Note: In a real test we might mock the network call, but here we want to see if the service function works.
            // Be aware this will consume credits if it hits the real API. 
            // For this environment, we assume the service handles the API call.

            // Uncomment to run actual generation if environment allows
            // const imgRes = await generateImage(firstPlan.generatedPrompt);
            // console.log("Image Generation Result:", imgRes.data ? "Success (Data present)" : "Failed (No data)");

            console.log("Skipping actual image generation to save credits/time in this test script, but planning works.");

        } else {
            console.error("Failed to plan images or returned empty list.");
        }

    } catch (error) {
        console.error("Test failed with error:", error);
    }
}

testImageGeneration();
