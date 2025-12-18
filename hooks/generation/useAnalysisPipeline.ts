import { ArticleConfig, SectionAnalysis } from '../../types';
import { useGenerationStore } from '../../store/useGenerationStore';
import { useAnalysisStore } from '../../store/useAnalysisStore';
import { useMetricsStore } from '../../store/useMetricsStore';
import { parseProductContext, generateProblemProductMapping } from '../../services/research/productFeatureToPainPointMapper';
import { analyzeText } from '../../services/engine/nlpService';
import { extractSemanticKeywordsAnalysis } from '../../services/research/termUsagePlanner';
import { SEMANTIC_KEYWORD_LIMIT } from '../../config/constants';
import { useSettingsStore } from '../../store/useSettingsStore';
import { analyzeReferenceStructure } from '../../services/research/referenceAnalysisService';
import { analyzeAuthorityTerms } from '../../services/research/authorityService';
import { analyzeImageWithAI, analyzeVisualStyle } from '../../services/generation/imageService';
import { appendAnalysisLog, summarizeList } from './generationLogger';
import { getLanguageInstruction } from '../../services/engine/promptService';

import { cleanHeadingText } from '../../utils/textUtils';
import { analyzeRegionalTerms } from '../../services/research/regionalAnalysisService';


const isStopped = () => useGenerationStore.getState().isStopped;
const audienceLabel = (aud: ArticleConfig['targetAudience']) => {
    switch (aud) {
        case 'zh-HK': return '繁體中文（香港）';
        case 'zh-MY': return '簡體中文（馬來西亞）';
        case 'zh-TW':
        default:
            return '繁體中文（台灣）';
    }
};



