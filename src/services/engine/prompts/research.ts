export const researchPrompts = {
  productBrief: ({ productName, productUrl, languageInstruction }: any) => `
    I need to create a "Product Brief" for a marketing article.
    
    <ProductName>
    "${productName}"
    </ProductName>
    DEFINITION: The raw name of the product.
    ACTION: Use this to infer branding.

    <ProductURL>
    "${productUrl}"
    </ProductURL>
    DEFINITION: The link to the product.
    ACTION: Use this to infer more context if obvious, and for the CTA.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: User's preferred language.
    ACTION: Write the output in this language.

    TASK:
    1. Infer the Brand Name and USP from the Product Name / URL.
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

    <ProductDetails>
    PRODUCT: ${productBrief.productName} (${productBrief.usp})
    </ProductDetails>
    DEFINITION: The product being marketed.
    ACTION: Find features of this product that match the topic.
    
    <ArticleTopic>
    TOPIC: ${articleTopic}
    </ArticleTopic>
    DEFINITION: The subject of the article.
    ACTION: Identify pain points within this topic.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Target Language.
    ACTION: Output in this language.

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
    
    <TargetURLs>
    ${urls.join('\n')}
    </TargetURLs>
    DEFINITION: The list of pages to digest.
    ACTION: Synthesize information from these pages only.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Target Language.
    ACTION: Write the summary in this language.

    OUTPUT: A concise paragraph (200-300 words) summarizing the brand / service with contact info if present.
    `,

  productContextFromText: ({ rawText }: any) => `
    ## Task
    Extract product / service information from the following text.

    <RawText>
    "${rawText}"
    </RawText>

    ## Instructions
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
    ## Task
    Quickly analyze the Authority Terms for this article and surface only the most credible, relevant ones.
    
    <WebsiteType>
    ${websiteType}
    </WebsiteType>

    <ArticleTitle>
    ${title}
    </ArticleTitle>

    <CandidateTerms>
    ${authorityTerms}
    </CandidateTerms>
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>

    ## Goals
    - BE CONCISE. Output only high-impact terms.
    - Keep only terms that strengthen trust / credibility for this topic and site type.
    - Drop vague, unrelated, or unverifiable claims.
    - Propose strategic combinations of 2-3 terms to reinforce authority.
    
    OUTPUT JSON:
    {
      "relevantTerms": ["best-fit term 1", "best-fit term 2"],
      "combinations": ["term A + term B in intro", "term C in meta description"]
    }
    Return JSON only. Do not include any preamble or reasoning in the response text.`,

  websiteTypeExtraction: ({ content }: any) => `
    Analyze the provided content and extract the website type and authority terms.
    
    CRITICAL: You must return ONLY a JSON object. No conversational text, no introductions, no "Here is the JSON".
    
    JSON STRUCTURE:
    {
      "websiteType": "The broad category of the site (e.g. 'Medical Clinic', 'Ecommerce', 'Tech Blog', 'Review Site')",
      "authorityTerms": "Up to 5 comma-separated terms that establish clinical or brand authority (e.g. medical degrees, awards, proprietary ingredients, certifications)"
    }

    CONTENT TO ANALYZE:
    ${content.substring(0, 6000)}
    `,

  voiceStrategy: ({ content, targetAudience, languageInstruction }: any) => `
    Analyze the reference text to extract the Voice and Brand Strategy.

    1) Voice & Tone (General Plan).
    2) Conversion Strategy (Offers, CTAs, Risk Reversals).
    3) Brand Exclusive Points (USP).
    4) Competitor Names / Products to suppress. (CRITICAL: Do NOT list the region name "${targetAudience}" itself as a competitor).
    5) Authority / Trust Signals to Emphasize.

    OUTPUT JSON:
    {
      "voiceProfile": "...",
      "conversionStrategy": "...",
      "brandUSP": "...",
      "negativeConstraints": ["...", "..."],
      "authorityFocus": "..."
    }
  `,

  keywordAnalysis: ({ 
    content,
    targetAudience,
    languageInstruction,
  }: { 
    content: string;
    targetAudience: string;
    languageInstruction: string;
  }) => `
    Analyze the reference content to extract high - frequency keywords and their semantic roles.
    
    <TargetAudience>
    ${targetAudience}
</TargetAudience>
DEFINITION: The target region.
  ACTION: Factor this into keyword selection.

    <LanguageInstruction>
    ${languageInstruction}
</LanguageInstruction>
DEFINITION: Output language.

    <Content>
    ${content}
</Content>
DEFINITION: Source text.
  ACTION: Extract keywords from here.
    
    OUTPUT JSON:
[
  { "word": "keyword", "contextSnippet": "snippet from text", "frequency": 3 }
]
  `,

  filterSectionContext: ({
    kbContext,
    sourceContext,
    allKeyPoints,
    allAuthTerms,
    sectionTitle,
    languageInstruction,
  }: any) => `
    BRAND KNOWLEDGE BASE:
    ${kbContext}

    SOURCE MATERIAL:
    ${sourceContext}
    
    DATABASE:
    Key Points: ${JSON.stringify(allKeyPoints)}
    Authority Terms: ${JSON.stringify(allAuthTerms)}
    
    ---
    
    I am writing a specific section titled: "${sectionTitle}".
    
    TASK:
    1. **Filter Data**: Select ONLY the Key Points and Authority Terms strictly relevant to "${sectionTitle}".
    2. **Agentic Retrieval**: 
       - Read the "BRAND KNOWLEDGE BASE" and "SOURCE MATERIAL" provided above.
       - Extract 3-5 specific constraints, facts, or technical details that MUST be applied to this specific section "${sectionTitle}".
       - Focus on concrete details (percentages, specs, quotes, unique facts) found in the Source Material.
       - If nothing is relevant, return empty list.
    
    ${languageInstruction}
    `,
};
