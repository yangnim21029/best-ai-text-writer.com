import 'server-only';
import { z } from 'zod';
import { ServiceResponse, ReferenceAnalysis, TargetAudience } from '../../types';
import { aiService } from '../adapters/aiService';
import { promptTemplates } from '../adapters/promptTemplates';
import { getLanguageInstruction, toTokenUsage, extractRawSnippets } from '../adapters/promptService';
import { analyzeText } from '@/services/adapters/nlpService';
import { embedTexts, cosineSimilarity } from '@/services/adapters/embeddingService';
import { extractSemanticKeywordsAnalysis } from '@/services/research/termUsagePlanner';
import { fetchUrlContent } from './webScraper';
import { logger } from '../../utils/logger';

// Helper to determine if input contains URLs and fetch them
const resolveContent = async (input: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = input.match(urlRegex) || [];
  const rawText = input.split(urlRegex).filter(part => !part.match(urlRegex) && part.trim().length > 0);

  if (urls.length === 0) return input;

  logger.log('init', `RefAnalysis: Resolving ${urls.length} URLs and ${rawText.length} text blocks...`);

  // Limit to 5 URLs to prevent abuse
  const urlsToFetch = urls.slice(0, 5);

  const fetchedResults = await Promise.all(
    urlsToFetch.map(async (url) => {
      try {
        const scraped = await fetchUrlContent(url);
        return `# SOURCE: ${scraped.title}\n${scraped.content}`;
      } catch (e) {
        logger.error('init', `RefAnalysis: Failed to fetch URL: ${url}`, { error: e });
        return `[Failed to fetch: ${url}]`;
      }
    })
  );

  // Combine everything
  return [
    ...fetchedResults,
    ...rawText
  ].join('\n\n---\n\n');
};

export const extractWebsiteTypeAndTerm = async (content: string) => {
  // Lightweight helper for URL scraping flow to infer websiteType & authorityTerms.
  const prompt = promptTemplates.websiteTypeExtraction({ content });

  // Using runJson for structured output with Zod schema
  return await aiService.runJson<{ websiteType: string; authorityTerms: string }>(
    prompt,
    'FLASH',
    {
      schema: z.object({
        websiteType: z.string(),
        authorityTerms: z.string(),
      }),
      promptId: 'website_type_extraction',
    }
  );
};

