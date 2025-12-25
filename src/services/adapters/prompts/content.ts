export const contentPrompts = {
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
    sourceContext,
  }: any) => {
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
    ${previousSections
        .slice(-2)
        .map((s: string) => s.substring(0, 100) + '...')
        .join(' | ')}
    </PreviousSections>
    DEFINITION: Summaries of the immediately preceding sections.

    <UpcomingSections>
    ${futureSections.join(', ')}
    </UpcomingSections>
    DEFINITION: Titles of sections to be written later.

    ${sourceContext ? `
    <SourceContext>
    ${sourceContext}
    </SourceContext>
    DEFINITION: The raw source text relevant to this section.
    INSTRUCTION: Use facts and details from here to substantiate your writing.
    ` : ''}


    ## Strategy & Style
    <OverallVoice>
    ${generalPlan?.join('; ') || 'Professional, authoritative'}
    </OverallVoice>
    DEFINITION: The desired tone and persona for the article.

    <SectionStrategy>
    ${specificPlan?.join('; ') || 'Explain thoroughly'}
    ${logicalFlow ? `\n    LOGICAL FLOW: ${logicalFlow}` : ''}
    ${coreFocus ? `\n    CORE EMPHASIS: ${coreFocus}` : ''}
    </SectionStrategy>
    DEFINITION: Specific goals or angles for this section.

    <BrandKnowledge>
    ${kbInsights.length > 0 ? kbInsights.join('; ') : 'None'}
    </BrandKnowledge>
    DEFINITION: Background facts or guidelines about the brand.

    ${humanWritingVoice
        ? `
    <HumanWritingVoice>
    ${humanWritingVoice}
    </HumanWritingVoice>
    DEFINITION: Instructions on how to sound human and not like an AI.
    `
        : ''
      }

    ${regionVoiceDetect
        ? `
    <RegionVoiceProfile>
    ${regionVoiceDetect}
    </RegionVoiceProfile>
    DEFINITION: The detected regional voice composition (e.g., 70% HK / 30% TW).
    INSTRUCTION: Adhere to the dominant regional tone.
    `
        : ''
      }


    ## Localization & Safety
    ${(replacementRules && replacementRules.length > 0) ||
        (regionReplacements && regionReplacements.length > 0)
        ? `
    <LocalizationAndSafety>
    ${replacementRules && replacementRules.length > 0
          ? `
    **Blocked Terms (DO NOT USE):**
    ${replacementRules.map((r: any) => `- ❌ ${r}`).join('\n')}
    `
          : ''
        }
    ${regionReplacements && regionReplacements.length > 0
          ? `
    **Regional Replacements (MANDATORY):**
    ${regionReplacements
            .map((r: any) =>
              r.replacement
                ? `- "${r.original}" → "${r.replacement}"`
                : `- "${r.original}" → [REMOVE from text]`
            )
            .join('\n')}
    `
          : ''
        }
    </LocalizationAndSafety>
    DEFINITION: Terms to avoid and mandatory vocabulary corrections for the target region.
    INSTRUCTION:
    1. NEVER use any Blocked Terms.
    2. ALWAYS replace "original" terms with their "replacement".
    3. If replacement is [REMOVE], rewrite the sentence to exclude that term entirely.
    `
        : '(No localization constraints)'
      }


    ## Task Definition
    <CoreQuestion>
    ${coreQuestion || 'Infer the precise question and answer it'}
    </CoreQuestion>
    DEFINITION: The comprehensive question this section must answer.

    <Difficulty>
    ${resolvedDifficulty}
    </Difficulty>
    DEFINITION: The complexity level of the topic (easy, medium, unclear).

    <WritingMode>
    ${mode === 'direct' ? 'direct answer first' : 'multi solutions then synthesize'}
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
    ${subheadings && subheadings.length > 0
        ? `
    <MandatorySubheadings>
    ${subheadings.map((h: any, i: number) => `${i + 1}. ${h}`).join('\n')}
    </MandatorySubheadings>
    DEFINITION: The exact H3 subheadings you must use.
    `
        : '(No predefined subheadings)'
      }


    ## Solution Angles
    ${mode === 'multi_solutions'
        ? solutionAngles && solutionAngles.length > 0
          ? `
        <DefinedAngles>
        ${solutionAngles.join('; ')}
        </DefinedAngles>
        DEFINITION: The specific angles/perspectives to cover.
        `
          : 'None provided; create 2 distinct angles.'
        : 'Not needed for direct mode.'
      }


    ## Resources & Keywords
    <SemanticKeywords>
    ${keywordPlans
        .map(
          (k: any) => `
    - "${k.word}": ${k.plan?.join('; ') || 'Use naturally.'}`
        )
        .join('')}
    </SemanticKeywords>
    DEFINITION: SEO keywords with semantic usage rules.
    INSTRUCTION: Use these words according to their "Semantic Context". If the keyword is in a different language than the target language, you MUST translate it naturally into the target language (unless it is a specific brand name or proper noun that should remain unchanged). Do NOT create mixed-language sentences like "As you age, 肌膚...".

    <AuthorityTerms>
    ${relevantAuthTerms.slice(0, 5).join(', ')}
    </AuthorityTerms>
    DEFINITION: Technical or authoritative terms.


    ## Key Facts & Narrative Points
    - **WRITING RULE**: Use clean, direct sentence structures. Ensure structural clarity.
    <KeyPoints>
    ${points.length > 0 ? points.join('; ') : '(No new key points needed for this section, focus on narrative)'}
    </KeyPoints>
    DEFINITION: The core facts and information for this section.


    ## Injection Plan
    ${injectionPlan}


    ## Exclusion Rules
    ${suppressHints && suppressHints.length > 0
        ? `
    <StrictExclusion>
    ${suppressHints.map((c: any) => `- ${c}`).join('\n')}
    </StrictExclusion>
    DEFINITION: Topics that are strictly forbidden here.
    `
        : '(None)'
      }

    ${avoidContent && avoidContent.length > 0
        ? `
    <NegativeConstraints>
    ${avoidContent.map((c: any) => `- ${c}`).join('\n')}
    </NegativeConstraints>
    DEFINITION: Content to avoid to prevent repetition/redundancy.
    `
        : ''
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
    - **IMPORTANT**: You must populate "comment" with a short string explaining your execution thought process (e.g. "I focused on pain points here because...").
`;
  },

  frequentWordsPlacementAnalysis: ({
    languageInstruction,
    analysisPayloadString,
  }: any) => `
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
  }: any) => `
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
    ${keywordPlans.map((k: any) => k.word).join(', ')}
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
  }: any) => `
    You are cleaning and unifying article section headings.

    <ArticleTitle>
    "${articleTitle}"
    </ArticleTitle>
    DEFINITION: The context of the article.
    ACTION: Ensure headings fit this topic.

    <OriginalHeadings>
    ${headings.map((h: any, i: number) => `${i + 1}. ${h}`).join('\n')}
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

  smartFindAndRewriteBlock: ({ pointToInject, blocks, languageInstruction }: any) => `
    I need to insert a Key Point into an article naturally.

    <PointToInject>
    "${pointToInject}"
    </PointToInject>

    <ArticleBlocks>
    ${blocks.map((b: any) => `[ID: ${b.id}] ${b.text}`).join('\n')}
    </ArticleBlocks>

    <LanguageInstruction>
    ${languageInstruction}
    </LanguageInstruction>

    TASK:
    1. Analyze the blocks to find the SINGLE best location (ID) to insert or merge this point.
    2. Rewrite that specific block to include the point naturally.
    3. Keep the original meaning and HTML tag structure (<p> or <li>) of the chosen block.

    OUTPUT JSON:
    {
      "originalBlockId": <number>, 
      "newHtml": "<string>"
    }
  `,

  extractOutline: ({
    content,
    targetAudience,
    languageInstruction,
  }: any) => `
    You are an expert Content Architect.Your mission is to extract the PHYSICAL SKELETON of the provided content.
    Do NOT analyze logic, facts, or strategy yet.Focus ONLY on the structure.

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
    - Specifically for "目錄"(Table of Contents), ALWAYS set "exclude": true.

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

  analyzeNarrativeLogic: ({
    content,
    outlineJson,
    targetAudience,
    languageInstruction,
  }: any) => `
    You are an expert Narrative Strategist.Your mission is to fill the physical skeleton with DEEP LOGICAL FLOW and NARRATIVE PLANNING.

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
    - ** LANGUAGE LEVEL **: Use extremely simple, direct language(elementary school level simplicity).No jargon or flowery summaries.
    - ** "logicalFlow" **: An Editor-in-Chief's direct, explicit instruction on the LOGIC BRIDGE. (e.g. "Because X happened, you must immediately transition to Y to show the consequence."). Do NOT summarize content. Define the *hidden causal connection* or *argumentative strategy* that links the points.
    - ** "coreFocus" **: Defines the TONE and EMOTIONAL HOOK.Tell the writer * how * to emphasize things and what vibe to maintain(e.g., "Urgent warning: sound concerned", "Relief and comfort: sound like a calm expert").
    
    - ** "narrativePlan" **: 4 - 6 specific writing instructions.
       - ** Mark each item as "[Primary]" or "[Secondary]" **.
       - ** ALIGNMENT **: Ensure these steps provide a roadmap that covers all H3 subheadings for this section.
       - "[Primary]" items should focus on the core message or most critical information.
       - "[Secondary]" items should focus on edge cases, transitions, or minor supporting details.

    - ** "keyFacts" ** / **"subsections"**:
  - ** Structure **: You must group facts under specific H3 subheadings.
       - ** Granularity **: Extract 2 - 3 atomic facts for EACH subheading(or for the main section if no subheadings).
       - ** Character Limit **: EACH fact must be **< 30 characters ** (for Chinese) or **< 60 characters ** (for English).
       - ** STRICT RULE **: Simple sentences only.No complex clauses.
       - ** Output **: Populate the 'subsections' array in the JSON.

    - ** "coreQuestion" **: The main problem this section answers.

    - ** "sourceCharCount" **:
- ESTIMATE the number of characters in the original source text that corresponds to this section(H2 + its H3s).
       - This is critical for controlling the writing length later.

    - ** "instruction" **:
       - ** ROLE **: 你是總編輯，在截稿現場直接指導編輯寫作。(You are the Editor -in -Chief giving immediate, on - site directives).
       - ** CRITICAL **:
1. ** NO TONE INSTRUCTIONS **: The editor knows the tone.Focus purely on CONTENT strategy.
         2. ** USE CONTEXTUAL VOCABULARY **: Communicate instantly by using the * exact keywords, phrases, and concepts * found in the source text.Do not use abstract descriptions like "the concept" or "the first point".
            - ** Bad **: "Explain the main problem mentioned in the text."(Too slow, vague)
  - ** Good **: "Explain the 'Latency Spike' issue and why 'Buffer Bloat' is the root cause according to the 'Cisco Report'."(Specific, instant clarity)
    - ** LOGIC SEQUENCE ** (Direct the content flow):
1. ** [Core Facts] **: "Directly state X. Contrast it with Y."
2. ** [Narrative Angle] **: "Use the 'Z event' to explain why..."
3. ** [Red Lines] **: "Ignore the rumors about W."
4. ** [Execution] **: "Keep to ~300 words. Cite the '2024 Study'."
  - ** FORMAT **:
         - ** Single Fluent Paragraph **.
         - ** Direct Command Style(Imperative) **.
       - ** EXAMPLE 1 **: "直接把『義大利裔』和『姓名未公開』這兩點寫出來。針對論壇上的『假名謠言』，直接點出那是沒有根據的，甚至可以引用『官方聲明』來駁斥。這段控制在 350 字內，聚焦在事實查核。"
  - ** EXAMPLE 2 **: "這段聚焦在『單親家庭』對她『性格孤僻』的影響。一定要引用那篇『2023年專訪』的內容來佐證，不要自己腦補心理戲。特別強調『外公外婆』的角色。"

    OUTPUT JSON(Array for the 'structure' property):
  {
    "structure": [
      {
        "title": "Matches outline title exactly",
        "narrativePlan": ["Plan 1", "Plan 2", "Plan 3"],
        "logicalFlow": "One-sentence logic chain description",
        "coreFocus": "Description of emphasis",
        "subsections": [
          { "title": "H3 Title 1", "keyFacts": ["Short Fact 1", "Short Fact 2"] },
          { "title": "H3 Title 2", "keyFacts": ["Short Fact 3", "Short Fact 4"] }
        ],
        "keyFacts": ["Backwards compatible list of all facts above..."],
        "coreQuestion": "Main question",
        "difficulty": "easy | medium | unclear",
        "writingMode": "direct | multi_solutions",
        "uspNotes": ["..."],
        "isChecklist": false,
        "suppress": ["..."],
        "augment": ["..."],
        "sentenceStartFeatures": ["..."],
        "sentenceEndFeatures": ["..." ]
      }
    ]
  }

