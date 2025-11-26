import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { InputForm } from './components/InputForm';
import { Preview } from './components/Preview';
import { SeoSidebar } from './components/SeoSidebar';
import { Changelog } from './components/Changelog'; // Import Changelog
import { generateSectionContent } from './services/geminiService';
import { analyzeText } from './services/nlpService';
import { extractKeywordActionPlans, analyzeReferenceStructure, analyzeAuthorityTerms } from './services/extractionService';
import { generateProblemProductMapping, parseProductContext } from './services/productService';
import { analyzeImageWithAI, analyzeVisualStyle } from './services/imageService';
import { ArticleConfig, GenerationStatus, KeywordActionPlan, ReferenceAnalysis, AuthorityAnalysis, TargetAudience, CostBreakdown, TokenUsage, GenerationStep, SavedProfile, ContentScore, ScrapedImage, ProblemProductMapping, ProductBrief } from './types';

const STORAGE_KEY_CONTENT = 'pro_content_writer_article_content_v1';
const STORAGE_KEY_ANALYSIS = 'pro_content_writer_analysis_data_v1';
const STORAGE_KEY_COVERED_POINTS = 'pro_content_writer_covered_points_v1';
const STORAGE_KEY_TARGET_AUDIENCE = 'pro_content_writer_target_audience_v1';
const STORAGE_KEY_STATS = 'pro_content_writer_stats_v1';
const PROFILES_KEY = 'pro_content_writer_profiles_v1';
const STORAGE_KEY_SCRAPED_IMAGES = 'pro_content_writer_scraped_images_v1';
const STORAGE_KEY_BRAND_KNOWLEDGE = 'pro_content_writer_brand_knowledge_v1';