export const analyzeReferenceStructure = async (
  referenceContent: string,
  targetAudience: TargetAudience
): Promise<ServiceResponse<ReferenceAnalysis>> => {
  const startTs = Date.now();
  const languageInstruction = getLanguageInstruction(targetAudience);

  // Prepare Prompts
  const voicePrompt = promptTemplates.voiceStrategy({
    content: referenceContent,
    targetAudience,
    languageInstruction,
  });

  try {
    // --- STAGE 0: Voice & Strategy Analysis (Can run in parallel with Stage 1) ---
    const voiceResPromise = aiService.runJson<any>(voicePrompt, 'FLASH', {
      schema: z.object({
        generalPlan: z.array(z.string()),
        conversionPlan: z.array(z.string()),
        brandExclusivePoints: z.array(z.string()),
        competitorBrands: z.array(z.string()),
        competitorProducts: z.array(z.string()),
        regionVoiceDetect: z.string(),
        humanWritingVoice: z.string(),
        toneSensation: z.string().optional(),
        entryPoint: z.string().optional(),
      }),
      promptId: 'voice_strategy_analysis',
    });

    // --- STAGE 1: Skeleton Extraction ---
    logger.log('extracting_structure', 'RefAnalysis: Stage 1: Skeleton Extraction...');
    const outlinePrompt = promptTemplates.extractOutline({
      content: referenceContent,
      targetAudience,
      languageInstruction,
    });
    const outlineRes = await aiService.runJson<any>(outlinePrompt, 'FLASH', {
      schema: z.object({
        h1Title: z.string(),
        introText: z.string(),
        keyInformationPoints: z.array(z.string()),
        structure: z.array(
          z.object({
            title: z.string(),
            subheadings: z.array(z.string()).optional(),
            exclude: z.boolean().optional(),
            excludeReason: z.string().optional(),
          })
        ),
      }),
      promptId: 'skeleton_extraction',
    });

    const outlineData = outlineRes.data;
    logger.log('extracting_structure', 'RefAnalysis: Outline Extraction complete', { h1: outlineData.h1Title });

    // Filter excluded sections for deep analysis
    const sectionsToAnalyze = (outlineData.structure || []).filter((item: any) => {
      if (item.exclude === true) return false;
      const navKeywords = [
        '目錄',
        '導覽',
        '清單',
        '引言',
        '前言',
        '延伸閱讀',
        '相關文章',
        'Table of Contents',
        'TOC',
        'Introduction',
        'Overview',
      ];
      if (navKeywords.some((kw) => item.title.includes(kw) && item.title.length < 15)) return false;
      return true;
    });

    // Inject Introduction as the first section if introText exists
    if (outlineData.introText && outlineData.introText.length > 10) {
      sectionsToAnalyze.unshift({
        title: 'Introduction',
        subheadings: [], // Intro usually doesn't have subheadings
      });
    }

    // --- STAGE 2: Deep Narrative Logic Analysis (Parallel Batches) ---
    logger.log('nlp_analysis', `RefAnalysis: Stage 2: Deep Logic Analysis for ${sectionsToAnalyze.length} sections...`);

    const chunkArray = <T>(array: T[], size: number): T[][] => {
      const chunked: T[][] = [];
      for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
      }
      return chunked;
    };

    // Split sections into chunks of 4 to avoid massive prompts and enable parallelism
    const sectionChunks = chunkArray(sectionsToAnalyze, 4);

    const logicAnalysisPromise = (async () => {
      const chunkPromises = sectionChunks.map(async (chunk, idx) => {
        const chunkPrompt = promptTemplates.analyzeNarrativeLogic({
          content: referenceContent,
          outlineJson: JSON.stringify(chunk),
          targetAudience,
          languageInstruction,
        });

        try {
          return await aiService.runJson<any>(chunkPrompt, 'FLASH', {
            schema: z.object({
              structure: z.array(
                z.object({
                  title: z.string(),
                  narrativePlan: z.array(z.string()),
                  logicalFlow: z.string(),
                  coreFocus: z.string(),
                  keyFacts: z.array(z.string()),
                  coreQuestion: z.string(),
                  difficulty: z.enum(['easy', 'medium', 'unclear']),
                  writingMode: z.enum(['direct', 'multi_solutions']),
                  uspNotes: z.array(z.string()).optional(),
                  suppress: z.array(z.string()).optional(),
                  augment: z.array(z.string()).optional(),
                  subsections: z.array(
                    z.object({
                      title: z.string(),
                      keyFacts: z.array(z.string()),
                    })
                  ),
                  sourceCharCount: z.number(),
                  instruction: z.string(),
                })
              ),
            }),
            promptId: `narrative_logic_analysis_chunk_${idx} `,
          });
        } catch (err) {
          logger.error('nlp_analysis', `RefAnalysis: Logic analysis chunk ${idx} failed`, { error: err });
          return null; // Handle partial failure
        }
      });

      const chunkResults = await Promise.all(chunkPromises);

      // Merge results
      const combinedStructure: any[] = [];
      let combinedUsage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
      let combinedCost = { inputCost: 0, outputCost: 0, totalCost: 0 };

      chunkResults.forEach((res) => {
        if (res && res.data?.structure) {
          combinedStructure.push(...res.data.structure);
          combinedUsage.inputTokens += res.usage?.inputTokens || 0;
          combinedUsage.outputTokens += res.usage?.outputTokens || 0;
          combinedUsage.totalTokens += res.usage?.totalTokens || 0;
          combinedCost.inputCost += res.cost?.inputCost || 0;
          combinedCost.outputCost += res.cost?.outputCost || 0;
          combinedCost.totalCost += res.cost?.totalCost || 0;
        }
      });

      return {
        data: { structure: combinedStructure },
        usage: combinedUsage,
        cost: combinedCost
      };
    })();

    const [logicRes, voiceRes] = await Promise.all([
      logicAnalysisPromise,
      voiceResPromise,
    ]);

    const logicData = logicRes.data;
    const voiceData = voiceRes.data;

    // --- DATA MERGING ---
    const normalizedStructure = logicData.structure.map((logicItem: any) => {
      // Find original skeleton item to get subheadings
      const skeletonItem = outlineData.structure.find((s: any) => s.title === logicItem.title);

      return {
        ...logicItem,
        subheadings: skeletonItem?.subheadings || [],
        uspNotes: logicItem.uspNotes || [],
        suppress: logicItem.suppress || [],
        augment: logicItem.augment || [],
        subsections: logicItem.subsections || [],
        keyFacts:
          logicItem.keyFacts ||
          (logicItem.subsections ? logicItem.subsections.flatMap((s: any) => s.keyFacts) : []),
        difficulty: logicItem.difficulty || 'easy',
        writingMode: logicItem.writingMode || 'direct',
      };
    });

    const combinedRules = [
      ...(voiceData.competitorBrands || []),
      ...(voiceData.competitorProducts || []),
    ];

    // Total usage including all 3 calls (Outline, Logic, Voice)
    const totalUsage = {
      inputTokens:
        (outlineRes.usage?.inputTokens || 0) +
        (logicRes.usage?.inputTokens || 0) +
        (voiceRes.usage?.inputTokens || 0),
      outputTokens:
        (outlineRes.usage?.outputTokens || 0) +
        (logicRes.usage?.outputTokens || 0) +
        (voiceRes.usage?.outputTokens || 0),
      totalTokens:
        (outlineRes.usage?.totalTokens || 0) +
        (logicRes.usage?.totalTokens || 0) +
        (voiceRes.usage?.totalTokens || 0),
    };

    const totalCost = {
      inputCost:
        (outlineRes.cost?.inputCost || 0) +
        (logicRes.cost?.inputCost || 0) +
        (voiceRes.cost?.inputCost || 0),
      outputCost:
        (outlineRes.cost?.outputCost || 0) +
        (logicRes.cost?.outputCost || 0) +
        (voiceRes.cost?.outputCost || 0),
      totalCost:
        (outlineRes.cost?.totalCost || 0) +
        (logicRes.cost?.totalCost || 0) +
        (voiceRes.cost?.totalCost || 0),
    };

    return {
      data: {
        h1Title: outlineData.h1Title || '',
        introText: outlineData.introText || '',
        structure: normalizedStructure,
        keyInformationPoints: outlineData.keyInformationPoints || [],
        generalPlan: voiceData.generalPlan || [],
        conversionPlan: voiceData.conversionPlan || [],
        brandExclusivePoints: voiceData.brandExclusivePoints || [],
        replacementRules: combinedRules,
        competitorBrands: voiceData.competitorBrands || [],
        competitorProducts: voiceData.competitorProducts || [],
        regionVoiceDetect: voiceData.regionVoiceDetect,
        humanWritingVoice: voiceData.humanWritingVoice,
        toneSensation: voiceData.toneSensation,
        entryPoint: voiceData.entryPoint,
      },
      usage: totalUsage,
      cost: totalCost,
      duration: Date.now() - startTs,
    };
  } catch (e: any) {
    logger.error('extracting_structure', 'RefAnalysis: Structure analysis failed', { error: e });
    const errorUsage = toTokenUsage(0); // Simplified error handling
    const errorCost = { inputCost: 0, outputCost: 0, totalCost: 0 };
    return {
      data: {
        structure: [],
        generalPlan: [],
        conversionPlan: [],
        keyInformationPoints: [],
        brandExclusivePoints: [],
        replacementRules: [],
        competitorBrands: [],
        competitorProducts: [],
      },
      usage: errorUsage,
      cost: errorCost,
      duration: Date.now() - startTs,
    };
  }
};

/**
 * EXPERIMENTAL: Extracts only the Voice/Tone/Blueprint profile from content.
 * Reuses the existing voiceStrategy prompt but targets specific voice fields.
 */