<ReferenceContent>
  ${content}
</ReferenceContent>
  `,

  sectionInjectionPlan: ({
    productBrief,
    competitorBrands,
    competitorProducts,
    replacementRules,
    currentInjectedCount,
    isLastSections,
    relevantMappings,
    forceInjection,
    isSolutionSection,
    fallbackMappings,
  }: any) => {
    const allTargets = [
      ...new Set([...competitorBrands, ...competitorProducts, ...replacementRules]),
    ];
    const finalMappings =
      relevantMappings.length > 0
        ? relevantMappings
        : forceInjection || isSolutionSection
          ? fallbackMappings
          : [];

    let plan = `### 💎 COMMERCIAL & SERVICE STRATEGY(HIGH PRIORITY) 
`;

    if (allTargets.length > 0) {
      plan += `
  **🛡️ SANITIZATION PROTOCOL(ABSOLUTE RULES):**
    You are writing for the brand: ** "${productBrief.brandName}" **.
        The Reference Text mentions competitors: ${allTargets.map((t: any) => `"${t}"`).join(', ')}.

1. ** TOTAL ANNIHILATION:** Never output these competitor words in the final text.
        2. ** NO HYBRIDS:** Do NOT write "CompName as ${productBrief.brandName}".That is nonsense.
        3. ** SUBJECT SWAP(SEMANTIC REWRITE):**
  - If the reference says: "${allTargets[0]} offers the best laser..."
    - ** REWRITE AS:** "**${productBrief.brandName}** offers the best laser..."(Change the Subject).
           - If the reference discusses a specific machine(e.g., "${competitorProducts[0] || 'OldMachine'}"), replace it with ** "${productBrief.productName}" **.
        `;
    }

    plan += `
