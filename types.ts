

export interface KeywordData {
  token: string;
  count: number;
}

export interface KeywordActionPlan {
  word: string;
  snippets: string[]; // The raw context snippets extracted from text
  plan: string[];     // The AI-generated action rules (max 3)
}

export interface SectionAnalysis {
  title: string;
  narrativePlan: string[]; // Specific writing instructions for this specific section
  coreQuestion?: string; // One-sentence core question this section must answer
  difficulty?: 'easy' | 'medium' | 'unclear'; // How hard it is to give a clear answer
  writingMode?: 'direct' | 'multi_solutions'; // Derived from difficulty (easy => direct; others => multi solutions)
  solutionAngles?: string[]; // Distinct solution paths for medium/unclear
  subheadings?: string[]; // Exact H3s (if any) under this H2 from the reference text
}

export interface ReferenceAnalysis {
  structure: SectionAnalysis[]; // Detailed structure with plans
  generalPlan: string[];        // Global style rules
  conversionPlan: string[];     // NEW: How the author presents value/benefits
  keyInformationPoints: string[]; // General High density facts/concepts
  brandExclusivePoints: string[]; // NEW: Unique Selling Points / Brand specific claims
  replacementRules?: string[];   // Deprecated: Old generic rules
  competitorBrands?: string[];   // Specific brand names to nuke
  competitorProducts?: string[]; // Specific product names to swap
}

export interface AuthorityAnalysis {
  relevantTerms: string[];      // Filtered high-relevance terms
  combinations: string[];       // 3 Strategic ways to combine these terms
}

export type TargetAudience = 'zh-TW' | 'zh-HK' | 'zh-MY';

// NEW: Product / CTA Configuration
export interface ProductBrief {
  brandName: string;   // The Entity (e.g., "TopGlow")
  productName: string; // The Full Item (e.g., "TopGlow 755nm Ultra Pulse")
  usp: string;
  ctaLink: string;
  targetPainPoints?: string; // Optional user input
}

// NEW: AI-Generated Mapping for Level 1 Injection
export interface ProblemProductMapping {
  painPoint: string;
  productFeature: string;
  relevanceKeywords: string[]; // Keywords to match against section titles
}

export interface SavedProfile {
  id: string;
  name: string;
  websiteType: string;
  authorityTerms: string;
  brandKnowledge?: string;
  targetAudience: TargetAudience;
  useRag?: boolean;
  productBrief?: ProductBrief; // Deprecated in UI, kept for backward compat
  productRawText?: string;     // NEW: The single source of truth for UI
}

export interface ScrapedImage {
  id?: string;
  url?: string; // NEW: Capture source URL for analysis/display
  altText: string;
  preContext: string;
  postContext: string;
  aiDescription?: string; // NEW: Stores the understanding from Gemini
  ignored?: boolean; // NEW: Allow UI to ignore individual images
}

export interface ImageAssetPlan {
  id: string;
  originalAlt?: string;
  category?: string;
  generatedPrompt: string;
  insertAfter: string;
  status: 'idle' | 'generating' | 'done' | 'error';
  url?: string;
}

export interface ArticleConfig {
  title: string;
  referenceContent: string;
  sampleOutline?: string;
  websiteType?: string;
  authorityTerms?: string;
  brandKnowledge?: string;
  targetAudience: TargetAudience;
  scrapedImages?: ScrapedImage[];
  useRag?: boolean;
  autoImagePlan?: boolean;

  productBrief?: ProductBrief; // Structured data (Passed to generator)
  productRawText?: string;     // Raw input (Passed from UI)

  // Derived data passed to the generator
  keywordPlans?: KeywordActionPlan[];
  referenceAnalysis?: ReferenceAnalysis;
  authorityAnalysis?: AuthorityAnalysis;
  productMapping?: ProblemProductMapping[]; // NEW: The logic map

  // NEW: The Visual Identity
  visualStyle?: string;
}

export type GenerationStatus = 'idle' | 'analyzing' | 'analysis_ready' | 'streaming' | 'completed' | 'error';

export type GenerationStep = 'idle' | 'fetching_url' | 'parsing_product' | 'nlp_analysis' | 'extracting_structure' | 'analyzing_visuals' | 'analyzing_authority' | 'planning_keywords' | 'mapping_product' | 'writing_content' | 'refining_headings' | 'generating_images' | 'finalizing';

// --- Cost Tracking Types ---

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface CostBreakdown {
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface ServiceResponse<T> {
  data: T;
  usage: TokenUsage;
  cost: CostBreakdown;
  duration?: number; // NEW: Execution time in ms
}

export interface ContentScore {
  value: number; // 0-100
  label: string; // Poor, Good, Excellent
  color: string; // tailwind color class
}

// NEW: Tracking injection in individual sections
export interface SectionGenerationResult {
  content: string;
  usedPoints: string[];
  injectedCount: number; // Number of times product was mentioned
}

export interface HeadingOption {
  text: string;
  reason?: string;
  score?: number;
}

export interface HeadingH3 {
  h3_before: string;
  h3_after: string;
  h3_reason?: string;
}

export interface HeadingResult {
  before: string;
  after: string;
  h2_before: string;
  h2_after: string;
  h2_reason?: string;
  h2_options?: HeadingOption[];
  h3?: HeadingH3[];
  needs_manual?: boolean;
}
