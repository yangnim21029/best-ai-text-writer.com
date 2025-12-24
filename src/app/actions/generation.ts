'use server';

import { distributeSectionContexts } from '@/services/engine/contextDistributionService';
import { 
  planImagesForArticle, 
  generateImage, 
  generateImagePromptFromContext 
} from '@/services/generation/imageService';
import {
  generateSectionContent,
  generateSnippet,
  smartInjectPoint
} from '@/services/generation/contentGenerationService';
import { refineHeadings } from '@/services/generation/headingRefinerService';
import {
  TargetAudience,
  ScrapedImage,
  ArticleConfig,
  FrequentWordsPlacementAnalysis,
  AuthorityAnalysis,
  SectionAnalysis
} from '@/types';
import { isAuthorizedAction } from './auth';

/**
 * Server Action to distribute context across sections.
 * This keeps the heavy AI logic and prompts on the server.
 */
export async function distributeContextAction(
  referenceContent: string,
  sections: { title: string }[],
  targetAudience: TargetAudience
) {
  // 1. Security Check
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  // 2. Execution
  try {
    const result = await distributeSectionContexts(
      referenceContent,
      sections,
      targetAudience
    );
    return result;
  } catch (error) {
    console.error('[distributeContextAction] Failed:', error);
    throw error;
  }
}

/**
 * Server Action to plan images for an article.
 */
export async function planImagesAction(
  articleContent: string,
  scrapedImages: ScrapedImage[],
  targetAudience: TargetAudience,
  visualStyle: string = ''
) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  try {
    return await planImagesForArticle(
      articleContent,
      scrapedImages,
      targetAudience,
      visualStyle
    );
  } catch (error) {
    console.error('[planImagesAction] Failed:', error);
    throw error;
  }
}

/**
 * Server Action to generate an image.
 */
export async function generateImageAction(prompt: string) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  try {
    return await generateImage(prompt);
  } catch (error) {
    console.error('[generateImageAction] Failed:', error);
    throw error;
  }
}

/**
 * Server Action to generate a prompt for an image based on context.
 */
export async function generateImagePromptFromContextAction(
  contextText: string,
  targetAudience: TargetAudience,
  visualStyle: string = '',
  modelAppearance: string = ''
) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  try {
    return await generateImagePromptFromContext(
      contextText,
      targetAudience,
      visualStyle,
      modelAppearance
    );
  } catch (error) {
    console.error('[generateImagePromptFromContextAction] Failed:', error);
    throw error;
  }
}

/**
 * Server Action to generate content for a single section.
 */
export async function generateSectionContentAction(
  config: ArticleConfig,
  sectionTitle: string,
  specificPlan: string[] | undefined,
  generalPlan: string[] | undefined,
  keywordPlans: FrequentWordsPlacementAnalysis[],
  previousSections: string[] = [],
  futureSections: string[] = [],
  authorityAnalysis: AuthorityAnalysis | null = null,
  keyInfoPoints: string[] = [],
  currentCoveredPointsHistory: string[] = [],
  currentInjectedCount: number = 0,
  sectionMeta: Partial<SectionAnalysis> = {}
) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  try {
    return await generateSectionContent(
      config,
      sectionTitle,
      specificPlan,
      generalPlan,
      keywordPlans,
      previousSections,
      futureSections,
      authorityAnalysis,
      keyInfoPoints,
      currentCoveredPointsHistory,
      currentInjectedCount,
      sectionMeta
    );
  } catch (error) {
    console.error('[generateSectionContentAction] Failed:', error);
    throw error;
  }
}

/**
 * Server Action to generate a small snippet of text.
 */
export async function generateSnippetAction(
  prompt: string,
  targetAudience: TargetAudience,
  config?: any
) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  return await generateSnippet(prompt, targetAudience, config);
}

/**
 * Server Action to inject a point into HTML content intelligently.
 */
export async function smartInjectPointAction(
  fullHtmlContent: string,
  pointToInject: string,
  targetAudience: TargetAudience
) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  return await smartInjectPoint(fullHtmlContent, pointToInject, targetAudience);
}

/**
 * Server Action to refine headings.
 */
export async function refineHeadingsAction(
  articleTitle: string,
  headings: string[],
  targetAudience: TargetAudience
) {
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    throw new Error('Unauthorized');
  }

  return await refineHeadings(articleTitle, headings, targetAudience);
}
