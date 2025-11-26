import { ArticleConfig, KeywordActionPlan, AuthorityAnalysis, ServiceResponse, TokenUsage, CostBreakdown, ProductBrief, ProblemProductMapping, SectionGenerationResult, TargetAudience, ReferenceAnalysis } from '../types';
import { calculateCost, getLanguageInstruction } from './promptService';
import { filterSectionContext } from './extractionService';
import { generateContent } from './ai';
import { Type } from "@google/genai";
import { promptRegistry } from './promptRegistry';
import { MODEL } from '../config/constants';

// Helper to determine injection strategy for the current section
const getSectionInjectionPlan = (
    sectionTitle: string,
    refAnalysis: ReferenceAnalysis | undefined,
    productMapping: ProblemProductMapping[] = [],
    productBrief?: ProductBrief,
    currentInjectedCount: number = 0,
    isLastSections: boolean = false
): string => {
    if (!productBrief || !productBrief.productName) return "";

    let injectionPlan = `### 💎 COMMERCIAL & SERVICE STRATEGY (HIGH PRIORITY) \n`;
    let forceInjection = false;

    // ==================================================================================
    // 1. SANITIZATION & REPLACEMENT (CRITICAL)
    // ==================================================================================
    const competitorBrands = refAnalysis?.competitorBrands || [];
    const competitorProducts = refAnalysis?.competitorProducts || [];
    const genericReplacements = refAnalysis?.replacementRules || []; // Fallback

    const allTargets = [...new Set([...competitorBrands, ...competitorProducts, ...genericReplacements])];

    if (allTargets.length > 0) {
        injectionPlan += `
        **🛡️ SANITIZATION PROTOCOL (ABSOLUTE RULES):**
        You are writing for the brand: **"${productBrief.brandName}"**.
        The Reference Text mentions competitors: ${allTargets.map(t => `"${t}"`).join(', ')}.

        1. **TOTAL ANNIHILATION:** Never output these competitor words in the final text.
        2. **NO HYBRIDS:** Do NOT write "CompName as ${productBrief.brandName}". That is nonsense.
        3. **SUBJECT SWAP (SEMANTIC REWRITE):**
           - If the reference says: "${competitorBrands[0] || 'Competitor'} offers the best laser..."
           - **REWRITE AS:** "**${productBrief.brandName}** offers the best laser..." (Change the Subject).
           - If the reference discusses a specific machine (e.g., "${competitorProducts[0] || 'OldMachine'}"), replace it with **"${productBrief.productName}"**.
        `;
    }

    // ==================================================================================
    // 2. DENSITY CONTROL (AVOID KEYWORD STUFFING)
    // ==================================================================================
    injectionPlan += `
    **📉 DENSITY CONTROL (AVOID KEYWORD STUFFING):**
    - **Full Name Rule:** Use the full product name "**${productBrief.productName}**" **MAXIMUM ONCE** in this section.
    - **Natural Variation:** For subsequent mentions, you MUST use variations:
      - The Brand Name: "**${productBrief.brandName}**"
      - Pronouns: "We", "Our team", "The center"
      - Generic: "This technology", "The treatment", "Our service"
    `;

    // ==================================================================================
    // 3. INJECTION LOGIC (Force vs Natural)
    // ==================================================================================

    // Logic: If we haven't mentioned the product enough (<= 2) and we are at the end, FORCE IT.
    if (isLastSections && currentInjectedCount <= 2) {
        forceInjection = true;
        injectionPlan += `\n**🚀 MANDATORY INJECTION:** You have NOT mentioned "${productBrief.brandName}" enough yet. You MUST introduce it here as the solution.\n`;
    }

    // Match specific pain points to this section title.
    const titleLower = sectionTitle.toLowerCase();
    const relevantMappings = productMapping.filter(m =>
        m.relevanceKeywords.some(kw => titleLower.includes(kw.toLowerCase()))
    );
    const isSolutionSection = titleLower.includes('solution') || titleLower.includes('benefit') || titleLower.includes('guide') || titleLower.includes('how');

    let finalMappings = relevantMappings;
    if (relevantMappings.length === 0 && (forceInjection || isSolutionSection)) {
        // Fallback: Pick top 2 generic mappings
        finalMappings = productMapping.slice(0, 2);
    }

    if (finalMappings.length > 0) {
        injectionPlan += `\n**💡 PROBLEM-SOLUTION WEAVING:**\nIntegrate the following mapping naturally:\n`;
        finalMappings.forEach(m => {
            injectionPlan += `- Discuss "${m.painPoint}" -> Then present **${productBrief.brandName}** (or ${productBrief.productName}) as the solution using [${m.productFeature}].\n`;
        });
    }

    // CTA
    injectionPlan += `\n**CTA:** End with a natural link: [${productBrief.ctaLink}] (Anchor: Check ${productBrief.brandName} pricing/details).\n`;

    return injectionPlan;
};