export const extractVoiceProfileOnly = async (
  content: string,
  targetAudience: TargetAudience
) => {
  const startTs = Date.now();
  const languageInstruction = getLanguageInstruction(targetAudience);

  // 1. Run NLP to get keywords and snippets (simulating the full pipeline's rigor)
  const keywords = await analyzeText(content);
  // Prepare snippet payload for the AI
  const analysisPayload = keywords.slice(0, 8).map((k) => ({
    word: k.token,
    snippets: extractRawSnippets(content, k.token, 60).slice(0, 3), // Extract real snippets
  }));
  const analysisPayloadString = JSON.stringify(analysisPayload, null, 2);

  // 2. Use the Combined Prompt
  const prompt = promptTemplates.voiceAndToneBlueprint({
    content: content.substring(0, 8000), // Limit content length safety
    targetAudience,
    languageInstruction,
    analysisPayloadString,
  });

  try {
    const res = await aiService.runJson<any>(prompt, 'FLASH', {
      schema: z.object({
        toneSensation: z.string().describe("The overall vibe/tone"),
        humanWritingVoice: z.string().describe("Why it sounds human"),
        regionVoiceDetect: z.string().describe("Regional voice composition"),
        generalPlan: z.array(z.string()).describe("Global style rules"),
        entryPoint: z.string().optional().describe("Strategic angle"),
        conversionPlan: z.array(z.string()).describe("How it sells/converts"),
        sentenceStartFeatures: z.array(z.string()).describe("How sentences typically start"),
        sentenceEndFeatures: z.array(z.string()).describe("How sentences typically end"),
        keywordPlans: z.array(z.object({
          word: z.string(),
          plan: z.array(z.string()),
          exampleSentence: z.string().optional()
        })).describe("Usage plans for key terms")
      }),
      promptId: 'experimental_voice_extraction',
    });

    return {
      data: res.data,
      usage: res.usage,
      cost: res.cost,
      duration: Date.now() - startTs,
    };
  } catch (error) {
    logger.error('nlp_analysis', 'RefAnalysis: Voice extraction failed', { error });
    throw error;
  }
};

/**
 * EXPERIMENTAL: Full-text version of extractVoiceProfileOnly for the replication lab.
 * Uses the exact same prompt but does NOT truncate content.
 */
export const extractVoiceProfileFull = async (
  content: string,
  targetAudience: TargetAudience
) => {
  const startTs = Date.now();
  const languageInstruction = getLanguageInstruction(targetAudience);

  // 1. Run NLP to get keywords and snippets
  const keywords = await analyzeText(content);
  // Prepare snippet payload for the AI
  // INCREASED LIMIT: Send top 40 terms to allow for better semantic filtering downstream
  const analysisPayload = keywords.slice(0, 40).map((k) => ({
    word: k.token,
    snippets: extractRawSnippets(content, k.token, 60).slice(0, 3),
  }));
  const analysisPayloadString = JSON.stringify(analysisPayload, null, 2);

  // 2. Use the Combined Prompt with FULL content
  const prompt = promptTemplates.voiceAndToneBlueprint({
    content: content,
    targetAudience,
    languageInstruction,
    analysisPayloadString,
  });

  try {
    const res = await aiService.runJson<any>(prompt, 'FLASH', {
      schema: z.object({
        toneSensation: z.string(),
        humanWritingVoice: z.string(),
        regionVoiceDetect: z.string(),
        generalPlan: z.array(z.string()),
        entryPoint: z.string().optional(),
        conversionPlan: z.array(z.string()),
        sentenceStartFeatures: z.array(z.string()),
        sentenceEndFeatures: z.array(z.string()),
        keywordPlans: z.array(z.object({
          word: z.string(),
          plan: z.array(z.string()),
          exampleSentence: z.string().optional()
        }))
      }),
      promptId: 'experimental_voice_extraction_full',
    });

    return {
      data: res.data,
      usage: res.usage,
      cost: res.cost,
      duration: Date.now() - startTs,
    };
  } catch (error) {
    logger.error('nlp_analysis', 'RefAnalysis: Full voice extraction failed', { error });
    throw error;
  }
};

/**
 * EXPERIMENTAL: Tests voice profile by generating a section content.
 * 1. Simulates source material retrieval.
 * 2. Generates content using the OFFICIAL contentPrompts.sectionContent.
 */
export const generateTestSectionWithVoice = async (
  sectionTitle: string,
  voiceProfile: any,
  targetAudience: TargetAudience
) => {
  const languageInstruction = getLanguageInstruction(targetAudience);

  // 1. Simulate Reference Data
  const sourcePrompt = promptTemplates.simulateSourceMaterial({
    sectionTitle,
    subheadings: [], // Simple test, no H3s for now
    languageInstruction,
  });

  const sourceRes = await aiService.runJson<{
    viewpoints: string[];
    facts: string[];
    quotes: string[];
  }>(sourcePrompt, 'FLASH', {
    schema: z.object({
      viewpoints: z.array(z.string()),
      facts: z.array(z.string()),
      quotes: z.array(z.string()),
    }),
    promptId: 'experimental_simulate_source',
  });

  const sourceData = sourceRes.data;

  // 2. Map Voice Profile & Source Data to the Official Prompt Context
  // We strictly follow the signature of contentPrompts.sectionContent
  const promptContext = {
    sectionTitle,
    languageInstruction,
    previousSections: [], // Isolated test
    futureSections: [],   // Isolated test

    // --- Voice Injection ---
    generalPlan: voiceProfile.generalPlan,
    humanWritingVoice: voiceProfile.humanWritingVoice,
    regionVoiceDetect: voiceProfile.regionVoiceDetect,
    toneSensation: voiceProfile.toneSensation,
    // Injecting micro-features into general plan or as explicit hints if the prompt supported them directly.
    // Since the official prompt takes 'specificPlan', we can inject some micro-rules there.
    specificPlan: [
      `Tone: ${voiceProfile.toneSensation} `,
      ...(voiceProfile.sentenceStartFeatures ? [`Sentence Starts: ${voiceProfile.sentenceStartFeatures.join(', ')} `] : []),
      ...(voiceProfile.sentenceEndFeatures ? [`Sentence Ends: ${voiceProfile.sentenceEndFeatures.join(', ')} `] : []),
      ...(voiceProfile.conversionPlan ? [`Conversion: ${voiceProfile.conversionPlan[0]} `] : [])
    ],

    // --- Content Injection ---
    points: [
      ...sourceData.viewpoints,
      ...sourceData.facts,
      // Treat quotes as high-value points
      ...sourceData.quotes.map((q: string) => `Quote to consider: "${q}"`)
    ],
    kbInsights: [],
    keywordPlans: voiceProfile.keywordPlans || [], // Use the keyword plans extracted from the voice profile!
    relevantAuthTerms: [],
    injectionPlan: '',
    articleTitle: `Article about ${sectionTitle} `,
    coreQuestion: `What is the key insight about ${sectionTitle}?`,
    difficulty: 'medium',
    writingMode: 'direct',
    solutionAngles: [],
    avoidContent: [],
    renderMode: 'narrative',
    suppressHints: [],
    augmentHints: [],
    subheadings: [],
    regionReplacements: [],
    replacementRules: [],
    logicalFlow: 'Explain the core concept -> Provide evidence -> Conclude with value',
    coreFocus: voiceProfile.entryPoint || 'informative',
  };

  // 3. Generate Content
  const finalPrompt = promptTemplates.sectionContent(promptContext);

  const contentRes = await aiService.runJson<{
    content: string;
    usedPoints: string[];
    injectedCount: number;
    comment: string;
  }>(finalPrompt, 'FLASH', { // Use PRO for better writing quality
    schema: z.object({
      content: z.string(),
      usedPoints: z.array(z.string()),
      injectedCount: z.number(),
      comment: z.string()
    }),
    promptId: 'experimental_test_section_generation'
  });

  return {
    sourceData,
    generatedContent: contentRes.data,
  };
};