export const runAnalysisPipeline = async (config: ArticleConfig) => {
    const generationStore = useGenerationStore.getState();
    const analysisStore = useAnalysisStore.getState();
    const metricsStore = useMetricsStore.getState();

    // Reset State for Analysis
    generationStore.setStatus('analyzing');
    analysisStore.setScrapedImages(config.scrapedImages || []);
    analysisStore.setTargetAudience(config.targetAudience);
    analysisStore.setArticleTitle(config.title || '');
    const languageInstruction = getLanguageInstruction(config.targetAudience);
    analysisStore.setLanguageInstruction(languageInstruction);
    console.info('[LangConfig]', { targetAudience: config.targetAudience, languageInstruction });
    appendAnalysisLog(`語言設定：${audienceLabel(config.targetAudience)}（${config.targetAudience}）`);
    appendAnalysisLog('Starting analysis...');

    const fullConfig = {
        ...config,
        brandKnowledge: analysisStore.brandKnowledge
    };

    // Task 1: Product Context
    const productTask = async () => {
        let parsedProductBrief = config.productBrief;
        let generatedMapping: any[] = [];

        if (!parsedProductBrief && config.productRawText && config.productRawText.length > 5) {
            if (isStopped()) return { mapping: [] };
            generationStore.setGenerationStep('parsing_product');
            appendAnalysisLog('Parsing product brief and CTA...');
            const parseRes = await parseProductContext(config.productRawText);
            console.log(`[Timer] Product Context Parse: ${parseRes.duration}ms`);
            parsedProductBrief = parseRes.data;
            appendAnalysisLog('Product brief parsed.');
            metricsStore.addCost(parseRes.cost.totalCost, parseRes.usage.totalTokens);
        }

        if (parsedProductBrief && parsedProductBrief.productName) {
            if (isStopped()) return { brief: parsedProductBrief, mapping: [] };
            generationStore.setGenerationStep('mapping_product');
            appendAnalysisLog('Mapping pain points to product features...');
            const mapRes = await generateProblemProductMapping(parsedProductBrief, fullConfig.targetAudience);
            console.log(`[Timer] Product Mapping: ${mapRes.duration}ms`);
            generatedMapping = mapRes.data;
            analysisStore.setProductMapping(generatedMapping);
            if (generatedMapping.length > 0) {
                const example = generatedMapping[0];
                appendAnalysisLog(`Product-feature mapping ready (${generatedMapping.length}). e.g., ${example.painPoint} → ${example.productFeature}`);
            } else {
                appendAnalysisLog('Product-feature mapping ready (no matches found).');
            }
            metricsStore.addCost(mapRes.cost.totalCost, mapRes.usage.totalTokens);
        }

        analysisStore.setActiveProductBrief(parsedProductBrief);
        return { brief: parsedProductBrief, mapping: generatedMapping };
    };

    // Task 1.5: Heading refinement for preview (uses extracted structure titles)


    // Task 2: NLP & Keyword Planning
    const keywordTask = async () => {
        if (isStopped()) return;
        generationStore.setGenerationStep('nlp_analysis');
        appendAnalysisLog('Running NLP keyword scan...');
        const keywords = await analyzeText(fullConfig.referenceContent);

        // DYNAMIC LIMIT CALCULATION:
        const settings = useSettingsStore.getState();
        const contentLen = fullConfig.referenceContent.length;
        const calculatedLimit = Math.floor(contentLen / settings.keywordCharDivisor);
        const finalLimit = Math.max(settings.minKeywords, Math.min(settings.maxKeywords, calculatedLimit));

        const keywordPlanCandidates = keywords.slice(0, finalLimit);
        const topTokens = summarizeList(keywordPlanCandidates.map(k => k.token), 6);
        appendAnalysisLog(`NLP scan found ${keywords.length} keywords. Using top ${keywordPlanCandidates.length} (Ratio: 1/${settings.keywordCharDivisor}, Min: ${settings.minKeywords}): ${topTokens}`);

        if (keywordPlanCandidates.length > 0 && !isStopped()) {
            generationStore.setGenerationStep('planning_keywords');
            try {
                appendAnalysisLog(`Planning keyword strategy (top ${keywordPlanCandidates.length})...`);
                const planRes = await extractSemanticKeywordsAnalysis(fullConfig.referenceContent, keywords, fullConfig.targetAudience);
                console.log(`[Timer] Keyword Action Plan: ${planRes.duration}ms`);
                console.log(`[SemanticKeywords] Final aggregated plans: ${planRes.data.length} / ${keywordPlanCandidates.length}`);
                analysisStore.setKeywordPlans(planRes.data);
                const planWords = summarizeList(planRes.data.map(p => p.word), 6);
                appendAnalysisLog(`Keyword plan ready (${planRes.data.length}). Focus: ${planWords}`);
                metricsStore.addCost(planRes.cost.totalCost, planRes.usage.totalTokens);
            } catch (e) {
                console.warn("Action Plan extraction failed", e);
                appendAnalysisLog('Keyword planning failed (continuing).');
            }
        }
    };

    // Task 3: Structure & Authority (run concurrently)
    const structureTask = async () => {
        if (isStopped()) return;
        generationStore.setGenerationStep('extracting_structure');
        appendAnalysisLog('Extracting reference structure and authority signals...');
        const [structRes, authRes] = await Promise.all([
            analyzeReferenceStructure(fullConfig.referenceContent, fullConfig.targetAudience),
            analyzeAuthorityTerms(
                fullConfig.authorityTerms || '',
                fullConfig.title,
                fullConfig.websiteType || 'General Professional Website',
                fullConfig.targetAudience
            )
        ]);

        console.log(`[Timer] Narrative Structure (Outline): ${structRes.duration}ms`);
        console.log(`[Timer] Authority Analysis: ${authRes.duration}ms`);
        appendAnalysisLog(`Structure extracted (${structRes.data?.structure?.length || 0} sections).`);
        appendAnalysisLog('Authority terms mapped.');
        if (structRes.data?.structure?.length) {
            const sectionTitles = summarizeList(structRes.data.structure.map((s: any) => s.title), 6);
            appendAnalysisLog(`Sections: ${sectionTitles}`);
        }
        if (authRes.data?.relevantTerms?.length) {
            appendAnalysisLog(`Authority terms: ${summarizeList(authRes.data.relevantTerms, 6)}`);
        }

        metricsStore.addCost(structRes.cost.totalCost, structRes.usage.totalTokens);
        metricsStore.addCost(authRes.cost.totalCost, authRes.usage.totalTokens);

        analysisStore.setRefAnalysis(structRes.data);
        analysisStore.setAuthAnalysis(authRes.data);

        return { structRes, authRes };
    };

    // Task 4: Image Analysis & Visual Style
    const visualTask = async () => {
        if (isStopped()) return;
        generationStore.setGenerationStep('analyzing_visuals');
        appendAnalysisLog('Analyzing source images and visual identity...');

        const initialImages = config.scrapedImages || [];
        const imagesToAnalyze = initialImages.slice(0, 5);
        let analyzedImages = [...initialImages];

        if (imagesToAnalyze.length > 0) {
            for (let i = 0; i < imagesToAnalyze.length; i++) {
                if (isStopped()) break;
                const img = imagesToAnalyze[i];
                if (img.url) {
                    try {
                        const res = await analyzeImageWithAI(img.url);
                        analyzedImages[i] = { ...analyzedImages[i], aiDescription: res.data };
                        metricsStore.addCost(res.cost.totalCost, res.usage.totalTokens);
                    } catch (e) {
                        console.warn(`Failed to analyze image ${img.url}`, e);
                    }
                }
            }
            analysisStore.setScrapedImages(analyzedImages);
        }

        try {
            const styleRes = await analyzeVisualStyle(analyzedImages, fullConfig.websiteType || "Modern Business");
            analysisStore.setVisualStyle(styleRes.data);
            appendAnalysisLog(`✓ Visual style extracted: ${styleRes.data}`);
            metricsStore.addCost(styleRes.cost.totalCost, styleRes.usage.totalTokens);
        } catch (e) {
            console.warn("Failed to extract visual style", e);
            appendAnalysisLog('Visual style extraction skipped.');
        }
    };



    // Task 5: Regional Analysis (NEW)
    const regionalTask = async () => {
        if (isStopped()) return;
        generationStore.setGenerationStep('localizing_hk'); // Reuse step label or create new 'analyzing_region'
        appendAnalysisLog('Analyzing regional terminology & brand grounding...');

        try {
            const regionRes = await analyzeRegionalTerms(fullConfig.referenceContent, fullConfig.targetAudience);
            console.log(`[Timer] Regional Analysis: ${regionRes.duration}ms`);

            if (regionRes.data && regionRes.data.length > 0) {
                appendAnalysisLog(`Regional analysis found ${regionRes.data.length} terms to correct.`);
                // Store in refAnalysis (requires refAnalysis to be initialized first, or return it)
                return regionRes.data;
            } else {
                appendAnalysisLog('Regional analysis: No major issues found.');
                return [];
            }
        } catch (e) {
            console.warn("Regional analysis failed", e);
            appendAnalysisLog('Regional analysis failed (continuing).');
            return [];
        }
    };

    // --- EXECUTE ALL TASKS WITH STAGGERING ---
    // Burst protection: Start each major task 1 second apart to prevent proxy/backend overload
    appendAnalysisLog('Dispatching analysis tasks with burst protection...');

    const productResult = await productTask();
    await new Promise(r => setTimeout(r, 1000));

    const [structureResult, visualResultsPromise, regionalResult, keywordResult] = await Promise.all([
        structureTask(),
        (async () => {
            await new Promise(r => setTimeout(r, 1000));
            return visualTask();
        })(),
        (async () => {
            await new Promise(r => setTimeout(r, 2000));
            return regionalTask();
        })(),
        (async () => {
            await new Promise(r => setTimeout(r, 3000));
            return keywordTask();
        })()
    ]);

    // Merge regional result into structureResult if available
    if (structureResult?.structRes?.data) {
        structureResult.structRes.data.regionalReplacements = regionalResult;
        if (analysisStore.refAnalysis) {
            analysisStore.setRefAnalysis({
                ...analysisStore.refAnalysis,
                regionalReplacements: regionalResult
            });
        }
    }

    appendAnalysisLog('All analysis tasks completed. Preparing to write...');
    generationStore.setGenerationStep('idle');

    return {
        productResult,
        structureResult,
        keywordPromise: Promise.resolve(keywordResult),
        visualPromise: Promise.resolve(visualResultsPromise),
        regionalPromise: Promise.resolve(regionalResult)
    };
};