// 3. Generate Single Section
export const generateSectionContent = async (
    config: ArticleConfig,
    sectionTitle: string,
    specificPlan: string[] | undefined,
    generalPlan: string[] | undefined,
    keywordPlans: KeywordActionPlan[],
    previousSections: string[] = [],
    futureSections: string[] = [],
    authorityAnalysis: AuthorityAnalysis | null = null,
    keyInfoPoints: string[] = [],
    currentCoveredPointsHistory: string[] = [],
    currentInjectedCount: number = 0
): Promise<ServiceResponse<SectionGenerationResult>> => {

    const startTs = Date.now();
    const isLastSections = futureSections.length <= 1;

    // RAG: Filter context to reduce token usage
    const contextFilter = await filterSectionContext(
        sectionTitle,
        keyInfoPoints,
        authorityAnalysis?.relevantTerms || [],
        config.brandKnowledge,
        config.targetAudience
    );

    const relevantKeyPoints = contextFilter.data.filteredPoints;
    const relevantAuthTerms = contextFilter.data.filteredAuthTerms;
    const kbInsights = contextFilter.data.knowledgeInsights;

    // --- FREQUENCY CAP LOGIC ---
    const MAX_USAGE_LIMIT = 2;

    const pointsAvailableForThisSection = relevantKeyPoints.filter(point => {
        const usageCount = currentCoveredPointsHistory.filter(p => p === point).length;
        return usageCount < MAX_USAGE_LIMIT;
    });

    // Inject Product/Commercial Strategy if brief exists
    const injectionPlan = getSectionInjectionPlan(
        sectionTitle,
        config.referenceAnalysis,
        config.productMapping,
        config.productBrief,
        currentInjectedCount,
        isLastSections
    );

    const languageInstruction = getLanguageInstruction(config.targetAudience);

    const prompt = promptRegistry.build('sectionContent', {
        sectionTitle,
        languageInstruction,
        previousSections,
        futureSections,
        generalPlan,
        specificPlan,
        kbInsights,
        keywordPlans,
        relevantAuthTerms,
        points: pointsAvailableForThisSection,
        injectionPlan,
        articleTitle: config.title,
    });

    const response = await generateContent(
        MODEL.FLASH,
        prompt,
        {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    content: { type: Type.STRING },
                    usedPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                    injectedCount: { type: Type.INTEGER, description: "How many times did you mention the Product Name?" }
                }
            }
        }
    );

    let data;
    try {
        let cleanText = response.text || "{}";
        cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
        data = JSON.parse(cleanText);
    } catch (e) {
        console.warn("JSON Parse Failed for section content, falling back to raw text", e);
        data = {
            content: response.text || "",
            usedPoints: [],
            injectedCount: 0
        };
    }

    const metrics = calculateCost(response.usageMetadata, 'FLASH');

    const totalCost = {
        inputCost: metrics.cost.inputCost + contextFilter.cost.inputCost,
        outputCost: metrics.cost.outputCost + contextFilter.cost.outputCost,
        totalCost: metrics.cost.totalCost + contextFilter.cost.totalCost
    };

    const totalUsage = {
        inputTokens: metrics.usage.inputTokens + contextFilter.usage.inputTokens,
        outputTokens: metrics.usage.outputTokens + contextFilter.usage.outputTokens,
        totalTokens: metrics.usage.totalTokens + contextFilter.usage.totalTokens
    };

    const duration = Date.now() - startTs;

    return {
        data: {
            content: data.content || "",
            usedPoints: data.usedPoints || [],
            injectedCount: data.injectedCount || 0
        },
        usage: totalUsage,
        cost: totalCost,
        duration
    };
};