/**
 * EXPERIMENTAL: Runs a full replication test.
 * 1. Analyzes Voice (NLP + AI).
 * 2. Analyzes Structure (Official Pipeline).
 * 3. Generates a section using the analyzed Voice + Structure.
 */
export const runFullReplicationTest = async (
  sourceContent: string,
  targetAudience: TargetAudience
) => {
  const startTs = Date.now();
  const languageInstruction = getLanguageInstruction(targetAudience);

  // 1. Parallel Execution: Extract Voice & Extract Structure
  const [voiceRes, structureRes] = await Promise.all([
    extractVoiceProfileOnly(sourceContent, targetAudience),
    analyzeReferenceStructure(sourceContent, targetAudience),
  ]);

  const voiceProfile = voiceRes.data;
  const structureData = structureRes.data;

  // 2. Pick the first meaningful section to test
  // Filter out Intro/TOC if possible, find the first "meaty" section with subheadings or facts
  const targetSection =
    structureData.structure.find(
      (s) =>
        !s.title.toLowerCase().includes('introduction') &&
        !s.title.includes('目錄') &&
        !s.title.includes('前言') &&
        ((s.keyFacts?.length || 0) > 0 || (s.subheadings?.length || 0) > 0)
    ) || structureData.structure[0];

  if (!targetSection) {
    throw new Error('No valid structure sections found in the source text.');
  }

  // 3. Simulate Source Material (Search Results)
  // We combine the *actual analyzed facts* with *simulated search results* for maximum richness
  const simPrompt = promptTemplates.simulateSourceMaterial({
    sectionTitle: targetSection.title,
    subheadings: targetSection.subheadings || [],
    languageInstruction,
  });

  const simRes = await aiService.runJson<{
    viewpoints: string[];
    facts: string[];
    quotes: string[];
  }>(simPrompt, 'FLASH', {
    schema: z.object({
      viewpoints: z.array(z.string()),
      facts: z.array(z.string()),
      quotes: z.array(z.string()),
    }),
    promptId: 'experimental_simulate_source_replication',
  });

  const sourceData = simRes.data;

  // 4. Generate Content (The "Replication")
  // We strictly follow the signature of contentPrompts.sectionContent
  const promptContext = {
    sectionTitle: targetSection.title,
    languageInstruction,
    previousSections: [], // Isolated test
    futureSections: [], // Isolated test

    // --- Voice Injection ---
    generalPlan: voiceProfile.generalPlan,
    humanWritingVoice: voiceProfile.humanWritingVoice,
    regionVoiceDetect: voiceProfile.regionVoiceDetect,
    toneSensation: voiceProfile.toneSensation,
    // Injecting micro-features into specificPlan
    specificPlan: [
      `Tone: ${voiceProfile.toneSensation} `,
      ...(voiceProfile.sentenceStartFeatures
        ? [`Sentence Starts: ${voiceProfile.sentenceStartFeatures.join(', ')} `]
        : []),
      ...(voiceProfile.sentenceEndFeatures
        ? [`Sentence Ends: ${voiceProfile.sentenceEndFeatures.join(', ')} `]
        : []),
      ...(voiceProfile.conversionPlan
        ? [`Conversion: ${voiceProfile.conversionPlan[0]} `]
        : []),
      // Inject logic from structure analysis
      ...(targetSection.logicalFlow ? [`Logical Flow: ${targetSection.logicalFlow} `] : []),
      ...(targetSection.coreFocus ? [`Core Focus: ${targetSection.coreFocus} `] : []),
    ],

    // --- Content Injection ---
    points: [
      // Prioritize facts found in the original text (Structure Analysis)
      ...(targetSection.keyFacts || []).map((f) => `[Source Fact] ${f} `),
      // Supplement with simulated search data
      ...sourceData.viewpoints,
      ...sourceData.facts,
      ...sourceData.quotes.map((q: string) => `Quote: "${q}"`),
    ],

    kbInsights: [],
    keywordPlans: voiceProfile.keywordPlans || [],
    relevantAuthTerms: [],
    injectionPlan: '',
    articleTitle: structureData.h1Title || `Article about ${targetSection.title} `,
    coreQuestion: targetSection.coreQuestion || `Explain ${targetSection.title} `,
    difficulty: targetSection.difficulty || 'medium',
    writingMode: targetSection.writingMode || 'direct',
    solutionAngles: targetSection.solutionAngles || [],
    avoidContent: [],
    renderMode: 'narrative',
    suppressHints: targetSection.suppress || [],
    augmentHints: targetSection.augment || [],
    subheadings: targetSection.subheadings || [],
    regionReplacements: [], // Could use voiceProfile.regionalReplacements if available, but keep simple
    replacementRules: [],
    logicalFlow: targetSection.logicalFlow,
    coreFocus: targetSection.coreFocus,
  };

  const finalRes = await aiService.runJson<{
    content: string;
    usedPoints: string[];
    injectedCount: number;
    comment: string;
  }>(promptTemplates.sectionContent(promptContext), 'FLASH', {
    schema: z.object({
      content: z.string(),
      usedPoints: z.array(z.string()),
      injectedCount: z.number(),
      comment: z.string(),
    }),
    promptId: 'experimental_replication_generation',
  });

  return {
    voiceProfile,
    structure: structureData,
    targetSection,
    simulatedSource: sourceData,
    generatedContent: finalRes.data,
    duration: Date.now() - startTs,
  };
};

/**
 * Merges multiple ReferenceAnalysis objects into a single "Master Plan".
 */
