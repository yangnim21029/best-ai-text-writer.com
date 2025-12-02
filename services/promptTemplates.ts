import { TargetAudience } from '../types';

export type PromptBuilderPayload = Record<string, any>;
export type PromptBuilder<T extends PromptBuilderPayload = PromptBuilderPayload> = (payload: T) => string;

export const promptTemplates = {
  sectionContent: ({
    sectionTitle,
    languageInstruction,
    previousSections,
    futureSections,
    generalPlan,
    specificPlan,
    kbInsights,
    keywordPlans,
    relevantAuthTerms,
    points,
    injectionPlan,
    articleTitle,
    coreQuestion,
    difficulty,
    writingMode,
    solutionAngles,
    avoidContent,
  }: {
    sectionTitle: string;
    languageInstruction: string;
    previousSections: string[];
    futureSections: string[];
    generalPlan?: string[];
    specificPlan?: string[];
    kbInsights: string[];
    keywordPlans: { word: string }[];
    relevantAuthTerms: string[];
    points: string[];
    injectionPlan: string;
    articleTitle: string;
    coreQuestion?: string;
    difficulty?: 'easy' | 'medium' | 'unclear';
    writingMode?: 'direct' | 'multi_solutions';
    solutionAngles?: string[];
    avoidContent?: string[];
  }) => {
    const resolvedDifficulty = difficulty || 'easy';
    const mode = writingMode || (resolvedDifficulty === 'easy' ? 'direct' : 'multi_solutions');
    return `
    You are an expert editor writing the section: "${sectionTitle}".
    
    ${languageInstruction}
    
    CONTEXT:
    - Article Topic: "${articleTitle}"
    - Previous Sections (Summary): ${previousSections.slice(-2).map((s: string) => s.substring(0, 100) + "...").join(" | ")}
    - Upcoming Sections: ${futureSections.join(", ")}
    
    STRATEGY & STYLE:
    - Overall Voice: ${generalPlan?.join("; ") || "Professional, authoritative"}
    - Section Strategy: ${specificPlan?.join("; ") || "Explain thoroughly"}
    - Brand Knowledge Rules: ${kbInsights.length > 0 ? kbInsights.join("; ") : "None"}

    QUESTION & CLARITY:
    - Core Question: ${coreQuestion || "Infer the precise question and answer it"}
    - Difficulty: ${resolvedDifficulty}
    - Writing Mode: ${mode === 'direct' ? "direct answer first" : "multi solutions then synthesize"}
    - If difficulty is unclear or medium, surface ambiguity, then propose multiple angles.
    ${mode === 'multi_solutions'
        ? `- Provide 2-3 distinct, non-overlapping solution paths before the final synthesized answer.`
        : `- Lead with a concise, direct answer to the core question.`}

    SOLUTION ANGLES (use if multi_solutions):
    ${mode === 'multi_solutions'
        ? (solutionAngles && solutionAngles.length > 0 ? solutionAngles.join("; ") : "None provided; create 2 distinct angles.")
        : "Not needed for direct mode."
      }
    
    RESOURCES TO USE:
    - Keywords to Weave: ${keywordPlans.map((k: any) => k.word).join(", ")}
    - Authority Terms: ${relevantAuthTerms.slice(0, 5).join(", ")}

    **KEY FACTS TO INCLUDE (Pick 1-3 most relevant):**
    ${points.length > 0 ? points.join("; ") : "(No new key points needed for this section, focus on narrative)"}
    
    ${injectionPlan}

    ${avoidContent && avoidContent.length > 0 ? `
    ⛔ NEGATIVE CONSTRAINTS (DO NOT WRITE ABOUT):
    To avoid repetition, you must NOT mention the following topics (they are covered in other sections):
    ${avoidContent.map(c => `- ${c}`).join('\n')}
    ` : ''}
    
    OUTPUT RULES:
    - Return ONLY the content for this section in JSON format.
    - Use proper Markdown for the content string (H3 for subsections, Lists where appropriate).
    - Do NOT repeat the H2 Title "${sectionTitle}".
    - Ensure smooth transitions from the previous section.
    - If writing mode is "multi_solutions", list the solution paths clearly, then close with a synthesized recommendation.
    `;
  },

  keywordActionPlan: ({
    languageInstruction,
    analysisPayloadString,
  }: {
    languageInstruction: string;
    analysisPayloadString: string;
  }) => `
    I have a list of High-Frequency Keywords and their "Context Snippets" from a Reference Text.
    
    TASK:
    For each keyword, analyze its context snippets to understand the specific **Sentence Structure** and **Syntactic placement** used by the author.
    Generate a "Usage Action Plan" (Max 3 points) for a ghostwriter.
    
    ${languageInstruction}

    The Action Plan must be specific about the **Sentence Context** (NOT the paragraph type):
    1. **Syntactic Placement**: Analyze where in the *sentence* this word appears. Does it usually start the sentence? Is it used in a dependent clause? Is it part of a list? Is it used as a transition?
    2. **Collocations**: What specific words, prepositions, or adjectives immediately precede or follow it in the snippets?
    3. **Tone/Function**: Is it used to qualify a previous statement, introduce a technical detail, or provide a concrete example?

    INPUT DATA:
    ${analysisPayloadString}

    OUTPUT JSON (array):
    [
      {
        "word": "keyword",
        "plan": ["sentence-level guidance 1", "guidance 2", "guidance 3"]
      }
    ]
    Return JSON only, no prose, no markdown fences.
    `,

  productBrief: ({ productName, productUrl, languageInstruction }: any) => `
    I need to create a "Product Brief" for a marketing article.
    
    PRODUCT NAME: "${productName}"
    URL: "${productUrl}"
    
    ${languageInstruction}
    
    TASK:
    1. Infer the Brand Name and USP from the Product Name/URL.
    2. Write a short "Product Description" (2 sentences).
    3. Identify the "Primary Pain Point" this product solves.
    4. Create a "Call to Action (CTA)" link text.
    
    OUTPUT FORMAT (JSON):
    {
        "brandName": "Brand Name",
        "productName": "Full Product Name",
        "productDescription": "...",
        "usp": "...",
        "primaryPainPoint": "...",
        "ctaLink": "${productUrl}" 
    }
    `,

  productMapping: ({ productBrief, articleTopic, languageInstruction }: any) => `
    I have a Product and an Article Topic.
    
    PRODUCT: ${productBrief.productName} (${productBrief.usp})
    TOPIC: ${articleTopic}
    
    ${languageInstruction}
    
    TASK:
    Identify 3-5 "Problem-Solution Mappings".
    For each mapping:
    1. **Pain Point**: A specific problem the reader has related to the Topic.
    2. **Product Feature**: The specific feature of the product that solves it.
    3. **Relevance Keywords**: List of keywords (from the topic) where this mapping is most relevant.
    
    OUTPUT JSON:
    [
        { "painPoint": "...", "productFeature": "...", "relevanceKeywords": ["...", "..."] }
    ]
    `,

  brandSummary: ({ urls, languageInstruction }: any) => `
    You are a web crawler and marketing copywriter.
    Crawl and summarize the following URLs to extract the brand's own service/product details, contact info, and unique selling points.
    URLs:
    ${urls.join('\n')}
    
    ${languageInstruction}
    
    OUTPUT: A concise paragraph (200-300 words) summarizing the brand/service with contact info if present.
    `,

  visualStyle: ({ languageInstruction, analyzedSamples, websiteType }: any) => `
    I need to define a consistent "Visual Identity" (Master Style Prompt) for an article.
    
    WEBSITE CONTEXT: "${websiteType}"
    
    SOURCE IMAGE DESCRIPTIONS (from the brand's website):
    ${analyzedSamples && analyzedSamples.length > 0 ? analyzedSamples : "No source images available. Infer style strictly from Website Context."}

    TASK:
    Synthesize a **single, cohesive Visual Style Description** that I can append to every image prompt to ensure consistency.
    
    Include:
    1. **Color Palette:** (e.g., "Medical Blue #0055FF and Clean White", or "Warm Earth Tones")
    2. **Lighting/Mood:** (e.g., "Soft bright studio lighting", "Moody natural light", "Flat vector lighting")
    3. **Art Medium:** (e.g., "High-resolution Photography", "Minimalist 2D Vector Art", "3D Product Render")
    
    OUTPUT FORMAT:
    Return ONLY the style description string (max 30 words).
    Example: "Photorealistic style with soft daylight, using a clinical white and teal palette, high-end commercial aesthetic."
    
    ${languageInstruction}
    `,

  snippet: ({ prompt, languageInstruction }: any) => `
    ${languageInstruction}
    ${prompt}
    `,
  sectionHeading: ({
    sectionTitle,
    articleTitle,
    languageInstruction,
    keyPoints,
    keywordPlans,
    narrativeNotes,
  }: {
    sectionTitle: string;
    articleTitle: string;
    languageInstruction: string;
    keyPoints: string[];
    keywordPlans: { word: string }[];
    narrativeNotes?: string[];
  }) => `
    You are creating a concise H3 heading for an article section.
    
    ARTICLE: "${articleTitle}"
    SECTION TITLE/CONTEXT: "${sectionTitle}"
    
    ${languageInstruction}
    
    HINTS:
    - Key Points (top 3-5): ${keyPoints.join('; ')}
    - Important Keywords: ${keywordPlans.map(k => k.word).join(', ')}
    - Narrative Notes: ${narrativeNotes?.join('; ') || 'None'}
    
    RULES:
    - Return ONLY the heading text (no quotes, no numbering).
    - Keep it under 10 words.
    `,

  batchRefineHeadings: ({
    articleTitle,
    headings,
    languageInstruction,
  }: {
    articleTitle: string;
    headings: string[];
    languageInstruction: string;
  }) => `
    You are cleaning and unifying article section headings.

    ARTICLE TITLE: "${articleTitle}"

    ORIGINAL HEADINGS (ordered H2s; no hierarchy provided, treat each as H2):
    ${headings.map((h, i) => `${i + 1}. ${h}`).join('\n')}

    ${languageInstruction}

    STEP BY STEP:
    1) Clarify role: H2 = main section headline; H3 = supporting subpoint under its H2.
    2) Keep it natural in Chinese: do NOT stuff English intent words (how to, vs, guide, tips). Preserve the original intent/angle.
    3) Make it clickable: concise (≤ 60 chars), keyword-aligned, but no empty promises.
    4) Rewrite H2 with **5 options in this exact order** (all must differ from h2_before):
       - Option 1: Shorter/tighter version.
       - Option 2: Longer/richer version.
       - Option 3: Wording swap (same length, better phrasing).
       - Option 4: Lifestyle/conversational tone.
       - Option 5: Pain-point/FOMO-heavy angle.
       - Use power words, be slightly aggressive/manipulative (marketing sense), create FOMO/secret knowledge vibes, and sound like a mastermind (not a generic AI).
       - H2_after = your single best pick among those 5 options.
    5) Rewrite/support H3 (if any exist or if you invent them):
       - Align with the chosen H2_after, avoid repeating its wording.
       - Apply the same power/FOMO/mastermind tone to H3 text.
    6) Validate: no duplicates, no vague fillers. Reject identical before/after.

    OUTPUT (JSON only):
    {
      "headings": [
        {
          "h2_before": "...",
          "h2_after": "...",
          "h2_reason": "why this angle/keywords",
          "h2_options": [
            { "text": "option 1", "reason": "reasoning" },
            { "text": "option 2", "reason": "reasoning" },
            { "text": "option 3", "reason": "reasoning" }
          ],
          "h3": [
            { "h3_before": "...", "h3_after": "...", "h3_reason": "supporting angle & search phrasing" }
          ]
        }
      ]
    }
    - Array length MUST equal the number of ORIGINAL HEADINGS and keep the same order.
    - Always include every field; set "h3": [] when none.
    - "h2_before" must exactly match the provided heading text.
    - If no H3s were provided, return "h3": [].
    - If a heading is already good, repeat it in "h2_after".
    `,

  metaSeo: ({ targetAudience, contextLines, articlePreview }: { targetAudience: string; contextLines: string[]; articlePreview: string; }) => `
    You are an SEO expert. Generate meta Title, Description, and URL slug for the article.

    Target audience: ${targetAudience}
    Context:
    ${contextLines.join('\n')}

    Article preview (truncated):
    ${articlePreview}

    Output JSON:
    { "title": "...", "description": "...", "slug": "..." }
    `,

  rebrandContent: ({ productBrief, languageInstruction, currentContent }: any) => `
    TASK: REBRAND this article content.
    
    BRAND IDENTITY:
    - Name: "${productBrief.brandName}"
    - Product: "${productBrief.productName}"
    - USP: "${productBrief.usp}"
    
    INSTRUCTIONS:
    1. Scan the text for generic terms like "the device", "the treatment", "many clinics", or any Competitor Names.
    2. REWRITE those sentences to specifically feature **${productBrief.brandName}** or **${productBrief.productName}**.
    3. Ensure the grammar flows naturally (Subject-Verb agreement).
    4. Do NOT just find-replace. Rewrite the sentence to sound authoritative.
    5. Maintain the original structure and formatting (Markdown).
    
    ${languageInstruction}

    CONTENT TO REBRAND:
    ${currentContent}
    `,

  smartFindBlock: ({ pointToInject, blocks }: any) => `
    I need to insert this Key Point: "${pointToInject}"
    
    Here is a "Compact Index" of the article paragraphs:
    ${blocks.map((b: any) => `[ID: ${b.id}] ${b.text}`).join('\n')}
    
    TASK: Identify the SINGLE Best Block ID to insert/merge this point into. 
    Return ONLY the ID (e.g. "5").
    `,

  smartRewriteBlock: ({ pointToInject, targetHtml, languageInstruction }: any) => `
    TASK: Rewrite the following HTML Block to naturally include this Key Point.
    
    KEY POINT: "${pointToInject}"
    
    TARGET HTML BLOCK:
    ${targetHtml}
    
    RULES:
    1. Keep the original meaning and HTML tag structure (<p> or <li>).
    2. Weave the point in naturally. Do not just append it at the end unless it fits.
    3. ${languageInstruction}
    4. Return ONLY the new HTML string.
    `,

  productContextFromText: ({ rawText }: any) => `
    Extract product/service information from the following text:
    
    "${rawText}"
    
    TASK:
    - Identify Brand Name, Product Name, Unique Selling Point (USP), Target Audience, and Key Features.
    - Focus on concise extraction, not rewriting.
    
    OUTPUT JSON:
    {
        "brandName": "...",
        "productName": "...",
        "usp": "...",
        "targetAudience": "...",
        "features": ["...", "..."]
    }
    `,

  authorityAnalysis: ({ languageInstruction, authorityTerms, websiteType, title }: any) => `
    Analyze the Authority Terms for this article and surface only the most credible, relevant ones.
    
    WEBSITE TYPE: ${websiteType}
    ARTICLE TITLE: ${title}
    TERMS: ${authorityTerms}
    
    GOALS:
    - Keep only terms that strengthen trust/credibility for this topic and site type.
    - Drop vague, unrelated, or unverifiable claims.
    - Propose strategic combinations of 2-3 terms to reinforce authority.
    
    OUTPUT JSON:
    {
      "relevantTerms": ["best-fit term 1", "best-fit term 2"],
      "combinations": ["term A + term B in intro", "term C in meta description"]
    }
    
    ${languageInstruction}
    Return JSON only.`,

  referenceStructure: ({ content, targetAudience, languageInstruction }: any) => `
    Analyze the reference text to extract:
    1) A Narrative Structure with reasoning.
    2) Conversion & value strategy (offers, CTAs, risk reversals).
    3) Key information points to preserve.
    4) Brand-exclusive points that must NOT apply to competitors.
    5) Competitor brand & product names to suppress/avoid.
    
    TARGET AUDIENCE: ${targetAudience}
    ${languageInstruction}
    
    CONTENT:
    ${content}
    
    OUTPUT JSON:
    {
      "structure": [
        {
          "title": "Section Title",
          "narrativePlan": ["Bullet 1", "Bullet 2"],
          "coreQuestion": "Main question/problem",
          "difficulty": "easy | medium | unclear",
          "writingMode": "direct | multi_solutions",
          "solutionAngles": ["Angle A", "Angle B"]
        }
      ],
      "generalPlan": ["Overall voice guidelines"],
      "conversionPlan": ["Value prop", "CTA", "Offer"],
      "keyInformationPoints": ["Point 1", "Point 2"],
      "brandExclusivePoints": ["Facts unique to brand"],
      "competitorBrands": ["Competitor Brand 1", "Competitor Brand 2"],
      "competitorProducts": ["Competitor Product 1", "Competitor Product 2"]
    }
    Return JSON only, no extra text or markdown fences.`,

  keywordAnalysis: ({ content, targetAudience, languageInstruction }: { content: string; targetAudience: TargetAudience; languageInstruction: string }) => `
    Analyze the reference content to extract high-frequency keywords and their semantic roles.
    
    TARGET AUDIENCE: ${targetAudience}
    ${languageInstruction}
    
    CONTENT:
    ${content}
    
    OUTPUT JSON:
    [
      { "word": "keyword", "contextSnippet": "snippet from text", "frequency": 3 }
    ]
    `,

  imagePromptFromContext: ({ contextText, languageInstruction, visualStyle, guide }: { contextText: string; languageInstruction: string; visualStyle: string; guide: string }) => `
    Generate a detailed image generation prompt based on the following context.
    
    ${languageInstruction}
    
    CONTEXT TEXT:
    ${contextText}
    
    VISUAL STYLE GUIDE:
    ${visualStyle}
    
    ${guide}
    
    TASK:
    Create a detailed, specific image generation prompt that:
    1. Captures the essence of the context text
    2. Adheres to the visual style guide
    3. Is optimized for AI image generation
    4. Avoids abstract concepts and focuses on concrete, photographable subjects
    
    Return ONLY the image prompt (no explanations or metadata).
    `,
};

export type PromptTemplateKey = keyof typeof promptTemplates;
