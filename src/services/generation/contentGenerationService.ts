import { z } from 'zod';
import {
  ArticleConfig,
  FrequentWordsPlacementAnalysis,
  AuthorityAnalysis,
  ServiceResponse,
  TokenUsage,
  CostBreakdown,
  ProductBrief,
  ProblemProductMapping,
  SectionGenerationResult,
  TargetAudience,
  ReferenceAnalysis,
  SectionAnalysis,
  SectionContext,
} from '../../types';
import { calculateCost, getLanguageInstruction } from '../adapters/promptService';
import { filterSectionContext } from '../adapters/contextFilterService';
import { promptTemplates } from '../adapters/promptTemplates';
import { MODEL, SEMANTIC_KEYWORD_LIMIT } from '../../config/constants';
import { aiService } from '../adapters/aiService';
import { normalizeMarkdown } from '../../utils/parsingUtils';
import { marked } from 'marked';
import { sectionSchema } from '../../schemas/sectionSchema';

// Helper to determine injection strategy for the current section
const getSectionInjectionPlan = (
  sectionTitle: string,
  refAnalysis: ReferenceAnalysis | undefined,
  productMapping: ProblemProductMapping[] = [],
  productBrief?: ProductBrief,
  currentInjectedCount: number = 0,
  isLastSections: boolean = false
): string => {
  if (!productBrief || !productBrief.productName) return '';

  const forceInjection = isLastSections && currentInjectedCount <= 2;
  const titleLower = sectionTitle.toLowerCase();
  const isSolutionSection =
    titleLower.includes('solution') ||
    titleLower.includes('benefit') ||
    titleLower.includes('guide') ||
    titleLower.includes('how');

  const relevantMappings = productMapping.filter((m) =>
    m.relevanceKeywords.some((kw) => titleLower.includes(kw.toLowerCase()))
  );

  return promptTemplates.sectionInjectionPlan({
    productBrief: productBrief as any,
    competitorBrands: refAnalysis?.competitorBrands || [],
    competitorProducts: refAnalysis?.competitorProducts || [],
    replacementRules: refAnalysis?.replacementRules || [],
    currentInjectedCount,
    isLastSections,
    relevantMappings,
    forceInjection,
    isSolutionSection,
    fallbackMappings: productMapping.slice(0, 2),
  });
};