export const mergeMultipleAnalyses = async (
  analyses: ReferenceAnalysis[],
  targetAudience: TargetAudience,
  userInstruction?: string
): Promise<ReferenceAnalysis> => {
  // 0. Pre-check
  if (!analyses || analyses.length === 0) throw new Error('No analyses to merge');
  if (analyses.length === 1) return analyses[0];

  const startTs = Date.now();
  const languageInstruction = getLanguageInstruction(targetAudience);

  // 1. Union "Sharable" Elements (Keywords, Rules, simple lists)
  // Flatten lists and deduplicate
  const allCompetitorBrands = Array.from(
    new Set(analyses.flatMap((a) => a.competitorBrands || []))
  );
  const allCompetitorProducts = Array.from(
    new Set(analyses.flatMap((a) => a.competitorProducts || []))
  );
  const allReplacements = Array.from(
    new Set(analyses.flatMap((a) => a.regionalReplacements || []).map((x) => JSON.stringify(x)))
  ).map((s: any) => JSON.parse(s));

  // For logical synthesis, we prepare a simplified input for the AI
  // We strip out heavy content to save tokens, focusing on Structure & Strategy
  const simplifiedInputs = analyses.map((a, idx) => ({
    id: `Source_${idx + 1} `,
    structure: a.structure.map((s) => ({
      title: s.title,
      subheadings: s.subheadings,
      coreFocus: s.coreFocus,
      keyFacts: s.keyFacts,
    })),
    generalPlan: a.generalPlan,
    keyInformationPoints: a.keyInformationPoints,
    humanWritingVoice: a.humanWritingVoice,
    toneSensation: a.toneSensation,
  }));

  // 2. AI Synthesis for Structure & Voice
  logger.log('nlp_analysis', `RefAnalysis: Merging ${analyses.length} analyses...`);
  const mergePrompt = promptTemplates.mergeAnalyses({
    analysesJson: JSON.stringify(simplifiedInputs, null, 2),
    targetAudience,
    languageInstruction,
    userInstruction,
  });

  try {
    const mergeRes = await aiService.runJson<ReferenceAnalysis>(mergePrompt, 'FLASH', {
      schema: z.object({
        structure: z.array(
          z.object({
            title: z.string(),
            subheadings: z.array(z.string()).optional(),
            narrativePlan: z.array(z.string()),
            logicalFlow: z.string().optional(),
            keyFacts: z.array(z.string()).optional(),
            coreFocus: z.string().optional(),
            writingMode: z.enum(['direct', 'multi_solutions']).optional(),
          })
        ),
        generalPlan: z.array(z.string()),
        keyInformationPoints: z.array(z.string()),
        brandExclusivePoints: z.array(z.string()),
        conversionPlan: z.array(z.string()),
        humanWritingVoice: z.string(),
        regionVoiceDetect: z.string().optional(),
      }),
      promptId: 'analysis_synthesis_merge',
    });

    const mergedData = mergeRes.data;

    // 3. Re-attach Unioned Data
    return {
      ...mergedData,
      competitorBrands: allCompetitorBrands,
      competitorProducts: allCompetitorProducts,
      regionalReplacements: allReplacements,
      // We use the AI's synthesized structure, but ensure defaults
      structure: mergedData.structure.map((s) => ({
        ...s,
        difficulty: 'medium', // Default for merged content
        exclude: false,
        subheadings: s.subheadings || [],
        narrativePlan: s.narrativePlan || [],
        keyFacts: s.keyFacts || [],
        uspNotes: [],
        suppress: [],
        augment: [],
      })),
    };
  } catch (e) {
    logger.error('nlp_analysis', 'RefAnalysis: Merge failed', { error: e });
    // Fallback: Return the first analysis
    return analyses[0];
  }
};

/**
 * EXPERIMENTAL: Runs a replication test with separate sources for Voice, Structure, and Content.
 * A = Voice Source
 * B = Structure Source
 * C = Content Source
 */


// --- RAG Helpers (Moved to Top Level) ---

// 3. Helper for RAG Vector (Chunk) Strategy
export const extractVectorContext = async (sourceText: string, query: string): Promise<string> => {
  if (!sourceText) return '';
  try {
    const chunkSize = 500;
    const chunks: string[] = [];
    for (let i = 0; i < sourceText.length; i += 400) {
      chunks.push(sourceText.substring(i, i + chunkSize));
    }
    if (chunks.length === 0) return '';
    const allTexts = [query, ...chunks];
    const embeddings = await embedTexts(allTexts);
    const queryVec = embeddings[0];
    const chunkVecs = embeddings.slice(1);
    const scored = chunks.map((chunk, i) => ({
      chunk,
      score: cosineSimilarity(queryVec, chunkVecs[i])
    })).sort((a, b) => b.score - a.score);
    return scored.slice(0, 3).map(s => s.chunk).join('\n---\n');
  } catch (e) {
    logger.error('nlp_analysis', 'RefAnalysis: MixMatch: Vector RAG failed', { error: e });
    return '';
  }
};

// Strategy Constants
const RAG_CHUNK_SIZE = 500;
const RAG_CHUNK_OVERLAP = 100;
const MAX_CHUNKS_PER_SECTION = 4;

/**
 * CORE LOGIC: Global Exclusive Allocation
 * Assigns chunks to sections such that overlaps are minimized (or zero),
 * enforcing that each section gets "fresh" insights.
 */
