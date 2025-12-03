import { ArticleConfig, KeywordActionPlan, AuthorityAnalysis, ServiceResponse, TokenUsage, CostBreakdown, ProductBrief, ProblemProductMapping, SectionGenerationResult, TargetAudience, ReferenceAnalysis, SectionAnalysis } from '../types';
import { calculateCost, getLanguageInstruction } from './promptService';
import { filterSectionContext } from './contextFilterService';
import { promptRegistry } from './promptRegistry';
import { MODEL, SEMANTIC_KEYWORD_LIMIT } from '../config/constants';
import { getAiProvider } from './aiProvider';
import { generateContent } from './ai';
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

    const relevantKeyPoints = contextFilter.data.filteredPoints;
    const relevantAuthTerms = contextFilter.data.filteredAuthTerms;
    const kbInsights = contextFilter.data.knowledgeInsights;

    // --- FREQUENCY CAP LOGIC ---
    const MAX_USAGE_LIMIT = 2;

    const pointsAvailableForThisSection = relevantKeyPoints.filter(point => {
        const usageCount = currentCoveredPointsHistory.filter(p => p === point).length;
        return usageCount < MAX_USAGE_LIMIT;
    });

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

    const prompt = promptRegistry.build('sectionContent', {
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
        avoidContent: [
            ...futureSections,
            ...previousSections,
            ...relevantKeyPoints.filter(p => !pointsAvailableForThisSection.includes(p))
        ]
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

    // Backend should return an object, but some deployments may only return a JSON string.
    // Parse defensively so the editor doesn't render raw JSON blobs.
    const unwrapPayload = (value: any) => {
        if (value && typeof value === 'object' && value.data && typeof value.data === 'object') {
            return value.data;
        }
        return value;
    };

    let parsed = response.object as any;
    if (!parsed && response.text) {
        try {
            parsed = JSON.parse(response.text);
        } catch {
            parsed = null;
        }
    }

    parsed = unwrapPayload(parsed);

    if (!parsed || typeof parsed !== 'object') {
        parsed = { content: response.text || "", usedPoints: [], injectedCount: 0 };
    }

    const payload = unwrapPayload(parsed) || {};
    const rawContent =
        (typeof payload.content === 'string' && payload.content.trim().length > 0)
            ? payload.content
            : (typeof payload.sectionContent === 'string' ? payload.sectionContent : (response.text || ""));
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

    const metrics = calculateCost(response.usageMetadata, 'FLASH');

    const totalCost = {
        inputCost: metrics.cost.inputCost + contextFilter.cost.inputCost,
        outputCost: metrics.cost.outputCost + contextFilter.cost.outputCost,
        totalCost: metrics.cost.totalCost + contextFilter.cost.totalCost
    };

    const normalizedContent = normalizeSectionContent(data.content || "");

    const totalUsage = {
        inputTokens: metrics.usage.inputTokens + contextFilter.usage.inputTokens,
        outputTokens: metrics.usage.outputTokens + contextFilter.usage.outputTokens,
        totalTokens: metrics.usage.totalTokens + contextFilter.usage.totalTokens
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
    const fullPrompt = promptRegistry.build('snippet', { prompt, languageInstruction });
    const res = await getAiProvider().runText(fullPrompt, 'FLASH', config);
    return { data: res.text, usage: res.usage, cost: res.cost, duration: res.duration };
};

// REBRAND CONTENT (Global Entity Swap)
export const rebrandContent = async (
    currentContent: string,
    productBrief: ProductBrief,
    targetAudience: TargetAudience
): Promise<ServiceResponse<string>> => {
    const languageInstruction = getLanguageInstruction(targetAudience);
    const prompt = promptRegistry.build('rebrandContent', { productBrief, languageInstruction, currentContent });
    const res = await getAiProvider().runText(prompt, 'FLASH');
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
    const findPrompt = promptRegistry.build('smartFindBlock', { pointToInject, blocks });

    const findRes = await getAiProvider().runText(findPrompt, 'FLASH');

    const bestIdStr = findRes.text?.trim().match(/\d+/)?.[0];
    const bestId = bestIdStr ? parseInt(bestIdStr) : -1;

    const targetBlock = blocks.find(b => b.id === bestId);

    if (!targetBlock) {
        return { data: { originalSnippet: "", newSnippet: "" }, usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 }, cost: { inputCost: 0, outputCost: 0, totalCost: 0 }, duration: Date.now() - startTs };
    }

    // 3. REWRITE BLOCK (Prompt 2)
    const rewritePrompt = promptRegistry.build('smartRewriteBlock', { pointToInject, targetHtml: targetBlock.html, languageInstruction });

    const rewriteRes = await getAiProvider().runText(rewritePrompt, 'FLASH');

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