// Demote or strip H1/H2 headings from model output to avoid duplicate section titles.
const normalizeSectionContent = (content: string): string => {
  let normalized = content || '';
  normalized = normalized.replace(/^##\s+/gm, '### '); // Demote H2 -> H3
  normalized = normalized.replace(/^#\s+/gm, '### '); // Demote H1 -> H3
  normalized = normalized.replace(/<h1>(.*?)<\/h1>/gi, '### $1');
  normalized = normalized.replace(/<h2>(.*?)<\/h2>/gi, '### $1');
  return normalizeMarkdown(normalized);
};

/**
 * Prepares the prompt and context for generating a section.
 * Extracted from generateSectionContent to support streaming.
 */
export const prepareSectionPrompt = async (ctx: SectionContext) => {
  const {
    config,
    sectionTitle,
    specificPlan,
    generalPlan,
    keywordPlans,
    previousSections,
    futureSections,
    authorityAnalysis,
    keyInfoPoints,
    sectionMeta
  } = ctx;

  const isLastSections = futureSections.length <= 1;
  const keywordPlansForPrompt = keywordPlans.slice(0, SEMANTIC_KEYWORD_LIMIT);

  // RAG: Filter context to reduce token usage
  const contextFilter = await filterSectionContext(
    sectionTitle,
    keyInfoPoints,
    authorityAnalysis?.relevantTerms || [],
    config.brandKnowledge, // Knowledge Base
    config.referenceContent, // NEW: RAG Source
    config.targetAudience
  );

  const sectionKeyFacts = Array.isArray((sectionMeta as any).keyFacts)
    ? (sectionMeta as any).keyFacts
    : [];
  const augmentFacts = Array.isArray((sectionMeta as any).augment)
    ? (sectionMeta as any).augment
    : [];
  const relevantKeyPoints = Array.from(
    new Set([...sectionKeyFacts, ...augmentFacts, ...contextFilter.data.filteredPoints])
  );
  const relevantAuthTerms = contextFilter.data.filteredAuthTerms;
  const kbInsights = contextFilter.data.knowledgeInsights;

  // Use all relevant points; no frequency cap so checklists can stay intact.
  const pointsAvailableForThisSection = relevantKeyPoints;

  const { coreQuestion, difficulty, writingMode, solutionAngles } = sectionMeta || {};

  // Inject Product/Commercial Strategy if brief exists
  const injectionPlan = getSectionInjectionPlan(
    sectionTitle,
    config.referenceAnalysis,
    config.productMapping,
    config.productBrief,
    0, // Default to 0 for initial plan
    isLastSections
  );

  const languageInstruction = getLanguageInstruction(config.targetAudience);
  const suppressHints = Array.isArray((sectionMeta as any).suppress)
    ? (sectionMeta as any).suppress
    : [];

  const renderMode = (sectionMeta as any).isChecklist ? 'checklist' : undefined;
  const augmentHints = Array.isArray((sectionMeta as any).augment)
    ? (sectionMeta as any).augment
    : [];
  const subheadings = Array.isArray((sectionMeta as any).subheadings)
    ? (sectionMeta as any).subheadings
    : [];

  const prompt = promptTemplates.sectionContent({
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
    renderMode,
    suppressHints,
    augmentHints,
    subheadings,
    avoidContent: [
      ...futureSections,
      ...previousSections,
      ...relevantKeyPoints.filter((p) => !pointsAvailableForThisSection.includes(p)),
      ...suppressHints,
    ],
    regionReplacements: config.referenceAnalysis?.regionalReplacements,
    humanWritingVoice: config.referenceAnalysis?.humanWritingVoice,
    regionVoiceDetect: config.referenceAnalysis?.regionVoiceDetect,
    replacementRules: config.referenceAnalysis?.replacementRules,
    logicalFlow: (sectionMeta as any).logicalFlow,
    coreFocus: (sectionMeta as any).coreFocus,
  });

  return {
    prompt,
    contextFilter,
    pointsAvailableForThisSection,
    relevantKeyPoints,
    isLastSections,
  };
};

// 3. Generate Single Section
export const generateSectionContent = async (
  ctx: SectionContext
): Promise<ServiceResponse<SectionGenerationResult>> => {
  const startTs = Date.now();

  const {
    prompt,
    contextFilter,
  } = await prepareSectionPrompt(ctx);

  const response = await aiService.runJson<any>(prompt, 'FLASH', {
    schema: sectionSchema,
    promptId: `section_gen_${ctx.sectionTitle.slice(0, 20)}`,
  });


  const payload = response.data || {};
  const rawContent =
    typeof payload.content === 'string' && payload.content.trim().length > 0
      ? payload.content
      : typeof payload.sectionContent === 'string'
        ? payload.sectionContent
        : '';

  const usedPointsSource =
    (Array.isArray(payload.usedPoints) && payload.usedPoints) ||
    (Array.isArray((payload as any).used_points) && (payload as any).used_points) ||
    (Array.isArray((payload as any).pointsUsed) && (payload as any).pointsUsed) ||
    (Array.isArray((payload as any).usedFacts) && (payload as any).usedFacts) ||
    [];
  const usedPoints = Array.isArray(usedPointsSource)
    ? usedPointsSource
      .map((p) => (typeof p === 'string' ? p : String(p || '')).trim())
      .filter(Boolean)
    : [];
  const injectedRaw = payload.injectedCount ?? (payload as any).injected_count ?? 0;
  const injectedCount = typeof injectedRaw === 'number' ? injectedRaw : Number(injectedRaw) || 0;
  const comment = payload.comment || (payload as any).thought || '';

  let finalContent = rawContent;
  let finalUsage = response.usage;
  let finalCost = response.cost;

  const data: SectionGenerationResult = {
    title: ctx.sectionTitle,
    content: rawContent,
    rawContent: rawContent,
    usedPoints,
    injectedCount,
    comment,
  };



  const totalCost = {
    inputCost: response.cost.inputCost + contextFilter.cost.inputCost,
    outputCost: response.cost.outputCost + contextFilter.cost.outputCost,
    totalCost: response.cost.totalCost + contextFilter.cost.totalCost,
  };

  // FIX: Logic Divergence (DRY Violation)
  // We stream raw content to the client in the API route.
  // To match that behavior here, we disable server-side normalization.
  // The Client (SectionStreamer / SectionRenderer) should handle H1->H3 etc.
  // const normalizedContent = normalizeSectionContent(data.content || '');
  const normalizedContent = data.content || ''; // Return RAW

  const totalUsage = {
    inputTokens: response.usage.inputTokens + contextFilter.usage.inputTokens,
    outputTokens: response.usage.outputTokens + contextFilter.usage.outputTokens,
    totalTokens: response.usage.totalTokens + contextFilter.usage.totalTokens,
  };

  const duration = Date.now() - startTs;

  return {
    data: {
      ...data,
      content: normalizedContent,
    },
    usage: totalUsage,
    cost: totalCost,
    duration,
  };
};

// AI Rewriter / Formatter (Small Tool)
export const generateSnippet = async (
  prompt: string,
  targetAudience: TargetAudience,
  config?: any
): Promise<ServiceResponse<string>> => {
  const languageInstruction = getLanguageInstruction(targetAudience);
  const fullPrompt = promptTemplates.snippet({ prompt, languageInstruction });
  const res = await aiService.runText(fullPrompt, 'FLASH', config);
  return { data: res.text, usage: res.usage, cost: res.cost, duration: res.duration };
};

// REBRAND CONTENT (Global Entity Swap)
export const rebrandContent = async (
  currentContent: string,
  productBrief: ProductBrief,
  targetAudience: TargetAudience
): Promise<ServiceResponse<string>> => {
  const languageInstruction = getLanguageInstruction(targetAudience);
  const prompt = promptTemplates.rebrandContent({
    productBrief,
    languageInstruction,
    currentContent,
  });
  const res = await aiService.runText(prompt, 'FLASH');
  return { data: res.text, usage: res.usage, cost: res.cost, duration: res.duration };
};
