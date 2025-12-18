import { TargetAudience } from '../../types';

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
    renderMode,
    suppressHints,
    augmentHints,
    subheadings,
    regionReplacements,
    humanWritingVoice,
    regionVoiceDetect,
    replacementRules,
    logicalFlow,
    coreFocus,
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
    renderMode?: 'checklist' | 'normal';
    suppressHints?: string[];
    augmentHints?: string[];
    subheadings?: string[];
    regionReplacements?: { original: string; replacement: string }[];
    humanWritingVoice?: string;
    regionVoiceDetect?: string;
    replacementRules?: string[];
    logicalFlow?: string;
    coreFocus?: string;
  }) => {
    const resolvedDifficulty = difficulty || 'easy';
    const mode = writingMode || (resolvedDifficulty === 'easy' ? 'direct' : 'multi_solutions');
    return `You are an expert editor writing the section:
    <SectionTitle>
      ${sectionTitle}
    </SectionTitle>
    DEFINITION: The title of the specific section you need to write.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: The target language and audience for the article.
    
    ## Context Structure
    <ArticleTopic>
    ${articleTitle}
    </ArticleTopic>
    DEFINITION: The main topic of the entire article.

    <PreviousSections>
    ${previousSections.slice(-2).map((s: string) => s.substring(0, 100) + "...").join(" | ")}
    </PreviousSections>
    DEFINITION: Summaries of the immediately preceding sections.

    <UpcomingSections>
    ${futureSections.join(", ")}
    </UpcomingSections>
    DEFINITION: Titles of sections to be written later.


    ## Strategy & Style
    <OverallVoice>
    ${generalPlan?.join("; ") || "Professional, authoritative"}
    </OverallVoice>
    DEFINITION: The desired tone and persona for the article.

    <SectionStrategy>
    ${specificPlan?.join("; ") || "Explain thoroughly"}
    ${logicalFlow ? `\n    LOGICAL FLOW: ${logicalFlow}` : ""}
    ${coreFocus ? `\n    CORE EMPHASIS: ${coreFocus}` : ""}
    </SectionStrategy>
    DEFINITION: Specific goals or angles for this section.

    <BrandKnowledge>
    ${kbInsights.length > 0 ? kbInsights.join("; ") : "None"}
    </BrandKnowledge>
    DEFINITION: Background facts or guidelines about the brand.

    ${humanWritingVoice ? `
    <HumanWritingVoice>
    ${humanWritingVoice}
    </HumanWritingVoice>
    DEFINITION: Instructions on how to sound human and not like an AI.
    ` : ''}

    ${regionVoiceDetect ? `
    <RegionVoiceProfile>
    ${regionVoiceDetect}
    </RegionVoiceProfile>
    DEFINITION: The detected regional voice composition (e.g., 70% HK / 30% TW).
    INSTRUCTION: Adhere to the dominant regional tone.
    ` : ''}


    ## Localization & Safety
    ${(replacementRules && replacementRules.length > 0) || (regionReplacements && regionReplacements.length > 0) ? `
    <LocalizationAndSafety>
    ${replacementRules && replacementRules.length > 0 ? `
    **Blocked Terms (DO NOT USE):**
    ${replacementRules.map(r => `- ❌ ${r}`).join('\n')}
    ` : ''}
    ${regionReplacements && regionReplacements.length > 0 ? `
    **Regional Replacements (MANDATORY):**
    ${regionReplacements.map(r => r.replacement
      ? `- "${r.original}" → "${r.replacement}"`
      : `- "${r.original}" → [REMOVE from text]`
    ).join('\n')}
    ` : ''}
    </LocalizationAndSafety>
    DEFINITION: Terms to avoid and mandatory vocabulary corrections for the target region.
    INSTRUCTION:
    1. NEVER use any Blocked Terms.
    2. ALWAYS replace "original" terms with their "replacement".
    3. If replacement is [REMOVE], rewrite the sentence to exclude that term entirely.
    ` : '(No localization constraints)'}


    ## Task Definition
    <CoreQuestion>
    ${coreQuestion || "Infer the precise question and answer it"}
    </CoreQuestion>
    DEFINITION: The comprehensive question this section must answer.

    <Difficulty>
    ${resolvedDifficulty}
    </Difficulty>
    DEFINITION: The complexity level of the topic (easy, medium, unclear).

    <WritingMode>
    ${mode === 'direct' ? "direct answer first" : "multi solutions then synthesize"}
    </WritingMode>
    DEFINITION: The structural approach (Direct vs Multi-angle).
    
    ${mode === 'multi_solutions'
        ? `- Provide 2-3 distinct, non-overlapping solution paths before the final synthesized answer.`
        : `- Lead with a concise, direct answer to the core question.`
      }


    ## Strategic Execution (CRITICAL)
    - **Logical Flow**: Respect the "LOGICAL FLOW" provided. Use it as the bridge to connect the facts naturally so the narrative feels cohesive and the transition between points is clear.
    - **Core Emphasis**: Adhere to the "CORE EMPHASIS" (tone/hook). Use it to shape your phrasing (e.g., if it's "Urgent", use shorter, sharper sentences; if it's "Soothing", use flowy, empathetic language).


    ## Conciseness Constraints
    - **General Rule**: Cut all fluff. Be crisp and direct. Stop immediately after answering the core question.
    ${/introduction|conclusion|intro|outcome|result|summary|引言|結尾|結論/i.test(sectionTitle)
        ? '- **SPECIAL CONSTRAINT**: Target 40~80 words. Write as a concise narrative. If using subheadings or lists, you MUST still use double newlines between them.'
        : ''} 
    - **If difficulty = "easy"**: Target < 160 words. Get straight to the point. No preamble.
    - **If difficulty = "medium"**: Target 200~350 words. Explain efficiently using Lists if needed, but ensure narrative depth.
    - **If difficulty = "unclear"**: Focus on clarifying the ambiguity briefly with Lists.


    ## Output Restrictions
    - **Narrative Plan Execution**: You will see points marked as "[Primary]" or "[Secondary]".
      - **[Primary]**: Expand extensively on these. This is the core of the section.
      - **[Secondary]**: Mention these concisely as supporting details.
    ${renderMode === 'checklist'
        ? '- OUTPUT FORMAT: Use checklist/bulleted list. Include every provided Key Fact; do not drop items. Ensure each item is on a new line with a hyphen.'
        : '- OUTPUT FORMAT: Narrative Markdown. Use **double newlines** (`\\n\\n`) between paragraphs and before any H3 header.'
      }


    ## Structure Enforcement
    ${subheadings && subheadings.length > 0 ? `
    <MandatorySubheadings>
    ${subheadings.map((h, i) => `${i + 1}. ${h}`).join('\n')}
    </MandatorySubheadings>
    DEFINITION: The exact H3 subheadings you must use.
    ` : '(No predefined subheadings)'
      }


    ## Solution Angles
    ${mode === 'multi_solutions'
        ? (solutionAngles && solutionAngles.length > 0 ? `
        <DefinedAngles>
        ${solutionAngles.join("; ")}
        </DefinedAngles>
        DEFINITION: The specific angles/perspectives to cover.
        ` : "None provided; create 2 distinct angles.")
        : "Not needed for direct mode."
      }


    ## Resources & Keywords
    <SemanticKeywords>
    ${keywordPlans.map((k: any) => `
    - "${k.word}": ${k.plan?.join('; ') || 'Use naturally.'}`).join('')}
    </SemanticKeywords>
    DEFINITION: SEO keywords with semantic usage rules.
    INSTRUCTION: Use these words according to their "Semantic Context" rules to maintain the original depth.

    <AuthorityTerms>
    ${relevantAuthTerms.slice(0, 5).join(", ")}
    </AuthorityTerms>
    DEFINITION: Technical or authoritative terms.


    ## Key Facts & Narrative Points
    - **WRITING RULE**: Use clean, direct sentence structures. Ensure structural clarity.
    <KeyPoints>
    ${points.length > 0 ? points.join("; ") : "(No new key points needed for this section, focus on narrative)"}
    </KeyPoints>
    DEFINITION: The core facts and information for this section.


    ## Injection Plan
    ${injectionPlan}


    ## Exclusion Rules
    ${suppressHints && suppressHints.length > 0 ? `
    <StrictExclusion>
    ${suppressHints.map(c => `- ${c}`).join('\n')}
    </StrictExclusion>
    DEFINITION: Topics that are strictly forbidden here.
    ` : '(None)'
      }

    ${avoidContent && avoidContent.length > 0 ? `
    <NegativeConstraints>
    ${avoidContent.map(c => `- ${c}`).join('\n')}
    </NegativeConstraints>
    DEFINITION: Content to avoid to prevent repetition/redundancy.
    ` : ''
      }


    ## Output Schema
    - Return ONLY the content for this section in JSON format.
    - Use proper Markdown for the content string (H3 for subsections, Lists where appropriate).
    - Do NOT repeat the H2 Title "${sectionTitle}".
    - Ensure smooth transitions from the previous section.
    - If writing mode is "multi_solutions", list the solution paths clearly, then close with a synthesized recommendation.
    - **IMPORTANT**: Use exactly **two newlines** ("\\n\\n") between paragraphs. 
    - **IMPORTANT**: Place exactly **two newlines** BEFORE any H3 header (e.g., "\\n\\n### Heading").
    - **IMPORTANT**: You must populate the "usedPoints" array with the exact strings of any Key Facts you included in the content.
    - **IMPORTANT**: You must populate "injectedCount" with the number of times you explicitly mentioned the Product Name or Brand Name.
`;
  },

  frequentWordsPlacementAnalysis: ({
    languageInstruction,
    analysisPayloadString,
  }: {
    languageInstruction: string;
    analysisPayloadString: string;
  }) => `
    I have a list of High-Frequency Keywords and their "Context Snippets" from a Reference Text.

    TASK:
    For each keyword, analyze its context snippets to understand the specific **Sentence Structure** and **Syntactic placement**.
    Generate a "Usage Action Plan" (Max 3 actionable points).
    Extract a **SINGLE, SHORT** "Example Sentence" (Max 40 chars / 15 words).

    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>

    The Action Plan must be specific about the **Sentence Context**:
    1. **Placement**: Where does it appear? (Start/Middle/End/Transition)
    2. **Collocations**: What words appear around it?
    3. **Tone**: What function does it serve? (e.g., Is it a prefix/suffix?)

    STRICT RULES:
    - You MUST provide a "plan" with exactly 3 points and one "exampleSentence" for EVERY keyword.
    - If a keyword's context is unclear, use your knowledge of the language/style to provide a generic but accurate action plan.
    - NEVER return an empty array or null for "plan" or "exampleSentence".

    INPUT DATA:
    <AnalysisPayload>
    ${analysisPayloadString}
    </AnalysisPayload>
    DEFINITION: JSON list of keywords and snippets.
    ACTION: Analyze these specific snippets.

    OUTPUT JSON (array):
    [
      {
        "word": "keyword",
        "plan": ["actionable guidance 1", "actionable guidance 2", "actionable guidance 3"],
        "exampleSentence": "ONE short sentence (< 15 words) from the text. NO explanations.",
        "isSentenceStart": true/false,
        "isSentenceEnd": true/false,
        "isPrefix": true/false,
        "isSuffix": true/false
      }
    ]
    Return JSON only.
    `,

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

  visualStyle: ({ languageInstruction, analyzedSamples, websiteType }: any) => `
    I need to define a consistent "Visual Identity" (Master Style Prompt) for an article.
    
    <WebsiteContext>
    ${websiteType}
    </WebsiteContext>
    DEFINITION: The type of business this is.
    ACTION: Ensure style matches this industry.
    
    <SourceImageDescriptions>
    ${analyzedSamples && analyzedSamples.length > 0 ? analyzedSamples : "No source images available. Infer style strictly from Website Context."}
    </SourceImageDescriptions>
    DEFINITION: Descriptions of actual images on the site.
    ACTION: Mimic this existing style.

    TASK:
    Synthesize a **single, cohesive Visual Style Description** that I can append to every image prompt to ensure consistency.

    Include:
    1. **Color Palette:** (e.g., "Medical Blue #0055FF and Clean White", or "Warm Earth Tones")
    2. **Lighting / Mood:** (e.g., "Soft bright studio lighting", "Moody natural light", "Flat vector lighting")
    3. **Art Medium:** (e.g., "High-resolution Photography", "Minimalist 2D Vector Art", "3D Product Render")
    
    OUTPUT FORMAT:
    Return ONLY the style description string (max 30 words).
    Example: "Photorealistic style with soft daylight, using a clinical white and teal palette, high-end commercial aesthetic."
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Output Language.
    ACTION: Write the style description in English (for AI generation) but if instruction says otherwise, follow it.
`,

  snippet: ({ prompt, languageInstruction }: any) => `
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: The language to use.
    ACTION: Follow this instruction.

    <InputPrompt>
    ${prompt}
    </InputPrompt>
    DEFINITION: The logic or text to process.
    ACTION: Execute this prompt.
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

    <ArticleTitle>
    "${articleTitle}"
    </ArticleTitle>
    DEFINITION: The context of the article.
    ACTION: Ensure heading aligns with article.

    <SectionTitleContext>
    "${sectionTitle}"
    </SectionTitleContext>
    DEFINITION: The H2 parent of this subheading.
    ACTION: Ensure H3 is relevant to this H2.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Output Language.
    ACTION: Write heading in this language.

    HINTS:
    <KeyPoints>
    ${keyPoints.join('; ')}
    </KeyPoints>
    DEFINITION: Points that must be covered.
    ACTION: Condense these into a short heading title.

    <ImportantKeywords>
    ${keywordPlans.map(k => k.word).join(', ')}
    </ImportantKeywords>
    DEFINITION: Keywords to include.
    ACTION: Use these if they fit naturally.

    <NarrativeNotes>
    ${narrativeNotes?.join('; ') || 'None'}
    </NarrativeNotes>
    DEFINITION: Tone or angle note.
    ACTION: Reflect this tone.

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

    <ArticleTitle>
    "${articleTitle}"
    </ArticleTitle>
    DEFINITION: The context of the article.
    ACTION: Ensure headings fit this topic.

    <OriginalHeadings>
    ${headings.map((h, i) => `${i + 1}. ${h}`).join('\n')}
    </OriginalHeadings>
    DEFINITION: The current raw headings.
    ACTION: Refine these specific headings.

    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Target Language.
    ACTION: Write optimized headings in this language.

    STEP BY STEP:
    1) Clarify role: H2 = main section headline; H3 = supporting subpoint under its H2.
    2) Keep it natural, concise, and engaging. Preserve the original intent / angle. Use everyday, conversational wording (生活化) instead of stiff or academic phrasing.
    3) Make the H2 clickable: concise (≤ 60 chars).
    4) Rewrite H2 with **5 options in this exact order** (all must differ from h2_before):
    - Option 1 (經典版): Professional writer version - clear, informative.
    - Option 2 (編輯精選): Editor's pick - concise with strategic keywords.
    - Option 3 (吸睛版): Power words + emotional hooks (必學、秒懂、爆款、神級).
    - Option 4 (痛點版): Pain-point / FOMO angle - address fears or desires.
    - Option 5 (生活化): Lifestyle / conversational - like friend's advice, slang allowed.
    - H2_after = your single best pick among those 5 options.
    5) **CRITICAL**: h2_after text MUST demonstrate what h2_reason describes. Example:
    - If reason says "使用生活化情境「下班回家」", then h2_after MUST contain "下班回家".
    - If reason says "加入流行語「UP UP」", then h2_after MUST contain "UP UP".
    - Each option's text MUST match what its reason describes.
    6) Rewrite / support H3 (if any exist or if you invent them):
    - Keep H3 ultra-compact: product / feature name or a 2-6 word keyword fragment.
    - Align with the chosen H2_after without repeating it.
    7) Validate: no duplicates, no vague fillers. Reject identical before / after.

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
            { "text": "option 3", "reason": "reasoning" },
            { "text": "option 4", "reason": "reasoning" },
            { "text": "option 5", "reason": "reasoning" }
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

    <TargetAudience>
    ${targetAudience}
    </TargetAudience>
    DEFINITION: Region/Language target.
    ACTION: Optimize for this audience's search habits.

    <Context>
    ${contextLines.join('\n')}
    </Context>
    DEFINITION: Article content highlights.
    ACTION: Base the meta tags on this content.

    <ArticlePreview>
    ${articlePreview}
    </ArticlePreview>
    DEFINITION: Snippet of the actual article.
    ACTION: Ensure accuracy to the written text.

    Output JSON:
    { "title": "...", "description": "...", "slug": "..." }
`,

  rebrandContent: ({ productBrief, languageInstruction, currentContent }: any) => `
    ## Task
    REBRAND this article content.

    <BrandIdentity>
    - Name: "${productBrief.brandName}"
    - Product: "${productBrief.productName}"
    - USP: "${productBrief.usp}"
    </BrandIdentity>
    DEFINITION: The new brand identity to inject.
    ACTION: Replace generic terms with these brand assets.

    ## Instructions
    1. Scan the text for generic terms like "the device", "the treatment", "many clinics", or any Competitor Names.
    2. REWRITE those sentences to specifically feature **${productBrief.brandName}** or **${productBrief.productName}**.
    3. Ensure the grammar flows naturally (Subject-Verb agreement).
    4. Do NOT just find-replace. Rewrite the sentence to sound authoritative.
    5. Maintain the original structure and formatting (Markdown).
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>

    <ContentToRebrand>
    ${currentContent}
    </ContentToRebrand>
`,

  smartFindBlock: ({ pointToInject, blocks }: any) => `
    I need to insert this Key Point: 
    <PointToInject>
    "${pointToInject}"
    </PointToInject>
    
    Here is a "Compact Index" of the article paragraphs:
    <ArticleBlocks>
    ${blocks.map((b: any) => `[ID: ${b.id}] ${b.text}`).join('\n')}
    </ArticleBlocks>

    TASK: Identify the SINGLE Best Block ID to insert / merge this point into. 
    Return ONLY the ID (e.g. "5").
    `,

  smartRewriteBlock: ({ pointToInject, targetHtml, languageInstruction }: any) => `
    TASK: Rewrite the following HTML Block to naturally include this Key Point.
    
    <KeyPoint>
    "${pointToInject}"
    </KeyPoint>
    
    <TargetHTMLBlock>
    ${targetHtml}
    </TargetHTMLBlock>

    RULES:
    1. Keep the original meaning and HTML tag structure (<p> or <li>).
    2. Weave the point in naturally.
    3. <LanguageInstruction>${languageInstruction}</LanguageInstruction>
    4. Return ONLY the new HTML string.
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
    Analyze the Authority Terms for this article and surface only the most credible, relevant ones.
    
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
    - Keep only terms that strengthen trust / credibility for this topic and site type.
    - Drop vague, unrelated, or unverifiable claims.
    - Propose strategic combinations of 2-3 terms to reinforce authority.
    
    OUTPUT JSON:
    {
      "relevantTerms": ["best-fit term 1", "best-fit term 2"],
      "combinations": ["term A + term B in intro", "term C in meta description"]
    }
    Return JSON only.`,

  voiceStrategy: ({ content, targetAudience, languageInstruction }: any) => `
    Analyze the reference text to extract the Voice and Brand Strategy.

    1) Voice & Tone (General Plan).
    2) Conversion Strategy (Offers, CTAs, Risk Reversals).
    3) Brand Exclusive Points (USP).
    4) Competitor Names / Products to suppress. (CRITICAL: Do NOT list the region name "${targetAudience}" itself as a competitor).
    5) **Regional Entities Detection**: CRITICAL - Identify ALL brands, stores, services, or entities that are SPECIFIC to a different region and NOT available in the target region "${targetAudience}".
       - For zh-HK target: Detect Taiwan-specific brands (如：寶雅、全聯、momo購物、蝦皮台灣), Taiwan fashion brands, Taiwan chain stores.
       - For zh-TW target: Detect Hong Kong-specific brands (如：HKTVmall、百佳、惠康、sasa), HK chain stores.
       - These should be added to competitorBrands or competitorProducts even if they are not direct competitors.
    6) Regional Validity (Brand Availability).
    7) Human Writing Characteristics.

    <TargetAudience>
    ${targetAudience}
    </TargetAudience>
    DEFINITION: The target region. ALL entities not available in this region should be flagged as competitorBrands/Products.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Output language.

    <ContentToAnalyze>
    ${content}
    </ContentToAnalyze>
    DEFINITION: The reference text to analyze.

    ## Voice Strategy Analysis
    - **regionVoiceDetect**: Analyze the "Regional Voice Composition" of the text (e.g., usage of regional slang like "地道/貼地" for HK vs "接地氣" for TW).
      - Calculate an approximate PERCENTAGE breakdown.
      - Return a string like: "70% HK / 30% TW" or "100% TW".
      - If uncertain or neutral, return "Neutral / Unclear".
    - **Detailed Voice Metrics (CRITICAL)**:
      1. **toneSensation** (語感): Describe the detected tone. Most importantly, explain how it differs from a standard/generic article (與一般文章比較差在哪). Identify the specific "texture" of the voice.
      2. **entryPoint** (切入點): How does the author start the conversation? (e.g., "Personal anecdote", "Shocking statistic", "Common pain point").
    - **generalPlan** (Global Plan): Generate 3-5 specific style rules. **AVOID generic terms** like "Professional", "Scientific", or "Educational" (專業、科普). Instead, focus the rules on the unique **Tone** and **Entry Point** strategy detected.
    - **humanWritingVoice**: Analyze the first 300 words (or the full Intro Paragraph). Explain "Why does this sound HUMAN?" by following these 5 steps:
      1. **Emotions & Subjectivity**: Identify subjective judgments / cultural evaluations (unlike AI's objective tone).
      2. **Tone & Particles**: Look for sentence-final particles (語助詞 like 喔, 唷) that create intimacy.
      3. **Persona & Self-Ref**: Does the writer refer to themselves (e.g. "Dr. X") or assume a character?
      4. **Cultural Metaphors**: Does it link facts to cultural concepts (e.g. physiognomy / fortune telling 面相) rather than just medical facts?
      5. **Social Intent**: Is there a call for interaction (save / share) vs just providing info?
      *Summarize these findings into a concise guide.*
    - **competitorBrands**: List ALL brands that should be avoided, including:
      - Direct competitors mentioned in the text
      - **Region-specific brands/stores NOT available in ${targetAudience}** (e.g., Taiwan brands 韌 REN, Fashion for Yes, 寶雅 when targeting Hong Kong)
    - **competitorProducts**: List ALL products that should be avoided or replaced.

    Return JSON only, no extra text or markdown fences.`,

  keywordAnalysis: ({ content, targetAudience, languageInstruction }: { content: string; targetAudience: string; languageInstruction: string }) => `
    Analyze the reference content to extract high-frequency keywords and their semantic roles.
    
    <TargetAudience>
    ${targetAudience}
    </TargetAudience>
    DEFINITION: The target region.
    ACTION: Factor this into keyword selection.
    
    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Output language.
    ACTION: Use this language for keys / roles.

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

  imagePromptFromContext: ({ contextText, languageInstruction, visualStyle, guide, modelAppearance }: { contextText: string; languageInstruction: string; visualStyle: string; guide: string; modelAppearance: string }) => `
    Generate 3 distinct image generation prompt options based on the following context.
    
    <ModelAppearance>
    ${modelAppearance}
    </ModelAppearance>
    DEFINITION: The appearance characteristics to maintain for any human subjects.
    ACTION: Incorporate these strictly into every prompt that features a person.

    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>
    DEFINITION: Output Language.
    ACTION: Write the prompts in English.
    
    <ContextText>
    ${contextText}
    </ContextText>
    DEFINITION: The scene usage context.
    
    <VisualStyleGuide>
    ${visualStyle}
    </VisualStyleGuide>
    
    <SpecificGuide>
    ${guide}
    </SpecificGuide>

    TASK:
    Create 3 detailed, distinct image generation prompt options that:
    1. Capture the essence of the context text from different angles.
    2. Adhere to the visual style guide and the mandatory Model Appearance.
    3. Are optimized for AI image generation (concrete subjects).
    
    OUTPUT JSON:
    [
      "Option 1: Subject + Activity + Environment + Style details",
      "Option 2: Alternative angle or focus...",
      "Option 3: Another distinct variation..."
    ]
    `,


  // --- 1. SKELETON EXTRACTION ---
  extractOutline: ({
    content,
    targetAudience,
    languageInstruction,
  }: {
    content: string;
    targetAudience: string;
    languageInstruction: string;
  }) => `
    You are an expert Content Architect. Your mission is to extract the PHYSICAL SKELETON of the provided content.
    Do NOT analyze logic, facts, or strategy yet. Focus ONLY on the structure.

    <TargetAudience>
    ${targetAudience}
    </TargetAudience>

    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>

    STRICT HEADING RULES:
    - Enumerate EVERY H2 and its child H3s in order from the reference.
    - Use the exact heading text as it appears.
    - If no clear headings exist, infer concise H2s.
    - Specifically for "目錄" (Table of Contents), ALWAYS set "exclude": true.

    OUTPUT JSON:
    {
      "h1Title": "Exact H1 title text",
      "introText": "The first paragraph/intro text after H1",
      "structure": [
        {
          "title": "Exact H2 text",
          "subheadings": ["Exact H3 text 1", "Exact H3 text 2"],
          "exclude": false,
          "excludeReason": "..."
        }
      ],
      "keyInformationPoints": ["General key fact 1"]
    }

    <Content>
    ${content}
    </Content>
    `,

  // --- 2. DEEP NARRATIVE LOGIC ANALYSIS ---
  analyzeNarrativeLogic: ({
    content,
    outlineJson,
    targetAudience,
    languageInstruction,
  }: {
    content: string;
    outlineJson: string;
    targetAudience: string;
    languageInstruction: string;
  }) => `
    You are an expert Narrative Strategist. Your mission is to fill the physical skeleton with DEEP LOGICAL FLOW and NARRATIVE PLANNING.

    <OutlineStructure>
    ${outlineJson}
    </OutlineStructure>

    <TargetAudience>
    ${targetAudience}
    </TargetAudience>

    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>

    STRICT RULES FOR EVERY SECTION:
    - **LANGUAGE LEVEL**: Use extremely simple, direct language (elementary school level simplicity). No jargon or flowery summaries.
    - **"logicalFlow"**: A one-sentence description of the INNER RELATIONSHIP/CONNECTION between points. Do NOT summarize what to do. Instead, explain the "Logic Bridge": "Why does point A lead to point B?". It supplements Narrative Plan/Key Facts by clarifying the hidden "Why" or "Transition Logic".
    - **"coreFocus"**: Defines the TONE and EMOTIONAL HOOK. Tell the writer *how* to emphasize things and what vibe to maintain (e.g., "Urgent warning: sound concerned", "Relief and comfort: sound like a calm expert").
    - **"narrativePlan"**: 4-6 specific writing instructions. 
       - **Mark each item as "[Primary]" or "[Secondary]"**.
       - "[Primary]" items should focus on the core message or most critical information.
       - "[Secondary]" items should focus on edge cases, transitions, or minor supporting details.
    - **"keyFacts"**: 3-5 verifiable facts extracted from content.
    - **"coreQuestion"**: The main problem this section answers.

    OUTPUT JSON (Array for the 'structure' property):
    {
      "structure": [
        {
          "title": "Matches outline title exactly",
          "narrativePlan": ["Plan 1", "Plan 2", "Plan 3", "Plan 4", "Plan 5"],
          "logicalFlow": "One-sentence logic chain description",
          "coreFocus": "Description of emphasis",
          "keyFacts": ["Fact 1", "Fact 2", "Fact 3"],
          "coreQuestion": "Main question",
          "difficulty": "easy | medium | unclear",
          "writingMode": "direct | multi_solutions",
          "uspNotes": ["..."],
          "isChecklist": false,
          "suppress": ["..."],
          "augment": ["..."],
          "sentenceStartFeatures": ["..."],
          "sentenceEndFeatures": ["..."]
        }
      ]
    }

    <ReferenceContent>
    ${content}
    </ReferenceContent>
    `,

  regionalBrandAnalysis: ({ content, targetAudience }: { content: string; targetAudience: string }) => `
    TASK: Analyze the content for **Regional Terminology** and **Brand Availability** conflicts in: ${targetAudience}.

    <TargetAudience>
      ${targetAudience}
    </TargetAudience>

    Using Google Search (Grounding), verify:
    1. **Brand Availability**: Are mentioned brands / products actually available / popular in ${targetAudience}? (e.g. A Taiwan-only clinic appearing in a Hong Kong article is a mismatch).
    2. **Regional Vocabulary**: Replace obvious dialect terms (e.g. "視頻" -> "影片" for TW).

    <ContentSnippet>
    ${content.slice(0, 15000)}...
    </ContentSnippet>

    OUTPUT JSON:
    [
      { "original": "Wrong Term", "replacement": "Correct Term", "reason": "Reason (e.g. 'Taiwan-only brand')" }
    ]
    Return JSON only. If no issues, return [].
    `,
};

export type PromptTemplateKey = keyof typeof promptTemplates;