**📉 DENSITY CONTROL(AVOID KEYWORD STUFFING):**
    - ** Full Name Rule:** Use the full product name "**${productBrief.productName}**" ** MAXIMUM ONCE ** in this section.
    - ** Natural Variation:** For subsequent mentions, you MUST use variations:
- The Brand Name: "**${productBrief.brandName}**"
  - Pronouns: "We", "Our team", "The center"
    - Generic: "This technology", "The treatment", "Our service"
      `;

    if (isLastSections && currentInjectedCount <= 2) {
      plan += `
 **🚀 MANDATORY INJECTION:** You have NOT mentioned "${productBrief.brandName}" enough yet.You MUST introduce it here as the solution.
`;
    }

    if (finalMappings.length > 0) {
      plan += `
 **💡 PROBLEM - SOLUTION WEAVING:**
Integrate the following mapping naturally: 
`;
      finalMappings.forEach((m: any) => {
        plan += `- Discuss "${m.painPoint}" -> Then present ** ${productBrief.brandName}** (or ${productBrief.productName}) as the solution using[${m.productFeature}].\n`;
      });
    }

    plan += `
 ** CTA:** End with a natural link: [${productBrief.ctaLink}](Anchor: Check ${productBrief.brandName} pricing / details).
`;

    return plan;
  },

  mergeAnalyses: ({
    analysesJson,
    targetAudience,
    languageInstruction,
    userInstruction,
  }: any) => `
    You are an Expert Strategic Editor.
    Your task is to SYNTHESIZE multiple content analyses into ONE "Grand Master Plan" for a definitive article.

    <InputAnalyses>
    ${analysesJson}