export const distributeChunksExclusively = async (
  sourceText: string,
  sections: { title: string; coreFocus?: string }[]
): Promise<Map<string, string>> => {
  if (!sourceText || sections.length === 0) return new Map();

  logger.log('nlp_analysis', `RefAnalysis: DistributeChunks: Allocating chunks for ${sections.length} sections...`);

  // 1. Chunking (Overlap to avoid cutting sentences too harshly)
  const step = RAG_CHUNK_SIZE - RAG_CHUNK_OVERLAP;
  const chunks: string[] = [];

  for (let i = 0; i < sourceText.length; i += step) {
    chunks.push(sourceText.substring(i, i + RAG_CHUNK_SIZE));
  }

  if (chunks.length === 0) return new Map();

  // 2. Embed Everything (Sections + Chunks)
  const sectionQueries = sections.map(s => `${s.title} ${s.coreFocus || ''}`);
  const allTexts = [...sectionQueries, ...chunks];

  let embeddings: number[][] = [];
  try {
    embeddings = await embedTexts(allTexts);
  } catch (e) {
    logger.error('nlp_analysis', 'RefAnalysis: DistributeChunks: Embedding failed', { error: e });
    return new Map();
  }

  const sectionVecs = embeddings.slice(0, sections.length);
  const chunkVecs = embeddings.slice(sections.length);

  // 3. Score Everything Matrix [SectionIndex][ChunkIndex] = Score
  // We flatten this to a list of potential assignments: { sectionIdx, chunkIdx, score }
  const allMatches: { sectionIdx: number; chunkIdx: number; score: number }[] = [];

  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
      const score = cosineSimilarity(sectionVecs[sIdx], chunkVecs[cIdx]);
      // Only consider meaningful matches
      if (score > 0.35) {
        allMatches.push({ sectionIdx: sIdx, chunkIdx: cIdx, score });
      }
    }
  }

  // 4. Sort by Strength
  allMatches.sort((a, b) => b.score - a.score);

  // 5. Exclusive Allocation Loop
  const assignments = new Map<string, string[]>(); // SectionTitle -> AssignedChunks[]
  const usedChunks = new Set<number>();
  const chunksPerSectionCount = new Map<number, number>(); // SectionIdx -> Count

  // Initialize Maps
  sections.forEach((_, idx) => chunksPerSectionCount.set(idx, 0));
  sections.forEach(s => assignments.set(s.title, []));

  for (const match of allMatches) {
    const { sectionIdx, chunkIdx, score } = match;

    // Check constraints
    if (usedChunks.has(chunkIdx)) continue; // Already taken
    if ((chunksPerSectionCount.get(sectionIdx) || 0) >= MAX_CHUNKS_PER_SECTION) continue; // Section full

    // Assign
    const sectionTitle = sections[sectionIdx].title;
    const currentList = assignments.get(sectionTitle) || [];
    currentList.push(chunks[chunkIdx]); // Store the text
    assignments.set(sectionTitle, currentList);

    // Update State
    usedChunks.add(chunkIdx);
    chunksPerSectionCount.set(sectionIdx, (chunksPerSectionCount.get(sectionIdx) || 0) + 1);
  }

  // 6. Format Output
  const result = new Map<string, string>();
  assignments.forEach((chunkList, title) => {
    result.set(title, chunkList.join('\n\n---\n\n'));
  });

  logger.log('nlp_analysis', `RefAnalysis: DistributeChunks: Allocation Complete. Used ${usedChunks.size}/${chunks.length} chunks.`);
  return result;
};

// 2. Agentic RAG (LLM Distribution)
const extractAgenticContext = async (sourceText: string, sectionTitle: string): Promise<string> => {
  // Assuming English default if local scope unavailable, practically handled by prompt
  const languageInstruction = 'Write in English.';
  try {
    const prompt = promptTemplates.distributeContext({
      sourceContent: sourceText,
      sectionTitles: [sectionTitle],
      languageInstruction
    });
    const res = await aiService.runJson<{ mapping: { relevantContext: string }[] }>(prompt, 'FLASH', {
      schema: z.object({
        mapping: z.array(z.object({ relevantContext: z.string() }))
      }),
      promptId: 'mix_match_rag_agentic'
    });
    return res.data.mapping[0]?.relevantContext || '';
  } catch (e) {
    return '';
  }
};

