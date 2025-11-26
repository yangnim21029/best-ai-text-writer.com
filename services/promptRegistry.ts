type PromptBuilder = (payload: any) => string;

const templates: Record<string, PromptBuilder> = {
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
    }) => `
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
    
    RESOURCES TO USE:
    - Keywords to Weave: ${keywordPlans.map((k: any) => k.word).join(", ")}
    - Authority Terms: ${relevantAuthTerms.slice(0, 5).join(", ")}

    **KEY FACTS TO INCLUDE (Pick 1-3 most relevant):**
    ${points.length > 0 ? points.join("; ") : "(No new key points needed for this section, focus on narrative)"}
    
    ${injectionPlan}
    
    OUTPUT RULES:
    - Return ONLY the content for this section in JSON format.
    - Use proper Markdown for the content string (H3 for subsections, Lists where appropriate).
    - Do NOT repeat the H2 Title "${sectionTitle}".
    - Ensure smooth transitions from the previous section.
    `,

    keywordActionPlan: ({ languageInstruction, analysisPayloadString }: { languageInstruction: string, analysisPayloadString: string }) => `
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
    Extract structured information in JSON format:
    `,

    imagePromptFromContext: ({ contextText, languageInstruction, visualStyle, guide }: any) => `
    I have an article paragraph and a GLOBAL VISUAL STYLE. Create a concise image prompt (English) that is photorealistic and culturally relevant.
    
    CONTEXT:
    ${contextText.substring(0, 1500)}

    GLOBAL VISUAL STYLE:
    ${visualStyle || "Clean, modern professional style"}

    ${guide}

    ${languageInstruction}

    TASK:
    1. Describe the subject, setting, and mood precisely.
    2. Avoid text overlays.
    3. End the prompt with the GLOBAL VISUAL STYLE cues.
    4. Return only the prompt text.
    `,

    metaSeo: ({ targetAudience, contextLines, articlePreview }: any) => `
    You are an SEO assistant. Generate meta info for this article.
    - Meta Title: max 60 chars, engaging, includes a primary keyword if present.
    - Meta Description: max 160 chars, persuasive, includes 1-2 key points.
    - URL Slug: kebab-case, lowercase ASCII, short, no special characters.

    Target Audience: ${targetAudience}
    Context:
    ${contextLines.join('\n') || 'No extra context'}

    ARTICLE PREVIEW (trimmed):
    """${articlePreview}"""

    Return JSON: {"title":"...","description":"...","slug":"..."} ONLY.
    `,
};

class PromptRegistry {
    build(key: keyof typeof templates, payload: any) {
        const builder = templates[key];
        if (!builder) throw new Error(`Prompt template not found: ${key}`);
        return builder(payload);
    }
}

export const promptRegistry = new PromptRegistry();