</InputAnalyses>
DEFINITION: A collection of analyzes from different top - ranking competitor articles.
    
    <TargetAudience>
    ${targetAudience}
</TargetAudience>

  <LanguageInstruction>
    ${languageInstruction}
</LanguageInstruction>

    ${userInstruction
      ? `
    <UserGuidance>
    ${userInstruction}
    </UserGuidance>
    DEFINITION: Specific direction from the user on how to mix/synthesize.
    CRITICAL INSTRUCTION: Analyze the inputs through this lens. If the user wants a "Specific Focus" (e.g. Price Comparison), prioritize structure/facts that support that focus.
    `
      : ''
    }

    ## Synthesis Strategy(CRITICAL)
1. ** Structure(Synthesize Logic) **:
- Treat the Input Structures as a puzzle.Do NOT just concat them.
       - Create a SUPERSET structure that covers all unique angles found across the inputs.
       - Remove redundancy.If Source A has "Benefits" and Source B has "Advantages", merge them into one strong section.
       - Ensure a logical flow: Introduction -> Problem -> Solution(Method) -> Deep Dive -> Conclusion.
    
    2. ** Key Facts(Union & Filter) **:
- Collect ALL unique factual points.
       - Deduplicate similar facts.
       - Keep the most specific / valuable ones.
    
    3. ** Voice & Strategy(Blend) **:
- Merge the "Voice Strategies" to create a versatile, human - like persona.
       - If inputs have conflicting advice, choose the one that feels more "Premium/Authoritative".

    ## Output Schema(JSON)
    Return a single ReferenceAnalysis object:
{
  "structure": [
    {
      "title": "...",
      "subheadings": ["..."],
      "narrativePlan": ["...", "..."],
      "logicalFlow": "...",
      "keyFacts": ["..."],
      "coreFocus": "...",
      "writingMode": "direct" | "multi_solutions"
    }
  ],
    "generalPlan": ["Strategy point 1", "Strategy point 2", ...],
      "keyInformationPoints": ["Fact 1", "Fact 2", ...],
        "brandExclusivePoints": ["..."],
          "conversionPlan": ["..."],
            "humanWritingVoice": "Combined description...",
              "regionVoiceDetect": "Synthesized region detection..."
}
`,

  metaSeo: ({
    targetAudience,
    contextLines,
    articlePreview,
  }: {
    targetAudience: string;
    contextLines: string[];
    articlePreview: string;
  }) => `
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

  convertToMarkdown: ({ content }: { content: string }) => `
    You are a Markdown formatting expert.
    Turn the following text into clean, structured Markdown format without changing the original text content or its inherent meaning. 
    
    <InputText>
    ${content}
    </InputText>

    RULES:
    1. Detect headings and apply #, ##, ### appropriately.
    2. Detect lists and apply - or 1. appropriately.
    3. Preserve all original wording. Do not summarize or rewrite.
    4. Return ONLY the Markdown text.
  `,
};