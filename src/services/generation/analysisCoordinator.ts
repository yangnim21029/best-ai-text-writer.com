import { ArticleConfig } from '../../types';
import { parseProductContext, generateProblemProductMapping } from '@/services/research/productFeatureToPainPointMapper';
import { analyzeText } from '@/services/engine/nlpService';
import { extractSemanticKeywordsAnalysis } from '@/services/research/termUsagePlanner';
import { analyzeReferenceStructure } from '@/services/research/referenceAnalysisService';
import { analyzeAuthorityTerms } from '../../services/research/authorityService';
import { analyzeVisualStyle } from '../../services/generation/imageService';
import { appendAnalysisLog, summarizeList } from '../../hooks/generation/generationLogger';
import { getLanguageInstruction } from '../../services/engine/promptService';
import { analyzeRegionalTerms } from '../../services/research/regionalAnalysisService';

export interface AnalysisDependencies {
    generationStore: {
        setStatus: (status: any) => void;
        setGenerationStep: (step: any) => void;
        isStopped: boolean;
    };
    analysisStore: {
        setScrapedImages: (images: any[]) => void;
        setTargetAudience: (audience: any) => void;
        setArticleTitle: (title: string) => void;
        setLanguageInstruction: (instruction: string) => void;
        setProductMapping: (mapping: any[]) => void;
        setActiveProductBrief: (brief: any) => void;
        setKeywordPlans: (plans: any[]) => void;
        setRefAnalysis: (analysis: any) => void;
        setAuthAnalysis: (analysis: any) => void;
        setVisualStyle: (style: any) => void;
        saveCurrentToDocument: () => void;
        brandKnowledge: string;
        refAnalysis: any;
    };
    appStore: {
        addCost: (cost: number, tokens: number) => void;
        keywordCharDivisor: number;
        minKeywords: number;
        maxKeywords: number;
    };
}

const audienceLabel = (aud: ArticleConfig['targetAudience']) => {
    switch (aud) {
        case 'zh-HK': return '繁體中文（香港）';
        case 'zh-MY': return '簡體中文（馬來西亞）';
        case 'zh-TW':
        default:
            return '繁體中文（台灣）';
    }
};

