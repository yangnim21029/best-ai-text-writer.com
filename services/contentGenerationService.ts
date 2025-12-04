import { ArticleConfig, KeywordActionPlan, AuthorityAnalysis, ServiceResponse, TokenUsage, CostBreakdown, ProductBrief, ProblemProductMapping, SectionGenerationResult, TargetAudience, ReferenceAnalysis, SectionAnalysis } from '../types';
import { calculateCost, getLanguageInstruction } from './promptService';
import { filterSectionContext } from './contextFilterService';
import { promptTemplates } from './promptTemplates';
import { MODEL, SEMANTIC_KEYWORD_LIMIT } from '../config/constants';
import { aiService } from './aiService';

import { Type } from './schemaTypes';

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

// Demote or strip H1/H2 headings from model output to avoid duplicate section titles.
const normalizeSectionContent = (content: string): string => {
    let normalized = content || "";
    normalized = normalized.replace(/^##\s+/gm, "### "); // Demote H2 -> H3
    normalized = normalized.replace(/^#\s+/gm, "### ");  // Demote H1 -> H3
    normalized = normalized.replace(/<h1>(.*?)<\/h1>/gi, "### $1");
    normalized = normalized.replace(/<h2>(.*?)<\/h2>/gi, "### $1");
    return normalized;
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
    currentInjectedCount: number = 0,
    sectionMeta: Partial<SectionAnalysis> = {}
): Promise<ServiceResponse<SectionGenerationResult>> => {

    const startTs = Date.now();
    const isLastSections = futureSections.length <= 1;
    const keywordPlansForPrompt = keywordPlans.slice(0, SEMANTIC_KEYWORD_LIMIT);

    // RAG: Filter context to reduce token usage
    const contextFilter = await filterSectionContext(
        sectionTitle,
        keyInfoPoints,
        authorityAnalysis?.relevantTerms || [],
        config.brandKnowledge,
        config.targetAudience
    );

    const sectionKeyFacts = Array.isArray((sectionMeta as any).keyFacts) ? (sectionMeta as any).keyFacts : [];
    const augmentFacts = Array.isArray((sectionMeta as any).augment) ? (sectionMeta as any).augment : [];
    const relevantKeyPoints = Array.from(new Set([
        ...sectionKeyFacts,
        ...augmentFacts,
        ...contextFilter.data.filteredPoints
    ]));
    const relevantAuthTerms = contextFilter.data.filteredAuthTerms;
    const kbInsights = contextFilter.data.knowledgeInsights;

    // Use all relevant points; no frequency cap so checklists can stay intact.
    const pointsAvailableForThisSection = relevantKeyPoints;

    const { coreQuestion, difficulty, writingMode, solutionAngles } = sectionMeta || {};

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
    const suppressHints = Array.isArray((sectionMeta as any).suppress) ? (sectionMeta as any).suppress : [];
    const shiftPlanHints = Array.isArray((sectionMeta as any).shiftPlan)
        ? (sectionMeta as any).shiftPlan.map((p: any) => {
            const from = typeof p?.from === 'string' ? p.from : '';
            const to = typeof p?.to === 'string' ? p.to : '';
            const reason = typeof p?.reason === 'string' ? p.reason : '';
            return [from && `from: ${from}`, to && `to: ${to}`, reason && `why: ${reason}`].filter(Boolean).join(' | ');
        }).filter(Boolean)
        : [];
    const renderMode = (sectionMeta as any).isChecklist ? 'checklist' : undefined;
    const augmentHints = Array.isArray((sectionMeta as any).augment) ? (sectionMeta as any).augment : [];

    const prompt = promptTemplates.sectionContent({
        sectionTitle,
        languageInstruction,
        previousSections,
        futureSections,
        generalPlan,
        specificPlan,
        kbInsights,
        keywordPlans: keywordPlansForPrompt,
        relevantAuthTerms,
        points: pointsAvailableForThisSection,
        injectionPlan,
        articleTitle: config.title,
        coreQuestion,
        difficulty,
        writingMode,
        solutionAngles,
        renderMode,
        shiftPlan: shiftPlanHints,
        suppressHints,
        augmentHints,
        avoidContent: [
            ...futureSections,
            ...previousSections,
            ...relevantKeyPoints.filter(p => !pointsAvailableForThisSection.includes(p)),
            ...suppressHints
        ]
    });

    const response = await aiService.runJson<any>(
        prompt,
        'FLASH',
        {
            type: Type.OBJECT,
            properties: {
                content: { type: Type.STRING },
                usedPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
                injectedCount: { type: Type.INTEGER, description: "How many times did you mention the Product Name?" }
            }
        }
    );

    const payload = response.data || {};
    const rawContent =
        (typeof payload.content === 'string' && payload.content.trim().length > 0)
            ? payload.content
            : (typeof payload.sectionContent === 'string' ? payload.sectionContent : "");

    const usedPointsSource =
        (Array.isArray(payload.usedPoints) && payload.usedPoints) ||
        (Array.isArray((payload as any).used_points) && (payload as any).used_points) ||
        (Array.isArray((payload as any).pointsUsed) && (payload as any).pointsUsed) ||
        (Array.isArray((payload as any).usedFacts) && (payload as any).usedFacts) ||
        [];
    const usedPoints = Array.isArray(usedPointsSource)
        ? usedPointsSource.map(p => (typeof p === 'string' ? p : String(p || '')).trim()).filter(Boolean)
        : [];
    const injectedRaw = payload.injectedCount ?? (payload as any).injected_count ?? 0;
    const injectedCount = typeof injectedRaw === 'number' ? injectedRaw : Number(injectedRaw) || 0;

    const data = {
        content: rawContent,
        usedPoints,
        injectedCount
    };

    const totalCost = {
        inputCost: response.cost.inputCost + contextFilter.cost.inputCost,
        outputCost: response.cost.outputCost + contextFilter.cost.outputCost,
        totalCost: response.cost.totalCost + contextFilter.cost.totalCost
    };

    const normalizedContent = normalizeSectionContent(data.content || "");

    const totalUsage = {
        inputTokens: response.usage.inputTokens + contextFilter.usage.inputTokens,
        outputTokens: response.usage.outputTokens + contextFilter.usage.outputTokens,
        totalTokens: response.usage.totalTokens + contextFilter.usage.totalTokens
    };

    const duration = Date.now() - startTs;

    return {
        data: {
            content: normalizedContent,
            usedPoints: data.usedPoints || [],
            injectedCount: data.injectedCount || 0
        },
        usage: totalUsage,
        cost: totalCost,
        duration
    };
};

// AI Rewriter / Formatter (Small Tool)
export const generateSnippet = async (
    prompt: string,
    targetAudience: TargetAudience,
    config?: any
): Promise<ServiceResponse<string>> => {
    const languageInstruction = getLanguageInstruction(targetAudience);
    const fullPrompt = promptTemplates.snippet({ prompt, languageInstruction });
    const res = await aiService.runText(fullPrompt, 'FLASH', config);
    return { data: res.text, usage: res.usage, cost: res.cost, duration: res.duration };
};

// REBRAND CONTENT (Global Entity Swap)
export const rebrandContent = async (
    currentContent: string,
    productBrief: ProductBrief,
    targetAudience: TargetAudience
): Promise<ServiceResponse<string>> => {
    const languageInstruction = getLanguageInstruction(targetAudience);
    const prompt = promptTemplates.rebrandContent({ productBrief, languageInstruction, currentContent });
    const res = await aiService.runText(prompt, 'FLASH');
    return { data: res.text, usage: res.usage, cost: res.cost, duration: res.duration };
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
    const findPrompt = promptTemplates.smartFindBlock({ pointToInject, blocks });

    const findRes = await aiService.runText(findPrompt, 'FLASH');

    const bestIdStr = findRes.text?.trim().match(/\d+/)?.[0];
    const bestId = bestIdStr ? parseInt(bestIdStr) : -1;

    const targetBlock = blocks.find(b => b.id === bestId);

    if (!targetBlock) {
        return { data: { originalSnippet: "", newSnippet: "" }, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: Date.now() - startTs };
    }

    // 3. REWRITE BLOCK (Prompt 2)
    const rewritePrompt = promptTemplates.smartRewriteBlock({ pointToInject, targetHtml: targetBlock.html, languageInstruction });

    const rewriteRes = await aiService.runText(rewritePrompt, 'FLASH');

    const totalUsage = {
        inputTokens: (findRes.usage?.inputTokens || 0) + (rewriteRes.usage?.inputTokens || 0),
        outputTokens: (findRes.usage?.outputTokens || 0) + (rewriteRes.usage?.outputTokens || 0),
        totalTokens: (findRes.usage?.totalTokens || 0) + (rewriteRes.usage?.totalTokens || 0),
    };
    const totalCost = calculateCost(totalUsage, 'FLASH');

    return {
        data: {
            originalSnippet: targetBlock.html,
            newSnippet: rewriteRes.text?.trim() || targetBlock.html
        },
        usage: totalUsage,
        cost: totalCost.cost,
        duration: Date.now() - startTs
    };
};
