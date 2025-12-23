export const visualPrompts = {
  visualStyle: ({ languageInstruction, analyzedSamples, websiteType }: any) => `
    I need to define a consistent "Visual Identity" (Master Style Prompt) for an article.
    
    <WebsiteContext>
    ${websiteType}
    </WebsiteContext>
    DEFINITION: The type of business this is.
    ACTION: Ensure style matches this industry.
    
    <SourceImageDescriptions>
    ${analyzedSamples && analyzedSamples.length > 0 ? analyzedSamples : 'No source images available. Infer style strictly from Website Context.'}
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

  imagePromptFromContext: ({
    contextText,
    languageInstruction,
    visualStyle,
    guide,
    modelAppearance,
  }: {
    contextText: string;
    languageInstruction: string;
    visualStyle: string;
    guide: string;
    modelAppearance: string;
  }) => `
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
    3. Are optimized for AI image generation(concrete subjects).
    
    OUTPUT JSON:
[
  "Option 1: Subject + Activity + Environment + Style details",
  "Option 2: Alternative angle or focus...",
  "Option 3: Another distinct variation..."
]
  `,

  visualAssetPlanning: ({
    visualStyle,
    visualStyleGuide,
    maxImages,
    languageInstruction,
    articleContent,
    imageContexts,
  }: any) => `
    I have a draft ARTICLE and a list of SOURCE IMAGES.
    I also have a MANDATORY GLOBAL VISUAL STYLE that must be applied to all generated images.

    GLOBAL VISUAL STYLE: "${visualStyle || 'Clean, modern, professional style'}"
    
    TASK:
    Create a "Visual Asset Plan" for the new article.
    
    ${visualStyleGuide}
    
    **ADDITIONAL CONSTRAINTS:**
    1. **Quantity:** Generate a plan for **MAXIMUM ${maxImages} images**.
    2. **Context & Culture:** Ensure the image description is culturally relevant.
       ${languageInstruction}
    3. **Insertion Anchor:** Select a unique text phrase (6-12 chars) from the content.
    4. **Unified Style:** In the 'generatedPrompt', you MUST Explicitly describe how the "Global Visual Style" applies to this specific subject. Do NOT frame as an infographic; focus on photography, product, or lifestyle visuals.

    ARTICLE CONTENT:
    ${articleContent.substring(0, 20000)}

    SOURCE IMAGES (Analyzed Reference):
    ${JSON.stringify(imageContexts)}
    `,
};