export const runAnalysisPipelineService = async (
    config: ArticleConfig,
    deps: AnalysisDependencies
) => {
    const { generationStore, analysisStore, appStore } = deps;

    // Reset State for Analysis
    generationStore.setStatus('analyzing');
    analysisStore.setScrapedImages(config.scrapedImages || []);
    analysisStore.setTargetAudience(config.targetAudience);
    analysisStore.setArticleTitle(config.title || '');
    
    const languageInstruction = getLanguageInstruction(config.targetAudience);
    analysisStore.setLanguageInstruction(languageInstruction);
    
    appendAnalysisLog(`語言設定：${audienceLabel(config.targetAudience)}（${config.targetAudience}）`);
    appendAnalysisLog('Starting analysis...');

    const fullConfig = {
        ...config,
        brandKnowledge: analysisStore.brandKnowledge
    };

    const isStopped = () => generationStore.isStopped;

    // Task 1: Product Context
    const productTask = async () => {
        let parsedProductBrief = config.productBrief;
        let generatedMapping: any[] = [];

        if (!parsedProductBrief && config.productRawText && config.productRawText.length > 5) {
            if (isStopped()) return { mapping: [] };
            generationStore.setGenerationStep('parsing_product');
            appendAnalysisLog('Parsing product brief and CTA...');
            const parseRes = await parseProductContext(config.productRawText);
            parsedProductBrief = parseRes.data;
            appendAnalysisLog('Product brief parsed.');
            appStore.addCost(parseRes.cost.totalCost, parseRes.usage.totalTokens);
        }

        if (parsedProductBrief && parsedProductBrief.productName) {
            if (isStopped()) return { brief: parsedProductBrief, mapping: [] };
            generationStore.setGenerationStep('mapping_product');
            appendAnalysisLog('Mapping pain points to product features...');
            const mapRes = await generateProblemProductMapping(parsedProductBrief, fullConfig.targetAudience);
            generatedMapping = mapRes.data;
            analysisStore.setProductMapping(generatedMapping);
            appendAnalysisLog(`Product-feature mapping ready (${generatedMapping.length}).`);
            appStore.addCost(mapRes.cost.totalCost, mapRes.usage.totalTokens);
        }

        analysisStore.setActiveProductBrief(parsedProductBrief);
        return { brief: parsedProductBrief, mapping: generatedMapping };
    };

    // Task 2: NLP & Keyword Planning
    const keywordTask = async () => {
        if (isStopped()) return;
        generationStore.setGenerationStep('nlp_analysis');
        appendAnalysisLog('Running NLP keyword scan...');
        const keywords = await analyzeText(fullConfig.referenceContent);

        const contentLen = fullConfig.referenceContent.length;
        const calculatedLimit = Math.floor(contentLen / appStore.keywordCharDivisor);
        const finalLimit = Math.max(appStore.minKeywords, Math.min(appStore.maxKeywords, calculatedLimit));

        const keywordPlanCandidates = keywords.slice(0, finalLimit);
        
        if (keywordPlanCandidates.length > 0 && !isStopped()) {
            generationStore.setGenerationStep('planning_keywords');
            try {
                appendAnalysisLog(`Planning keyword strategy...`);
                const planRes = await extractSemanticKeywordsAnalysis(fullConfig.referenceContent, keywords, fullConfig.targetAudience);
                analysisStore.setKeywordPlans(planRes.data);
                appendAnalysisLog(`Keyword plan ready (${planRes.data.length}).`);
                appStore.addCost(planRes.cost.totalCost, planRes.usage.totalTokens);
            } catch (e) {
                console.warn("Action Plan extraction failed", e);
                appendAnalysisLog('Keyword planning failed (continuing).');
            }
        }
    };

    // Task 3: Structure & Authority
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

        appendAnalysisLog(`Structure extracted.`);
        appStore.addCost(structRes.cost.totalCost, structRes.usage.totalTokens);
        appStore.addCost(authRes.cost.totalCost, authRes.usage.totalTokens);

        analysisStore.setRefAnalysis(structRes.data);
        analysisStore.setAuthAnalysis(authRes.data);

        return { structRes, authRes };
    };

    // Task 4: Visual Style
    const visualTask = async () => {
        if (isStopped()) return;
        generationStore.setGenerationStep('analyzing_visuals');
        appendAnalysisLog('Analyzing source images and visual identity...');

        const initialImages = config.scrapedImages || [];
        analysisStore.setScrapedImages(initialImages);

        try {
            const styleRes = await analyzeVisualStyle(initialImages, fullConfig.websiteType || "Modern Business");
            analysisStore.setVisualStyle(styleRes.data);
            appendAnalysisLog(`✓ Visual style extracted.`);
            appStore.addCost(styleRes.cost.totalCost, styleRes.usage.totalTokens);
        } catch (e) {
            console.warn("Failed to extract visual style", e);
            appendAnalysisLog('Visual style extraction skipped.');
        }
    };

    // Task 5: Regional Analysis
    const regionalTask = async () => {
        if (isStopped()) return;
        appendAnalysisLog('Analyzing regional terminology & brand grounding...');

        try {
            const regionRes = await analyzeRegionalTerms(fullConfig.referenceContent, fullConfig.targetAudience);
            if (regionRes.data && regionRes.data.length > 0) {
                appendAnalysisLog(`Regional analysis found ${regionRes.data.length} terms to correct.`);
                return regionRes.data;
            }
            appendAnalysisLog('Regional analysis: No major issues found.');
            return [];
        } catch (e) {
            console.warn("Regional analysis failed", e);
            appendAnalysisLog('Regional analysis failed (continuing).');
            return [];
        }
    };

    // Execution with simple staggered delay to avoid rate limits
    const productResult = await productTask();
    if (isStopped()) return;
    
    await new Promise(r => setTimeout(r, 800));
    const structureResult = await structureTask();
    
    await new Promise(r => setTimeout(r, 800));
    const [visualResult, regionalResult, keywordResult] = await Promise.all([
        visualTask(),
        regionalTask(),
        keywordTask()
    ]);

    // Merge regional result
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
    generationStore.setStatus('analysis_ready');
    generationStore.setGenerationStep('idle');
    analysisStore.saveCurrentToDocument();

    return {
        productResult,
        structureResult,
        keywordResult,
        visualResult,
        regionalResult
    };
};
