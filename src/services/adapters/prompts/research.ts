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

  distributeContext: ({
    sourceContent,
    sectionTitles,
    languageInstruction,
  }: any) => `
    I have a large "Source Document" and a list of "Section Titles" for an article I am writing.
    
    <SourceDocument>
    ${sourceContent}
    </SourceDocument>
    
    <SectionTitles>
    ${JSON.stringify(sectionTitles)}
    </SectionTitles>
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>

    TASK:
    For EACH Section Title, extract the *specific* text chunks from the Source Document that are relevant to writing that section.
    
    RULES:
    1. **Be Specific**: Do not just copy the whole text. Extract only paragraphs/sentences that support that specific section.
    2. **No Duplicates**: If a chunk is relevant to multiple sections, you can include it in both.
    3. **Empty is OK**: If no source text is relevant for a section (e.g. "Introduction" might be generic), return an empty string/null.
    4. **Context Window**: Keep snippets concise (max 500 words per section).
    
    OUTPUT JSON:
    {
      "mapping": [
        { "title": "Section Title 1", "relevantContext": "extracted text..." },
        { "title": "Section Title 2", "relevantContext": "extracted text..." }
      ]
    }
  `,

  voiceAndToneBlueprint: ({
    content,
    targetAudience,
    languageInstruction,
    analysisPayloadString,
  }: any) => `
    You are an expert Linguistic Analyst and Brand Strategist.
    Your task is to extract a comprehensive "Voice & Tone Blueprint" from the provided content, including both High-Level Strategy and Micro-Level Sentence Patterns.

    <Content>
    ${content}
    </Content>

    <KeywordContext>
    ${analysisPayloadString}
    </KeywordContext>
    DEFINITION: Key frequent terms found in the text with their surrounding context snippets.

    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Output language for the analysis.

    ---

    ## PART 1: MACRO VOICE STRATEGY (The "Vibe")
    Analyze the overall persona and strategy:
    1. **Tone Sensation**: The 3-5 words that describe the "Vibe" (e.g. "Authoritative but empathetic", "Witty and fast-paced").
    2. **Human Writing Voice**: Why does this sound human? (e.g. "Uses direct 'You' address", "Admits flaws", "Rhythmic variance").
    3. **Region Detection**: What is the regional flavor? (e.g. "HK Cantonese mixed with English", "Standard TW Mandarin").
    4. **General Plan (Semantic Blueprint)**: The 3 golden writing rules. (Analyze as if an Editor-in-Chief giving clear, concise instructions to a Junior Editor).
    5. **Entry Point**: The strategic angle used to hook the reader. (Analyze as if an Editor-in-Chief explaining the "Hook Strategy").
    6. **Conversion Plan**: How does the text sell/persuade?

    ## PART 2: MICRO SENTENCE PATTERNS (The "Mechanics")
    Using the <KeywordContext> and the text, identify specific linguistic habits:
    1. **Sentence Flow (Connection)**: How do they connect ideas *within* the paragraph? (Analyze the bridges between sentences, not just openers. e.g. "Use 'However' to pivot", "Short rhythmic bursts", "Connective grouping").
    2. **Sentence End Features**: How do they end? (e.g. "Rhetorical questions", "Exclamation marks", "Soft particles like 吧/呢").
    3. **Keyword Plans**: For the top 20 keywords provided in <KeywordContext> (if available), provide a specific "Usage Plan" (e.g. "Use at start of sentence for impact").

    ---

    OUTPUT JSON:
    {
      "toneSensation": "string",
      "humanWritingVoice": "string",
      "regionVoiceDetect": "string",
      "generalPlan": ["rule 1", "rule 2", "rule 3"],
      "entryPoint": "string",
      "conversionPlan": ["tactic 1", "tactic 2"],
      "sentenceStartFeatures": ["feature 1", "feature 2"],
      "sentenceEndFeatures": ["feature 1", "feature 2"],
      "keywordPlans": [
        {
          "word": "keyword",
          "plan": ["usage rule 1", "usage rule 2"],
          "exampleSentence": "short example"
        }
      ]
    }
  `,

  simulateSourceMaterial: ({
    sectionTitle,
    subheadings,
    languageInstruction,
  }: any) => `
    You are a Knowledge Retrieval Simulator.
    The user wants to write a section titled: "${sectionTitle}".
    Subheadings: ${subheadings?.join(', ') || 'None'}.

    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>

    TASK:
    Simulate "Real-world Search Results" for this specific topic.
    Extract the following from your internal knowledge base as if they were found on top-ranking websites:
    1. **Unique Viewpoints**: What are the specific arguments experts make?
    2. **Supporting Facts**: Data, stats, or logical proofs used to support those viewpoints.
    3. **Key Sentences**: 2-3 specific, high-quality sentences that might appear in such articles (for the writer to mimic or quote).

    OUTPUT JSON:
    {
      "viewpoints": ["viewpoint 1", "viewpoint 2"],
      "facts": ["fact 1", "fact 2"],
      "quotes": ["sentence 1", "sentence 2"]
    }
  `,
};