const App: React.FC = () => {
  // Lazy Initialization
  const [content, setContent] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_CONTENT) || '';
    }
    return '';
  });

  const [status, setStatus] = useState<GenerationStatus>(() => {
    if (typeof window !== 'undefined') {
        // Reset status to idle on load if previously analyzing/streaming to prevent stuck state
        const savedContent = localStorage.getItem(STORAGE_KEY_CONTENT);
        return savedContent ? 'completed' : 'idle';
    }
    return 'idle';
  });
  
  const [generationStep, setGenerationStep] = useState<GenerationStep>('idle');
  const [error, setError] = useState<string | null>(null);
  
  // Zen Mode State
  const [showInput, setShowInput] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showChangelog, setShowChangelog] = useState(false); // New Changelog State

  // Lifted Input State for interactions
  const [inputType, setInputType] = useState<'text' | 'url'>('url');

  // Saved Profiles (Lifted State for Dashboard)
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem(PROFILES_KEY);
          return saved ? JSON.parse(saved) : [];
      }
      return [];
  });
  const [activeProfile, setActiveProfile] = useState<SavedProfile | null>(null);

  // Content Score (Variable Reward)
  const [contentScore, setContentScore] = useState<ContentScore>({ value: 0, label: 'Start Writing', color: 'text-gray-400' });

  // Session Stats
  const [sessionCost, setSessionCost] = useState<number>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY_STATS);
        if (saved) {
            try { return JSON.parse(saved).cost || 0; } catch (e) { return 0; }
        }
    }
    return 0;
  });

  const [sessionTokens, setSessionTokens] = useState<number>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY_STATS);
        if (saved) {
            try { return JSON.parse(saved).tokens || 0; } catch (e) { return 0; }
        }
    }
    return 0;
  });

  // Context Data
  const [analysisData, setAnalysisData] = useState<{
    keywordPlans: KeywordActionPlan[];
    refAnalysis: ReferenceAnalysis | null;
    authAnalysis: AuthorityAnalysis | null;
  }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_ANALYSIS);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return { keywordPlans: [], refAnalysis: null, authAnalysis: null };
  });

  const [keywordPlans, setKeywordPlans] = useState<KeywordActionPlan[]>(() => analysisData.keywordPlans);
  const [refAnalysis, setRefAnalysis] = useState<ReferenceAnalysis | null>(() => analysisData.refAnalysis);
  const [authAnalysis, setAuthAnalysis] = useState<AuthorityAnalysis | null>(() => analysisData.authAnalysis);
  const [scrapedImages, setScrapedImages] = useState<ScrapedImage[]>(() => {
      if (typeof window !== 'undefined') {
          const saved = localStorage.getItem(STORAGE_KEY_SCRAPED_IMAGES);
          return saved ? JSON.parse(saved) : [];
      }
      return [];
  });
  
  // NEW: Global Visual Style
  const [visualStyle, setVisualStyle] = useState<string>('');
  
  // BRAND KNOWLEDGE (Global State, managed in Sidebar now)
  const [brandKnowledge, setBrandKnowledge] = useState<string>(() => {
      if (typeof window !== 'undefined') {
          return localStorage.getItem(STORAGE_KEY_BRAND_KNOWLEDGE) || '';
      }
      return '';
  });

  const [coveredPoints, setCoveredPoints] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_COVERED_POINTS);
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { return []; }
      }
    }
    return [];
  });
  
  const [targetAudience, setTargetAudience] = useState<TargetAudience>(() => {
      if (typeof window !== 'undefined') {
          return (localStorage.getItem(STORAGE_KEY_TARGET_AUDIENCE) as TargetAudience) || 'zh-TW';
      }
      return 'zh-TW';
  });

  // NEW: State for Product Mapping and Brief
  const [productMapping, setProductMapping] = useState<ProblemProductMapping[]>([]);
  const [activeProductBrief, setActiveProductBrief] = useState<ProductBrief | undefined>(undefined);

  const shouldStopRef = useRef(false);

  // --- Effects ---

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONTENT, content);
  }, [content]);

  useEffect(() => {
    const data = { keywordPlans, refAnalysis, authAnalysis };
    localStorage.setItem(STORAGE_KEY_ANALYSIS, JSON.stringify(data));
  }, [keywordPlans, refAnalysis, authAnalysis]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COVERED_POINTS, JSON.stringify(coveredPoints));
  }, [coveredPoints]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SCRAPED_IMAGES, JSON.stringify(scrapedImages));
  }, [scrapedImages]);
  
  useEffect(() => {
      localStorage.setItem(STORAGE_KEY_TARGET_AUDIENCE, targetAudience);
  }, [targetAudience]);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify({ cost: sessionCost, tokens: sessionTokens }));
  }, [sessionCost, sessionTokens]);

  useEffect(() => {
      localStorage.setItem(PROFILES_KEY, JSON.stringify(savedProfiles));
  }, [savedProfiles]);

  useEffect(() => {
      localStorage.setItem(STORAGE_KEY_BRAND_KNOWLEDGE, brandKnowledge);
  }, [brandKnowledge]);

  // --- Score Calculation (Hooked: Variable Reward) ---
  useEffect(() => {
      if (!content || status === 'idle') {
          setContentScore({ value: 0, label: 'Start Writing', color: 'text-gray-300' });
          return;
      }

      let score = 0;
      let totalFactors = 0;

      // Factor 1: Keyword Usage (50 points)
      if (keywordPlans.length > 0) {
          const usedKeywords = keywordPlans.filter(k => content.toLowerCase().includes(k.word.toLowerCase()));
          const keywordRatio = usedKeywords.length / keywordPlans.length;
          score += keywordRatio * 50;
          totalFactors++;
      }

      // Factor 2: Key Points Coverage (50 points)
      if (refAnalysis?.keyInformationPoints && refAnalysis.keyInformationPoints.length > 0) {
          const pointRatio = coveredPoints.length / refAnalysis.keyInformationPoints.length;
          score += pointRatio * 50;
          totalFactors++;
      } else {
          // If no key points tracked, give full points for this section to not penalize
          score += 50; 
      }
      
      // Normalize if no keywords extracted
      if (keywordPlans.length === 0) score = score * 2; 

      score = Math.min(100, Math.round(score));

      let label = 'Needs Work';
      let color = 'text-red-500';
      if (score >= 80) {
          label = 'Excellent';
          color = 'text-emerald-500';
      } else if (score >= 50) {
          label = 'Good';
          color = 'text-amber-500';
      }

      setContentScore({ value: score, label, color });

  }, [content, keywordPlans, coveredPoints, refAnalysis, status]);


  // --- Handlers ---

  const addCost = useCallback((cost: CostBreakdown, usage: TokenUsage) => {
      setSessionCost(prev => prev + cost.totalCost);
      setSessionTokens(prev => prev + usage.totalTokens);
  }, []);

  const handleStop = useCallback(() => {
    shouldStopRef.current = true;
    setStatus('completed');
    setGenerationStep('idle');
  }, []);

  const handleLoadProfile = async (profile: SavedProfile) => {
      setActiveProfile(profile);
      setTargetAudience(profile.targetAudience);
      setBrandKnowledge(profile.brandKnowledge || '');
      
      // Parse product brief from profile immediately to enable Rebrand button even without generating
      if (profile.productRawText) {
          const res = await parseProductContext(profile.productRawText);
          setActiveProductBrief(res.data);
      }
  };

  const handleGenerate = useCallback(async (config: ArticleConfig) => {
    shouldStopRef.current = false;
    setContent('');
    setError(null);
    setKeywordPlans([]);
    setRefAnalysis(null);
    setAuthAnalysis(null);
    setCoveredPoints([]);
    setVisualStyle(''); // Reset style
    
    // Initialize scraped images (without AI analysis first)
    const initialImages = config.scrapedImages || [];
    setScrapedImages(initialImages); 

    setTargetAudience(config.targetAudience);
    setProductMapping([]); // Reset Mapping
    setActiveProductBrief(undefined);
    setSessionCost(0);
    setSessionTokens(0);
    
    // Inject global Brand Knowledge into config
    const fullConfig = {
        ...config,
        brandKnowledge: brandKnowledge 
    };
    
    // Zen Mode: Reset layout
    setShowInput(true);
    setShowSidebar(true);

    try {
      setStatus('analyzing');
      
      // --- ASYNC OPTIMIZATION: Define Parallel Tasks ---
      
      // Task 1: Product Context
      const productTask = async (): Promise<{ brief?: ProductBrief, mapping: ProblemProductMapping[] }> => {
          let parsedProductBrief: ProductBrief | undefined = config.productBrief;
          let generatedMapping: ProblemProductMapping[] = [];

          if (!parsedProductBrief && config.productRawText && config.productRawText.length > 5) {
              if (shouldStopRef.current) return { mapping: [] };
              setGenerationStep('parsing_product');
              const parseRes = await parseProductContext(config.productRawText);
              console.log(`[Timer] Product Context Parse: ${parseRes.duration}ms`);
              parsedProductBrief = parseRes.data;
              addCost(parseRes.cost, parseRes.usage);
          }
          
          if (parsedProductBrief && parsedProductBrief.productName) {
               if (shouldStopRef.current) return { brief: parsedProductBrief, mapping: [] };
               setGenerationStep('mapping_product');
               const mapRes = await generateProblemProductMapping(parsedProductBrief, fullConfig.targetAudience);
               console.log(`[Timer] Product Mapping: ${mapRes.duration}ms`);
               generatedMapping = mapRes.data;
               setProductMapping(generatedMapping);
               addCost(mapRes.cost, mapRes.usage);
          }
          
          setActiveProductBrief(parsedProductBrief);
          return { brief: parsedProductBrief, mapping: generatedMapping };
      };

      // Task 2: NLP & Keyword Planning
      const keywordTask = async () => {
          if (shouldStopRef.current) return;
          setGenerationStep('nlp_analysis');
          const keywords = await analyzeText(fullConfig.referenceContent);
          
          if (keywords.length > 0 && !shouldStopRef.current) {
              setGenerationStep('planning_keywords');
              try {
                 const planRes = await extractKeywordActionPlans(fullConfig.referenceContent, keywords, fullConfig.targetAudience);
                 console.log(`[Timer] Keyword Action Plan: ${planRes.duration}ms`);
                 setKeywordPlans(planRes.data);
                 addCost(planRes.cost, planRes.usage);
              } catch (e) {
                 console.warn("Action Plan extraction failed", e);
              }
          }
      };

      // Task 3: Structure & Authority
      const structureTask = async () => {
          if (shouldStopRef.current) return;
          setGenerationStep('extracting_structure');
          const structPromise = analyzeReferenceStructure(fullConfig.referenceContent, fullConfig.targetAudience);
          const authPromise = analyzeAuthorityTerms(
                  fullConfig.authorityTerms || '', 
                  fullConfig.title, 
                  fullConfig.websiteType || 'General Professional Website',
                  fullConfig.targetAudience
          );

          const [structRes, authRes] = await Promise.all([structPromise, authPromise]);
          console.log(`[Timer] Structure Analysis: ${structRes.duration}ms`);
          console.log(`[Timer] Authority Analysis: ${authRes.duration}ms`);

          addCost(structRes.cost, structRes.usage);
          addCost(authRes.cost, authRes.usage);
          
          setRefAnalysis(structRes.data);
          setAuthAnalysis(authRes.data);
          
          return { structRes, authRes };
      };

      // Task 4: Image Analysis & Visual Style (Sequential within task, Parallel with others)
      const visualTask = async () => {
          if (shouldStopRef.current) return;
          setGenerationStep('analyzing_visuals');

          // 1. Analyze specific images (Top 5)
          const imagesToAnalyze = initialImages.slice(0, 5); 
          let analyzedImages = [...initialImages];

          if (imagesToAnalyze.length > 0) {
              for (let i = 0; i < imagesToAnalyze.length; i++) {
                  if (shouldStopRef.current) break;
                  const img = imagesToAnalyze[i];
                  if (img.url) {
                      try {
                          const res = await analyzeImageWithAI(img.url);
                          console.log(`[Timer] Image Analysis (${i}): ${res.duration}ms`);
                          analyzedImages[i] = { ...analyzedImages[i], aiDescription: res.data };
                          addCost(res.cost, res.usage);
                      } catch (e) {
                          console.warn(`Failed to analyze image ${img.url}`, e);
                      }
                  }
              }
              setScrapedImages(analyzedImages);
          }

          // 2. Extract GLOBAL VISUAL IDENTITY (The "Brand Asset" Look)
          try {
             const styleRes = await analyzeVisualStyle(analyzedImages, fullConfig.websiteType || "Modern Business");
             console.log(`[Timer] Visual Style Extraction: ${styleRes.duration}ms`);
             setVisualStyle(styleRes.data);
             addCost(styleRes.cost, styleRes.usage);
             console.log("Extracted Visual Style:", styleRes.data);
          } catch (e) {
             console.warn("Failed to extract visual style", e);
          }
      };

      // --- EXECUTE PARALLEL ---
      
      const [productResult, _, structureResult, __] = await Promise.all([
          productTask(),
          keywordTask(),
          structureTask(),
          visualTask() 
      ]);

      if (shouldStopRef.current) return;

      // --- PREPARE WRITING LOOP ---
      
      const parsedProductBrief = productResult.brief;
      const productMappingData = productResult.mapping; 
      const refAnalysisData = structureResult?.structRes.data;
      const authAnalysisData = structureResult?.authRes.data;

      let sectionsToGenerate: { title: string; specificPlan?: string[] }[] = [];
      let isUsingCustomOutline = false;

      if (fullConfig.sampleOutline && fullConfig.sampleOutline.trim().length > 0) {
        const lines = fullConfig.sampleOutline.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        sectionsToGenerate = lines.map(title => ({ title }));
        isUsingCustomOutline = true;
      } else if (refAnalysisData?.structure && refAnalysisData.structure.length > 0) {
        sectionsToGenerate = refAnalysisData.structure;
        isUsingCustomOutline = false;
      } else {
        sectionsToGenerate = [
            { title: "Introduction" },
            { title: "Core Concepts" },
            { title: "Benefits" },
            { title: "Applications" },
            { title: "Conclusion" }
        ];
        isUsingCustomOutline = false;
      }

      setStatus('streaming');
      setGenerationStep('writing_content');
      setShowInput(false); 

      const sectionResults: string[] = new Array(sectionsToGenerate.length).fill("");
      const allKeyPoints = refAnalysisData?.keyInformationPoints || [];
      
      // Used to track points accumulated over sections
      let currentCoveredPoints: string[] = [];
      let totalInjectedCount = 0;
      
      const generatorConfig = {
          ...fullConfig,
          productBrief: parsedProductBrief, 
          referenceAnalysis: refAnalysisData, 
          authorityAnalysis: authAnalysisData,
      };

      // --- PARALLEL EXECUTION (TURBO MODE) ---
      if (config.turboMode) {
          // Initialize placeholder content immediately so user sees the Structure
          const outlineSourceLabel = isUsingCustomOutline 
              ? `<span class="text-blue-600">User Custom Outline</span>` 
              : `<span class="text-indigo-600">AI Narrative Structure (Outline)</span>`;

          const headerBanner = `
            <div class="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-xs font-mono text-slate-500">
                <span class="font-bold text-slate-700">📑 Active Blueprint:</span> ${outlineSourceLabel}
            </div>
          `;

          const initialDisplay = headerBanner + sectionsToGenerate.map(s => 
              `<div class="p-4 my-4 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center gap-3 animate-pulse">
                 <div class="w-4 h-4 rounded-full bg-blue-400"></div>
                 <div class="flex flex-col">
                    <span class="text-xs font-bold text-blue-700 uppercase tracking-wider">STRUCTURE LOCKED</span>
                    <span class="text-sm font-medium text-blue-900">⏳ Writing Section: ${s.title}...</span>
                 </div>
               </div>`
          ).join('\n\n');
          setContent(initialDisplay);

          const promises = sectionsToGenerate.map(async (section, i) => {
              if (shouldStopRef.current) return;

              const allTitles = sectionsToGenerate.map(s => s.title);
              // In Turbo Mode, we cannot know the *actual* previous content. 
              // We pass the Outline Plan as context instead.
              const previousTitles = allTitles.slice(0, i);
              const futureTitles = allTitles.slice(i + 1);
              
              const analysisPlan = refAnalysisData?.structure.find(s => s.title === section.title)?.narrativePlan;
              const specificPlan = section.specificPlan || analysisPlan;
              
              const loopConfig = {
                  ...generatorConfig,
                  productMapping: productMappingData
              };

              // Dummy previous content for Turbo Mode (The prompt handles this via "Structure Plan" context)
              const dummyPreviousContent = i > 0 ? [`[Preceding Section: ${previousTitles[i-1]}]`] : [];

              try {
                  const res = await generateSectionContent(
                      loopConfig, 
                      section.title, 
                      specificPlan, 
                      refAnalysisData?.generalPlan, 
                      keywordPlans, 
                      dummyPreviousContent,
                      futureTitles, 
                      authAnalysisData,
                      allKeyPoints,
                      [], // Cannot track covered points in parallel accurately
                      0 // Cannot track injection count in parallel accurately
                  );

                  if (!shouldStopRef.current) {
                      sectionResults[i] = res.data.content;
                      console.log(`[Timer - Turbo] Section '${section.title}': ${res.duration}ms`);
                      
                      // Update main content: Show completed sections content, leave placeholders for others
                      const sectionDisplays = sectionResults.map((c, idx) => {
                          if (c) return c;
                          return `<div class="p-4 my-4 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center gap-3 animate-pulse">
                                     <div class="w-4 h-4 rounded-full bg-blue-400"></div>
                                     <div class="flex flex-col">
                                        <span class="text-xs font-bold text-blue-700 uppercase tracking-wider">STRUCTURE LOCKED</span>
                                        <span class="text-sm font-medium text-blue-900">⏳ Writing Section: ${sectionsToGenerate[idx].title}...</span>
                                     </div>
                                  </div>`;
                      }).join('\n\n');
                      
                      setContent(headerBanner + sectionDisplays);
                      addCost(res.cost, res.usage);

                      // FIX: Update Checklist in Turbo Mode
                      if (res.data.usedPoints && res.data.usedPoints.length > 0) {
                          setCoveredPoints(prev => {
                              // Filter out duplicates just in case
                              const newUnique = res.data.usedPoints.filter(p => !prev.includes(p));
                              return [...prev, ...newUnique];
                          });
                      }
                  }
              } catch (err) {
                  console.error(`Parallel gen error for ${section.title}`, err);
                  sectionResults[i] = `\n\n> **Error generating section: ${section.title}**\n\n`;
                  
                  // Force update on error too
                  const sectionDisplays = sectionResults.map((c, idx) => c || `> ...Waiting: ${sectionsToGenerate[idx].title}`).join('\n\n');
                  setContent(headerBanner + sectionDisplays);
              }
          });

          await Promise.all(promises);
          
          // Remove banner on complete
          if (!shouldStopRef.current) {
               setContent(sectionResults.join('\n\n'));
          }

      } else {
          // --- SEQUENTIAL EXECUTION (STANDARD MODE) ---
          for (let i = 0; i < sectionsToGenerate.length; i++) {
              if (shouldStopRef.current) break;

              const section = sectionsToGenerate[i];
              const allTitles = sectionsToGenerate.map(s => s.title);
              const previousTitles = allTitles.slice(0, i);
              const futureTitles = allTitles.slice(i + 1);

              try {
                  const analysisPlan = refAnalysisData?.structure.find(s => s.title === section.title)?.narrativePlan;
                  const specificPlan = section.specificPlan || analysisPlan;
                  
                  const loopConfig = {
                      ...generatorConfig,
                      productMapping: productMappingData
                  };

                  const res = await generateSectionContent(
                      loopConfig, 
                      section.title, 
                      specificPlan, 
                      refAnalysisData?.generalPlan, 
                      keywordPlans, 
                      previousTitles, // Pass real previous content titles/context
                      futureTitles, 
                      authAnalysisData,
                      allKeyPoints,
                      currentCoveredPoints,
                      totalInjectedCount 
                  );
                  console.log(`[Timer] Section '${section.title}': ${res.duration}ms`);
                  addCost(res.cost, res.usage);

                  if (!shouldStopRef.current) {
                    sectionResults[i] = res.data.content;
                    setContent(sectionResults.filter(s => s).join('\n\n'));
                    
                    if (res.data.usedPoints && res.data.usedPoints.length > 0) {
                        currentCoveredPoints = [...currentCoveredPoints, ...res.data.usedPoints];
                        setCoveredPoints(currentCoveredPoints);
                    }
                    
                    if (res.data.injectedCount) {
                        totalInjectedCount += res.data.injectedCount;
                    }
                  }
              } catch (err) {
                  console.error(`Failed to generate section: ${section.title}`, err);
                  sectionResults[i] = `\n\n> **Error generating section: ${section.title}**\n\n`;
                  setContent(sectionResults.filter(s => s).join('\n\n'));
              }
          }
      }
      
      if (!shouldStopRef.current) {
        setGenerationStep('finalizing');
        setTimeout(() => {
            setStatus('completed');
            setGenerationStep('idle');
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during generation.");
      setStatus('error');
      setGenerationStep('idle');
    }
  }, [addCost, brandKnowledge]); 

  return (
    <Layout>
      <Header 
        sessionCost={sessionCost} 
        sessionTokens={sessionTokens} 
        showInput={showInput}
        showSidebar={showSidebar}
        onToggleInput={() => setShowInput(!showInput)}
        onToggleSidebar={() => setShowSidebar(!showSidebar)}
        onToggleChangelog={() => setShowChangelog(true)} // Toggle function
        contentScore={contentScore}
      />
      
      {/* Changelog Modal */}
      <Changelog isOpen={showChangelog} onClose={() => setShowChangelog(false)} />
      
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-64px)] bg-gray-100 p-4 gap-4">
        
        {showInput && (
            <section className="w-full lg:w-[380px] bg-white rounded-2xl shadow-sm border border-gray-200/60 flex flex-col overflow-hidden z-20 transition-all duration-300">
            <InputForm 
                onGenerate={handleGenerate} 
                isGenerating={status === 'analyzing' || status === 'streaming'}
                currentStep={generationStep}
                onAddCost={addCost}
                savedProfiles={savedProfiles}
                setSavedProfiles={setSavedProfiles}
                activeProfile={activeProfile}
                onSetActiveProfile={setActiveProfile} 
                inputType={inputType}
                setInputType={setInputType}
                brandKnowledge={brandKnowledge} 
            />
            </section>
        )}
        
        <section className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200/60 flex flex-col min-h-0 relative overflow-hidden">
          <Preview 
            content={content} 
            status={status} 
            error={error}
            generationStep={generationStep} 
            onStop={handleStop}
            keyInformationPoints={refAnalysis?.keyInformationPoints || []}
            coveredPoints={coveredPoints}
            targetAudience={targetAudience}
            scrapedImages={scrapedImages}
            visualStyle={visualStyle} // Pass the visual style to editor
            onTogglePoint={(point) => {
                setCoveredPoints(prev => 
                    prev.includes(point) ? prev.filter(p => p !== point) : [...prev, point]
                );
            }}
            onAddCost={addCost}
            savedProfiles={savedProfiles}
            onLoadProfile={handleLoadProfile}
            onRequestUrlMode={() => setInputType('url')}
            productBrief={activeProductBrief} // Pass product info for Rebrand
          />
        </section>

        {showSidebar && (
            <section className="hidden xl:flex w-[380px] bg-white rounded-2xl shadow-sm border border-gray-200/60 flex-col overflow-hidden z-10 transition-all duration-300">
            <SeoSidebar 
                keywordPlans={keywordPlans}
                referenceAnalysis={refAnalysis}
                authorityAnalysis={authAnalysis}
                productMapping={productMapping}
                productBrief={activeProductBrief}
                isLoading={status === 'analyzing'}
                brandKnowledge={brandKnowledge}
                setBrandKnowledge={setBrandKnowledge}
            />
            </section>
        )}
      </main>
    </Layout>
  );
};

export default App;