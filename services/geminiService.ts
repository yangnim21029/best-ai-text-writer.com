
import { GoogleGenAI } from "@google/genai";
import { ArticleConfig, KeywordActionPlan, AuthorityAnalysis, ServiceResponse, TokenUsage, CostBreakdown, ProductBrief, ProblemProductMapping, SectionGenerationResult, TargetAudience, ReferenceAnalysis } from '../types';
import { calculateCost, getLanguageInstruction } from './promptService';
import { filterSectionContext } from './extractionService';

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
    // 2. DENSITY CONTROL (NATURAL VARIATION)
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
    usedInfoPoints: string[] = [],
    currentInjectedCount: number = 0 // NEW: Track total injections so far
): Promise<ServiceResponse<SectionGenerationResult>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // 1. SMART CONTEXT FILTERING (Stronger RAG)
  let activeKeyPoints = keyInfoPoints;
  let activeAuthTerms = authorityAnalysis?.relevantTerms || [];
  let activeKnowledgeInsights: string[] = []; // Insights from KB
  
  let usageAccumulator: TokenUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
  let costAccumulator: CostBreakdown = { inputCost: 0, outputCost: 0, totalCost: 0 };

  const shouldRunRag = config.useRag !== false;

  if (shouldRunRag) {
      // Pass the new brandKnowledge to the filter function
      const filterRes = await filterSectionContext(
          sectionTitle, 
          keyInfoPoints.filter(p => !usedInfoPoints.includes(p)), 
          activeAuthTerms, 
          config.brandKnowledge, // Pass the KB text
          config.targetAudience
      );
      
      activeKeyPoints = filterRes.data.filteredPoints;
      activeAuthTerms = filterRes.data.filteredAuthTerms;
      activeKnowledgeInsights = filterRes.data.knowledgeInsights;
      
      usageAccumulator.inputTokens += filterRes.usage.inputTokens;
      usageAccumulator.outputTokens += filterRes.usage.outputTokens;
      usageAccumulator.totalTokens += filterRes.usage.totalTokens;
      costAccumulator.inputCost += filterRes.cost.inputCost;
      costAccumulator.outputCost += filterRes.cost.outputCost;
      costAccumulator.totalCost += filterRes.cost.totalCost;
  } else {
       activeKeyPoints = keyInfoPoints.filter(p => !usedInfoPoints.includes(p));
  }

  // 2. Build the Prompt
  const languageInstruction = getLanguageInstruction(config.targetAudience);

  let styleInstructions = "";
  
  // Inject Knowledge Insights (High Priority)
  if (activeKnowledgeInsights.length > 0) {
      styleInstructions += `### 🛡️ STRICT BRAND GUIDELINES FOR THIS SECTION\n${activeKnowledgeInsights.map(p => `-[IMPORTANT] ${p}`).join('\n')}\n\n`;
  } else if (config.brandKnowledge && !shouldRunRag) {
      styleInstructions += `### BRAND CONTEXT\nRefer to global brand knowledge provided.\n\n`;
  }

  if (generalPlan && generalPlan.length > 0) {
      styleInstructions += `### GLOBAL WRITING STYLE\n${generalPlan.map(p => `- ${p}`).join('\n')}\n\n`;
  }
  if (config.referenceAnalysis?.conversionPlan?.length) {
      styleInstructions += `### CONVERSION & VALUE PRESENTATION\n${config.referenceAnalysis.conversionPlan.map(p => `- ${p}`).join('\n')}\n\n`;
  }
  if (specificPlan?.length) {
      styleInstructions += `### SPECIFIC NARRATIVE PLAN FOR THIS SECTION ("${sectionTitle}")\n${specificPlan.map(p => `- ${p}`).join('\n')}\n\n`;
  }
  
  // Use the FILTERED Authority Terms
  if (activeAuthTerms.length > 0) {
      styleInstructions += `### AUTHORITY & BRAND ATTRIBUTES (Selected for this section)\nTarget Terms: ${activeAuthTerms.join(', ')}\nExecution Strategy:\n${authorityAnalysis?.combinations.map(c => `- ${c}`).join('\n') || ''}\n`;
  } else if (config.authorityTerms) {
       styleInstructions += `### AUTHORITY TERMS\n${config.authorityTerms}\n`;
  }

  // NEW: INJECT PRODUCT STRATEGY (Level 1 & 2 Logic + Density Check)
  const isLastSections = futureSections.length <= 1; // Are we near the end?
  if (config.productBrief) {
      const injectionInstructions = getSectionInjectionPlan(
          sectionTitle,
          config.referenceAnalysis, // Pass full analysis for competitor targeting
          config.productMapping, // Global Level 1 Mapping
          config.productBrief,
          currentInjectedCount,
          isLastSections
      );
      if (injectionInstructions) {
          styleInstructions += `\n${injectionInstructions}\n`;
      }
  }

  let infoDensityInstruction = "";
  if (activeKeyPoints.length > 0) {
      infoDensityInstruction = `
      ### INFORMATION DENSITY & FACT USAGE
      **RELEVANT FACTS FOR THIS SECTION:**
      ${activeKeyPoints.map(p => `- ${p}`).join('\n')}
      
      **INSTRUCTION:** Weave these specific facts into the narrative naturally. 
      Output used points in metadata: $$USED_POINTS$$: Point A || Point B
      `;
  } else {
      infoDensityInstruction = `(No specific key facts assigned to this section, focus on flow and narrative)`;
  }

  const systemInstruction = `
    You are a professional ghostwriter.
    use more comma, less full stop.
    
    ### WRITING TASK
    Write section: **"${sectionTitle}"**
    
    **PREVIOUS SECTIONS:** ${previousSections.join(', ')}
    **FUTURE SECTIONS:** ${futureSections.join(', ')}
    
    ${languageInstruction}
    ${infoDensityInstruction}
    
    ### 6-POINT CHAIN OF THOUGHT
    1. Entities: Describe physically.
    2. Pronouns: REMOVE them.
    3. Synonyms: Avoid repetition.
    4. Concreteness: Replace adjectives with physical descriptions.
    5. Literalness: No metaphors.
    6. Professionalism: Use industry terminology.

    ${styleInstructions}

    ### FORMATTING & METADATA
    - Output Markdown.
    - Start with H2: ## ${sectionTitle}
    - NO AI Phrases.
    - **POST-PROCESSING CHECK:** At the very end, verify if you mentioned the brand "${config.productBrief?.brandName || 'brand'}".
    - Output this metadata line at the end: $$INJECTED_COUNT$$: [number of times brand/product was mentioned]
  `;

  try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash', 
        contents: `Write the content for section: ${sectionTitle}`,
        config: { systemInstruction },
      });

      let fullText = response.text || "";
      let contentText = fullText;
      let newlyUsedPoints: string[] = [];
      let injectedCount = 0;

      // Extract Metadata: Used Points
      const markerIndex = fullText.indexOf('$$USED_POINTS$$:');
      if (markerIndex !== -1) {
          const metadata = fullText.substring(markerIndex).split('\n')[0].replace('$$USED_POINTS$$:', '').trim();
          newlyUsedPoints = metadata.split('||').map(s => s.trim()).filter(s => s.length > 0);
          
          // Remove from content text
          const lines = fullText.split('\n');
          contentText = lines.filter(l => !l.includes('$$USED_POINTS$$:')).join('\n');
      }

      // Extract Metadata: Injected Count
      const countMatch = fullText.match(/\$\$INJECTED_COUNT\$\$: (\d+)/);
      if (countMatch) {
          injectedCount = parseInt(countMatch[1], 10);
      } else {
          // Fallback manual count if LLM fails to output metadata
          if (config.productBrief?.brandName) {
             const regex = new RegExp(config.productBrief.brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
             const matches = contentText.match(regex);
             injectedCount = matches ? matches.length : 0;
          }
      }
      
      // FIX: Explicitly remove the injected count metadata line from the content
      contentText = contentText.replace(/\$\$INJECTED_COUNT\$\$: \d+/g, '').trim();

      contentText = contentText.replace(/。/g, '。\n\n');
      
      const metrics = calculateCost(response.usageMetadata, 'FLASH');
      
      usageAccumulator.inputTokens += metrics.usage.inputTokens;
      usageAccumulator.outputTokens += metrics.usage.outputTokens;
      usageAccumulator.totalTokens += metrics.usage.totalTokens;
      costAccumulator.inputCost += metrics.cost.inputCost;
      costAccumulator.outputCost += metrics.cost.outputCost;
      costAccumulator.totalCost += metrics.cost.totalCost;

      return {
          data: { content: contentText, usedPoints: newlyUsedPoints, injectedCount },
          usage: usageAccumulator,
          cost: costAccumulator
      };
  } catch (e) {
      console.error("Section generation error", e);
      return { 
          data: { content: "", usedPoints: [], injectedCount: 0 }, 
          usage: {inputTokens:0, outputTokens:0, totalTokens:0}, 
          cost: {inputCost:0, outputCost:0, totalCost:0} 
      };
  }
};

export const generateSnippet = async (prompt: string, targetAudience: TargetAudience): Promise<ServiceResponse<string>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const languageInstruction = getLanguageInstruction(targetAudience);
  
  const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `User Request: "${prompt}". \n\n ${languageInstruction} \n\n Output ONLY the content in Markdown/HTML as requested.`,
      config: { temperature: 0.7 }
  });

  const metrics = calculateCost(response.usageMetadata, 'FLASH');

  return {
      data: response.text || "",
      ...metrics
  };
};