export const runMixAndMatchReplication = async (
  voiceSource: string,
  structureSource: string,
  contentSource: string,
  targetAudience: TargetAudience
) => {
  const startTs = Date.now();
  const languageInstruction = getLanguageInstruction(targetAudience);

  // 1. Resolve Inputs (URL vs Text)
  const [resolvedVoice, resolvedStructure, resolvedContent] = await Promise.all([
    resolveContent(voiceSource),
    resolveContent(structureSource),
    resolveContent(contentSource),
  ]);

  // 2. Parallel Analyzers
  logger.log('nlp_analysis', 'RefAnalysis: MixAndMatch: Starting parallel analysis of A, B, C...');
  // We now run Deep Analysis on A (Voice) as well to get "Semantic" insights
  const [voiceMicroRes, voiceSemanticRes, structureRes, contentRes] = await Promise.all([
    // A1: Voice Micro-Style (Full Text Analysis)
    extractVoiceProfileFull(resolvedVoice, targetAudience),
    // A2: Voice Semantic/Deep (New - requested by user)
    analyzeReferenceStructure(resolvedVoice, targetAudience),
    // B: Structure (Skeleton & Logic)
    analyzeReferenceStructure(resolvedStructure, targetAudience),
    // C: Content
    (async () => {
      const prompt = promptTemplates.extractOutline({
        content: resolvedContent,
        targetAudience,
        languageInstruction,
      });
      return await aiService.runJson<any>(prompt, 'FLASH', {
        schema: z.object({
          h1Title: z.string(),
          introText: z.string(),
          keyInformationPoints: z.array(z.string()),
          structure: z.array(
            z.object({
              title: z.string(),
              keyFacts: z.array(z.string()).optional(),
            })
          ),
        }),
        promptId: 'mix_match_content_extraction',
      });
    })(),
  ]);

  const voiceMicro = voiceMicroRes.data;
  const voiceSemantic = voiceSemanticRes.data;
  const structureData = structureRes.data;
  const contentData = contentRes.data;

  // MERGE Voice Profile (Micro + Semantic)
  // We prefer Micro for specific sentence features, but Semantic for high-level plan
  const mergedVoiceProfile = {
    ...voiceMicro,
    // Merge General Plans (Deduplicate)
    generalPlan: Array.from(new Set([
      ...(voiceMicro.generalPlan || []),
      ...(voiceSemantic.generalPlan || [])
    ])),
    // Use Semantic conversion plan if Micro is empty, or merge
    conversionPlan: Array.from(new Set([
      ...(voiceMicro.conversionPlan || []),
      ...(voiceSemantic.conversionPlan || [])
    ])),
    // Semantic analysis might find better tone descriptions
    toneSensation: voiceMicro.toneSensation || voiceSemantic.toneSensation,
    humanWritingVoice: voiceMicro.humanWritingVoice || voiceSemantic.humanWritingVoice,
    // Add semantic logic insights from A (if we want to emulate A's logic style)
    // For now, we store them to potentially pass to the UI or advanced generation
    logicStyle: voiceSemantic.structure.map((s: any) => s.logicalFlow).filter(Boolean),
  };

  // 3. Pick a Target Section from B (Structure Source)
  const targetSection =
    structureData.structure.find(
      (s) =>
        !s.title.toLowerCase().includes('introduction') &&
        !s.title.includes('目錄') &&
        !s.title.includes('前言') &&
        ((s.keyFacts?.length || 0) > 0 || (s.subheadings?.length || 0) > 0)
    ) || structureData.structure[0];

  if (!targetSection) {
    throw new Error('No valid structure sections found in the source text.');
  }

  // 4. Gather Content Payload
  const allContentFacts = [
    ...(targetSection.keyFacts || []).map(f => `[Structure Fact] ${f} `),
    ...(contentData.keyInformationPoints || []).map((f: string) => `[New Payload] ${f} `)
  ];

  // --- NEW: NLP Semantic Filtering ---
  // Filter Voice Source (A) keywords by relevance to Structure Target (B) Title
  if (mergedVoiceProfile.keywordPlans && mergedVoiceProfile.keywordPlans.length > 0) {
    try {
      const keywords = mergedVoiceProfile.keywordPlans.map((k: any) => k.word);
      // Embed [Title, ...Keywords]
      const embeddings = await embedTexts([targetSection.title, ...keywords]);

      const titleVec = embeddings[0];
      const keywordVecs = embeddings.slice(1);

      const scoredKeywords = mergedVoiceProfile.keywordPlans.map((k: any, i: number) => {
        const score = cosineSimilarity(titleVec, keywordVecs[i]);
        return { ...k, score };
      });

      // Filter: Keep score > 0.2 (Very loose relevance) and Sort by Score
      // If 0 relevant found, keep top 3 original
      const filtered = scoredKeywords
        .filter((k: any) => k.score > 0.2)
        .sort((a: any, b: any) => b.score - a.score);

      mergedVoiceProfile.keywordPlans = filtered.length > 0 ? filtered : scoredKeywords.slice(0, 5);

      logger.log('nlp_analysis', `RefAnalysis: MixAndMatch: Filtered Keywords: ${scoredKeywords.length} -> ${mergedVoiceProfile.keywordPlans.length}`);
    } catch (err) {
      logger.warn('nlp_analysis', 'RefAnalysis: MixAndMatch: Keyword embedding filtering failed, using original list', { error: err });
    }
  }

  // --- RAG Helpers ---





  // 5. Helper for Generation
  const generateSection = async (
    sectionTitle: string,
    voice: any,
    facts: string[],
    mode: 'ORIGINAL' | 'FULL_A' | 'NO_LOGIC' | 'NO_VIBE' | 'NO_STRATEGY' | 'NO_MECHANICS' | 'NO_DIFFICULTY' | 'NO_MODE' | 'NO_NARRATIVE',
    contextOverride?: string
  ) => {
    const isOriginal = mode === 'ORIGINAL';

    // Feature Toggles based on Mode
    // Voice A Ablations
    const useLogic = !isOriginal && mode !== 'NO_LOGIC';
    const useVibe = !isOriginal && mode !== 'NO_VIBE';
    const useStrategy = !isOriginal && mode !== 'NO_STRATEGY';
    const useMechanics = !isOriginal && mode !== 'NO_MECHANICS';

    // Structure B Ablations
    const useDifficulty = false; // DISABLED globally per user request
    const useWritingMode = mode !== 'NO_MODE';
    const useNarrativePlan = mode !== 'NO_NARRATIVE';

    // Prepare Voice Components
    const logicPrompts = useLogic ? (voice.logicStyle || []).slice(0, 3).map((l: string) => `Preferred Logic Flow: ${l}`) : [];

    const vibePrompts = useVibe ? [
      `Tone: ${voice.toneSensation || 'Neutral'}`,
      `Human Voice: ${voice.humanWritingVoice || 'Natural'}`,
      // Region is usually critical for correct character set, but strictly speaking it's "Vibe". 
      // If we disable Vibe, we might fallback to standard Instruction. 
      // But let's keep region implicit in LanguageInstruction usually. 
      // Explicit prompt:
      ...(voice.regionVoiceDetect ? [`Region Style: ${voice.regionVoiceDetect}`] : [])
    ] : [];

    const strategyPrompts = useStrategy ? [
      ...(voice.entryPoint ? [`Entry Strategy: ${voice.entryPoint}`] : []),
      ...(voice.conversionPlan ? [`Conversion: ${voice.conversionPlan[0]}`] : []),
      ...(voice.generalPlan ? [`General Rule: ${voice.generalPlan[0]}`] : [])
    ] : [];

    const mechanicsPrompts = useMechanics ? [
      ...(voice.sentenceStartFeatures ? [`Sentence Flow: ${voice.sentenceStartFeatures.join(', ')}`] : []),
      ...(voice.sentenceEndFeatures ? [`Sentence Ends: ${voice.sentenceEndFeatures.join(', ')}`] : [])
    ] : [];

    const narrativePlanPrompts = useNarrativePlan ? (targetSection.narrativePlan || []) : [];

    // Prompt Construction
    const promptContext = {
      sectionTitle,
      languageInstruction,
      previousSections: [],
      futureSections: [],

      // Inject Source Context if provided (RAG)
      sourceContext: contextOverride || '',

      // --- Voice Injection ---
      generalPlan: useStrategy ? (voice.generalPlan || []) : [], // Used in context
      humanWritingVoice: '', // DISABLED
      regionVoiceDetect: '', // DISABLED
      toneSensation: '', // DISABLED

      specificPlan: [
        // ...vibePrompts, // DISABLED
        ...(useMechanics ? (voice.sentenceStartFeatures ? [`Sentence Flow: ${voice.sentenceStartFeatures.join(', ')}`] : []) : []),
        ...(useMechanics ? (voice.sentenceEndFeatures ? [`Sentence Ends: ${voice.sentenceEndFeatures.join(', ')}`] : []) : []),
        ...(useStrategy ? (voice.entryPoint ? [`Entry Strategy: ${voice.entryPoint}`] : []) : []),
        ...(useStrategy ? (voice.conversionPlan ? [`Conversion: ${voice.conversionPlan[0]}`] : []) : []),
        ...(useStrategy ? (voice.generalPlan ? [`General Rule: ${voice.generalPlan[0]}`] : []) : []),
        // ...logicPrompts, // DISABLED per user request
        // Structure Flow is always kept as the base "Skeleton" (unless we were ablating structure, but we're ablating Voice A overlay)
        ...(targetSection.logicalFlow ? [`Logical Flow (Base): ${targetSection.logicalFlow}`] : []),
        // Inject Narrative Plan if active
        // Note: targetSection.narrativePlan is usually a list of strings
        ...narrativePlanPrompts,
      ],

      // --- Content Injection ---
      points: facts.map((f) => `[Fact] ${f}`),

      kbInsights: [],
      // NLP Keywords are KEPT in all modes as requested ("Except NLP")
      keywordPlans: voice.keywordPlans || [],

      relevantAuthTerms: [],
      injectionPlan: '',
      articleTitle: structureData.h1Title || `Article about ${targetSection.title}`,
      coreQuestion: targetSection.coreQuestion || `Explain ${targetSection.title}`,
      difficulty: useDifficulty ? (targetSection.difficulty || 'medium') : 'medium', // Fallback to medium if disabled
      writingMode: useWritingMode ? (targetSection.writingMode || 'direct') : 'direct', // Fallback to direct if disabled
      solutionAngles: targetSection.solutionAngles || [],
      avoidContent: [],
      renderMode: 'narrative',
      suppressHints: targetSection.suppress || [],
      augmentHints: targetSection.augment || [],
      subheadings: targetSection.subheadings || [],
      regionReplacements: [],
      replacementRules: [],
      logicalFlow: targetSection.logicalFlow,
      coreFocus: useNarrativePlan ? targetSection.coreFocus : '', // Disable Core Focus if Narrative Plan is off
    };

    return await aiService.runJson<{
      content: string;
      usedPoints: string[];
      injectedCount: number;
      comment: string;
    }>(promptTemplates.sectionContent(promptContext), 'FLASH', {
      schema: z.object({
        content: z.string(),
        usedPoints: z.array(z.string()),
        injectedCount: z.number(),
        comment: z.string(),
      }),
      promptId: isOriginal ? 'mix_match_gen_original' : `mix_match_gen_${mode.toLowerCase()}`,
    });
  };

  // 6. Run Batch Generation
  logger.log('writing_content', 'RefAnalysis: MixAndMatch: Starting Batch Ablation Generation...');

  // Pre-calculate RAG Contexts for ORIGINAL Mode
  const [agenticContext, vectorContext] = await Promise.all([
    extractAgenticContext(resolvedStructure, targetSection.title),
    extractVectorContext(resolvedStructure, targetSection.title)
  ]);

  // Use Vector (Chunk) as DEFAULT context for all generated sections as per user request
  const defaultContext = vectorContext;

  const [
    fullRes,
    noLogicRes,
    noVibeRes,
    noStrategyRes,
    noMechanicsRes,
    originalRes,
    // New Structure Ablations
    noDifficultyRes,
    noModeRes,
    noNarrativeRes,
    // RAG Variants
    ragFullRes,
    ragAgenticRes,
    ragVectorRes
  ] = await Promise.all([
    // Voice A Ablations (Using Default Context)
    generateSection(targetSection.title, mergedVoiceProfile, allContentFacts, 'FULL_A', defaultContext), // Default to Agentic for Main
    generateSection(targetSection.title, mergedVoiceProfile, allContentFacts, 'NO_LOGIC', defaultContext),
    generateSection(targetSection.title, mergedVoiceProfile, allContentFacts, 'NO_VIBE', defaultContext),
    generateSection(targetSection.title, mergedVoiceProfile, allContentFacts, 'NO_STRATEGY', defaultContext),
    generateSection(targetSection.title, mergedVoiceProfile, allContentFacts, 'NO_MECHANICS', defaultContext),
    generateSection(targetSection.title, structureData, allContentFacts, 'ORIGINAL', defaultContext), // Default Original uses Agentic too

    // Structure B Ablations (Using Default Context + Full Voice)
    // Wait, are these Voice A ablations or Source B ablations? 
    // "Voice Source If close Difficulty" implies we modify the Voice A Generation parameters.
    // Difficulty comes from Structure B usually. 
    // Let's assume we want to apply FULL Voice A but disable the specific Structure B parameter.
    generateSection(targetSection.title, mergedVoiceProfile, allContentFacts, 'NO_DIFFICULTY', defaultContext),
    generateSection(targetSection.title, mergedVoiceProfile, allContentFacts, 'NO_MODE', defaultContext),
    generateSection(targetSection.title, mergedVoiceProfile, allContentFacts, 'NO_NARRATIVE', defaultContext),

    // RAG Strategy Tests (On Original Voice)
    generateSection(targetSection.title, structureData, allContentFacts, 'ORIGINAL', resolvedStructure), // Full Text
    generateSection(targetSection.title, structureData, allContentFacts, 'ORIGINAL', agenticContext),   // Agentic (Redundant but explicit for tab)
    generateSection(targetSection.title, structureData, allContentFacts, 'ORIGINAL', vectorContext),    // Vector Top 3
  ]);

  const finalResult = {
    voiceProfile: mergedVoiceProfile,
    structure: structureData,
    targetSection,
    contentSourceData: contentData,
    generatedContent: fullRes.data,
    originalVoiceContent: originalRes.data,
    variations: [
      { id: 'full', label: 'FULL (A+B+C)', data: fullRes.data },
      { id: 'no_logic', label: '-Logic', data: noLogicRes.data },
      { id: 'no_vibe', label: '-Vibe', data: noVibeRes.data },
      { id: 'no_strategy', label: '-Strategy', data: noStrategyRes.data },
      { id: 'no_mechanics', label: '-Mechanics', data: noMechanicsRes.data },
      { id: 'original', label: 'Original (B Only)', data: originalRes.data },
      { id: 'no_difficulty', label: '-Difficulty (B)', data: noDifficultyRes.data },
      { id: 'no_mode', label: '-Mode (B)', data: noModeRes.data },
      { id: 'no_narrative', label: '-Narrative (B)', data: noNarrativeRes.data },
      { id: 'rag_full', label: 'RAG: Full Text', data: ragFullRes.data },
      { id: 'rag_agentic', label: 'RAG: Agentic', data: ragAgenticRes.data },
      { id: 'rag_vector', label: 'RAG: Vector', data: ragVectorRes.data },
    ],
    duration: Date.now() - startTs,
  };

  logger.log('nlp_analysis', `RefAnalysis: MixAndMatch: Batch Finished. Variations generated: ${finalResult.variations.length}`);

  return finalResult;
};