// AI Rewriter / Formatter (Small Tool)
export const generateSnippet = async (prompt: string, targetAudience: TargetAudience): Promise<ServiceResponse<string>> => {
    const startTs = Date.now();
    const languageInstruction = getLanguageInstruction(targetAudience);

    const fullPrompt = promptRegistry.build('snippet', { prompt, languageInstruction });

    const response = await generateContent(MODEL.FLASH, fullPrompt);
    const metrics = calculateCost(response.usageMetadata, 'FLASH');
    return { data: response.text || "", ...metrics, duration: Date.now() - startTs };
};

// REBRAND CONTENT (Global Entity Swap)
export const rebrandContent = async (
    currentContent: string,
    productBrief: ProductBrief,
    targetAudience: TargetAudience
): Promise<ServiceResponse<string>> => {
    const startTs = Date.now();
    const languageInstruction = getLanguageInstruction(targetAudience);

    const prompt = promptRegistry.build('rebrandContent', { productBrief, languageInstruction, currentContent });

    const response = await generateContent(MODEL.FLASH, prompt);

    const metrics = calculateCost(response.usageMetadata, 'FLASH');
    return { data: response.text || "", ...metrics, duration: Date.now() - startTs };
};


// 🆕 SMART INJECT POINT (Refine with Paragraph Compact Indexing)
export const smartInjectPoint = async (
    fullHtmlContent: string,
    pointToInject: string,
    targetAudience: TargetAudience
): Promise<ServiceResponse<{ originalSnippet: string, newSnippet: string }>> => {

    const startTs = Date.now();
    const languageInstruction = getLanguageInstruction(targetAudience);

    // 1. PARSE & INDEX (Paragraph Compact Indexing)
    const parser = new DOMParser();
    const doc = parser.parseFromString(fullHtmlContent, 'text/html');

    const blocks: { id: number, text: string, html: string }[] = [];
    const nodes = doc.querySelectorAll('p, li');

    nodes.forEach((node, index) => {
        const text = node.textContent?.trim() || "";
        if (text.length > 20) {
            blocks.push({
                id: index,
                text: text.substring(0, 80) + "...",
                html: node.outerHTML
            });
        }
    });

    if (blocks.length === 0) {
        return { data: { originalSnippet: "", newSnippet: "" }, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: Date.now() - startTs };
    }

    // 2. FIND BEST BLOCK (Prompt 1)
    const findPrompt = promptRegistry.build('smartFindBlock', { pointToInject, blocks });

    const findRes = await generateContent(MODEL.FLASH, findPrompt);

    const bestIdStr = findRes.text?.trim().match(/\d+/)?.[0];
    const bestId = bestIdStr ? parseInt(bestIdStr) : -1;

    const targetBlock = blocks.find(b => b.id === bestId);

    if (!targetBlock) {
        return { data: { originalSnippet: "", newSnippet: "" }, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: Date.now() - startTs };
    }

    // 3. REWRITE BLOCK (Prompt 2)
    const rewritePrompt = promptRegistry.build('smartRewriteBlock', { pointToInject, targetHtml: targetBlock.html, languageInstruction });

    const rewriteRes = await generateContent(MODEL.FLASH, rewritePrompt);

    const cost1 = calculateCost(findRes.usageMetadata, 'FLASH');
    const cost2 = calculateCost(rewriteRes.usageMetadata, 'FLASH');

    const totalUsage = {
        inputTokens: cost1.usage.inputTokens + cost2.usage.inputTokens,
        outputTokens: cost1.usage.outputTokens + cost2.usage.outputTokens,
        totalTokens: cost1.usage.totalTokens + cost2.usage.totalTokens,
    };
    const totalCost = {
        inputCost: cost1.cost.inputCost + cost2.cost.inputCost,
        outputCost: cost1.cost.outputCost + cost2.cost.outputCost,
        totalCost: cost1.cost.totalCost + cost2.cost.totalCost,
    };

    return {
        data: {
            originalSnippet: targetBlock.html,
            newSnippet: rewriteRes.text?.trim() || targetBlock.html
        },
        usage: totalUsage,
        cost: totalCost,
        duration: Date.now() - startTs
    };
};
