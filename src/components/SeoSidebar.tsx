'use client';

import React, { useMemo, useState } from 'react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useAppStore } from '@/store/useAppStore';
import {
  BrainCircuit,
  Layers,
  Target,
  ShieldCheck,
  Database,
  Zap,
  Hash,
  BarChart2,
  FileSearch,
  ArrowRight,
  Gem,
  Square,
  Languages,
  Copy,
  Check,
  Globe,
  LayoutTemplate,
  RotateCcw,
  Search,
  Loader2,
  ShoppingBag,
  ListChecks,
  Quote,
  MessageSquare,
  AlertCircle,
  Info,
  Bookmark,
  FileText,
} from 'lucide-react';
import {
  GenerationStatus,
  FrequentWordsPlacementAnalysis,
  ReferenceAnalysis,
  AuthorityAnalysis,
  ProblemProductMapping,
  ProductBrief,
  TargetAudience,
  SectionAnalysis,
} from '@/types';
import { mergeMultipleAnalyses } from '@/services/research/referenceAnalysisService';

interface SeoSidebarProps {
  keywordPlans: FrequentWordsPlacementAnalysis[];
  referenceAnalysis: ReferenceAnalysis | null;
  authorityAnalysis: AuthorityAnalysis | null;
  productMapping?: ProblemProductMapping[];
  productBrief?: ProductBrief;
  headingOptimizations?: any[];
  targetAudience: TargetAudience;
  languageInstruction: string;
  isLoading: boolean;
  status: GenerationStatus;
  onStop: () => void;
  displayScale?: number;
  onSearchLocalAlternatives?: () => Promise<void>;
  isSearchingAlternatives?: boolean;
}

export const SeoSidebar: React.FC<SeoSidebarProps> = ({
  keywordPlans: liveKeywords,
  referenceAnalysis: liveRef,
  authorityAnalysis: liveAuth,
  productMapping: liveMapping = [],
  productBrief: liveBrief,
  targetAudience: liveAudience,
  languageInstruction: liveLangInst,
  isLoading,
  status,
  onStop,
  displayScale = 1,
  onSearchLocalAlternatives,
  isSearchingAlternatives = false,
}) => {
  const analysisStore = useAnalysisStore();
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [synthesisInstruction, setSynthesisInstruction] = useState(''); // NEW state

  // Filter selected documents from the store
  const selectedDocs = useMemo(() => {
    return analysisStore.analysisDocuments.filter((d) =>
      analysisStore.selectedDocumentIds.includes(d.id)
    );
  }, [analysisStore.analysisDocuments, analysisStore.selectedDocumentIds]);

  // Determine which document is currently being "viewed" in the sidebar
  const activeDoc = useMemo(() => {
    if (selectedDocs.length === 0) return null;
    if (viewingDocId) {
      const found = selectedDocs.find((d) => d.id === viewingDocId);
      if (found) return found;
    }
    return selectedDocs[0];
  }, [selectedDocs, viewingDocId]);

  const isDisplayingDocument = Boolean(activeDoc);
  const activeDocumentId = activeDoc?.id || null;

  const [copied, setCopied] = useState(false);
  const [showLangDetails, setShowLangDetails] = useState(false);
  const content = useGenerationStore((state) => state.content);
  const lowercaseContent = useMemo(() => (content || '').toLowerCase(), [content]);

  // Determine current data to display
  const currentRefAnalysis = isDisplayingDocument ? activeDoc?.refAnalysis : liveRef;
  const currentKeywords = isDisplayingDocument ? activeDoc?.keywordPlans : liveKeywords;
  const currentAuthAnalysis = isDisplayingDocument ? activeDoc?.authAnalysis : liveAuth;
  const currentProductMapping =
    (isDisplayingDocument ? activeDoc?.productMapping : liveMapping) || [];
  const currentProductBrief = isDisplayingDocument ? activeDoc?.productBrief : liveBrief;
  const currentAudience =
    (isDisplayingDocument ? activeDoc?.targetAudience : liveAudience) || 'zh-TW';
  const currentLangInst =
    (isDisplayingDocument ? activeDoc?.languageInstruction : liveLangInst) || '';
  const currentVisualStyle = isDisplayingDocument
    ? activeDoc?.visualStyle
    : analysisStore.visualStyle;

  const detectedBrands = useMemo(() => {
    return (currentRefAnalysis?.competitorBrands || []).filter(
      (brand) => brand && lowercaseContent.includes(brand.toLowerCase())
    );
  }, [currentRefAnalysis?.competitorBrands, lowercaseContent]);

  const detectedProducts = useMemo(() => {
    return (currentRefAnalysis?.competitorProducts || []).filter(
      (product) => product && lowercaseContent.includes(product.toLowerCase())
    );
  }, [currentRefAnalysis?.competitorProducts, lowercaseContent]);

  const totalDetectedCount = detectedBrands.length + detectedProducts.length;

  const handleCopyLanguage = async () => {
    const text = (currentLangInst || '').trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handleSynthesize = async () => {
    if (selectedDocs.length < 2) return;
    setIsSynthesizing(true);
    try {
      const primaryAudience = selectedDocs[0].targetAudience;
      const validAnalyses = selectedDocs
        .map((d) => d.refAnalysis)
        .filter((r): r is ReferenceAnalysis => !!r);

      if (validAnalyses.length < 2) return;

      // 1. Merge Reference Analysis (Structure, Voice, etc.)
      const mergedRefBase = await mergeMultipleAnalyses(
        validAnalyses,
        primaryAudience,
        synthesisInstruction
      );
      const mergedRef: ReferenceAnalysis = {
        ...mergedRefBase,
        isSynthesis: true,
        sourceCount: selectedDocs.length,
      };

      // 2. Merge Keyword Plans (Union) & Source Content (Concat)
      const keywordMap = new Map<string, FrequentWordsPlacementAnalysis>();
      let mergedContent = '';

      selectedDocs.forEach((doc, idx) => {
        // Keywords
        doc.keywordPlans.forEach((kp) => {
          if (!keywordMap.has(kp.word)) {
            keywordMap.set(kp.word, kp);
          }
        });

        // Content RAG
        if (doc.sourceContent) {
          mergedContent += `\n\n--- Source ${idx + 1} (${doc.title}) ---\n${doc.sourceContent}`;
        }
      });
      const mergedKeywords = Array.from(keywordMap.values());

      // 3. Update Live Store & Switch View
      analysisStore.setRefAnalysis(mergedRef);
      analysisStore.setKeywordPlans(mergedKeywords);
      analysisStore.setReferenceContent(mergedContent.trim()); // NEW: Set RAG Context
      analysisStore.setSelectedDocumentIds([]); // Switch to Live View to see result

      // 4. Open Plan Modal for User Confirmation/Editing
      useAppStore.getState().setShowPlanModal(true);
    } catch (error) {
      console.error('Synthesis failed', error);
      alert('Synthesis failed. Please try again.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  const difficultyBadge = (value?: string) => {
    const map: Record<string, { label: string; bg: string; text: string; border: string }> = {
      easy: {
        label: 'Easy',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-100',
      },
      medium: {
        label: 'Medium',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-100',
      },
      unclear: {
        label: 'Unclear',
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-100',
      },
    };
    const variant = map[value || 'easy'] || map.easy;
    return (
      <span
        className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${variant.bg} ${variant.text} ${variant.border}`}
      >
        {variant.label}
      </span>
    );
  };

  const SectionItem: React.FC<{ section: SectionAnalysis; index: number }> = ({
    section,
    index,
  }) => (
    <div className="relative pl-10 pr-2 group/s pb-4 mb-4 border-b border-gray-50 last:border-0 last:mb-0">
      {/* Index Circle */}
      <div className="absolute left-1 top-0 w-6 h-6 rounded-full bg-white border-2 border-blue-100 text-[11px] font-black text-blue-400 flex items-center justify-center group-hover/s:border-blue-600 group-hover/s:text-blue-600 transition-all z-10 shadow-sm">
        {index + 1}
      </div>

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h5 className="text-[12px] font-black text-gray-800 leading-snug group-hover/s:text-blue-600 transition-colors">
            {section.title}
          </h5>
          <div className="flex items-center gap-1">
            {section.writingMode && (
              <span
                className={`px-2 py-0.5 text-[9px] font-black rounded-full border border-dashed ${section.writingMode === 'direct' ? 'bg-indigo-50 text-blue-600 border-blue-200' : 'bg-purple-50 text-purple-600 border-purple-200'}`}
              >
                {section.writingMode.toUpperCase()}
              </span>
            )}
            {difficultyBadge(section.difficulty)}
          </div>
        </div>

        {section.coreFocus && (
          <div className="flex gap-2 items-start">
            <Bookmark className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
            <p className="text-[10px] font-bold text-blue-600 leading-tight">
              Focus: {section.coreFocus}
            </p>
          </div>
        )}

        {section.logicalFlow && (
          <div className="flex gap-2 items-start mt-1">
            <ArrowRight className="w-3 h-3 text-indigo-300 mt-0.5 shrink-0" />
            <p className="text-[10px] text-gray-500 italic leading-snug">
              Arc: {section.logicalFlow}
            </p>
          </div>
        )}

        {section.coreQuestion && (
          <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 relative group/q">
            <Quote className="absolute -left-1 -top-1 w-3 h-3 text-slate-200 group-hover/q:text-blue-200" />
            <p className="text-[11px] text-gray-600 leading-relaxed italic pr-2 font-medium">
              "{section.coreQuestion}"
            </p>
          </div>
        )}

        {section.solutionAngles && section.solutionAngles.length > 0 && (
          <div className="space-y-1 bg-blue-50/30 p-2 rounded-lg border border-blue-100/50">
            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
              Solution Angles
            </p>
            {section.solutionAngles.map((angle, aIdx) => (
              <div
                key={aIdx}
                className="text-[10px] text-blue-700 flex items-center gap-1.5 font-bold"
              >
                <Zap className="w-2.5 h-2.5 text-blue-300" />
                <span>{angle}</span>
              </div>
            ))}
          </div>
        )}

        {section.narrativePlan && section.narrativePlan.length > 0 && (
          <div className="space-y-1">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              Narrative Action
            </p>
            {section.narrativePlan.map((plan, pIdx) => (
              <div key={pIdx} className="flex gap-2 text-[11px] text-gray-600 leading-relaxed pl-1">
                <span className="text-indigo-300">•</span>
                <span>{plan}</span>
              </div>
            ))}
          </div>
        )}

        {section.uspNotes && section.uspNotes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {section.isChecklist && (
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-black uppercase tracking-tighter">
                LISTICLE MODE
              </span>
            )}
            {section.uspNotes.map((usp, uIdx) => (
              <span
                key={uIdx}
                className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[9px] font-black uppercase tracking-tighter"
              >
                USP: {usp}
              </span>
            ))}
          </div>
        )}

        {/* Subsections with Key Facts (New Granular Mode) */}
        {section.subsections && section.subsections.length > 0 ? (
          <div className="pl-3 border-l-2 border-slate-100 space-y-3 mt-2">
            <p className="text-[9px] font-black text-gray-300 uppercase">H3 Structure & Facts</p>
            {section.subsections.map((sub, sIdx) => (
              <div key={sIdx} className="space-y-1">
                <div className="text-[10px] text-gray-600 flex items-center gap-1.5 font-bold">
                  <ArrowRight className="w-2.5 h-2.5 text-amber-500" />
                  <span>{sub.title}</span>
                </div>
                {sub.keyFacts && sub.keyFacts.length > 0 && (
                  <div className="pl-4 space-y-1">
                    {sub.keyFacts.map((fact, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex gap-1.5 text-[9px] text-gray-500 leading-snug"
                      >
                        <span className="text-emerald-300">•</span>
                        <span className="break-words">{fact}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* Fallback to legacy flat H3s */
          section.subheadings &&
          section.subheadings.length > 0 && (
            <div className="pl-3 border-l-2 border-slate-100 space-y-1 mt-2">
              <p className="text-[9px] font-black text-gray-300 uppercase">Subtitles (H3s)</p>
              {section.subheadings.map((sub, sIdx) => (
                <div
                  key={sIdx}
                  className="text-[10px] text-gray-500 flex items-center gap-1.5 font-medium"
                >
                  <ArrowRight className="w-2.5 h-2.5 text-slate-300" />
                  <span>{sub}</span>
                </div>
              ))}
            </div>
          )
        )}

        {section.keyFacts && section.keyFacts.length > 0 && (
          <div className="bg-emerald-50/30 p-2 rounded-xl border border-emerald-100/50 space-y-1.5 mt-2">
            <div className="flex items-center gap-1.5 mb-1 px-1">
              <ListChecks className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] font-black text-emerald-700 uppercase">
                Grounding Facts
              </span>
            </div>
            {section.keyFacts.map((fact, fIdx) => (
              <div
                key={fIdx}
                className="flex gap-2 text-[10px] text-emerald-800/80 leading-relaxed px-1"
              >
                <span className="text-emerald-300">✓</span>
                <span>{fact}</span>
              </div>
            ))}
          </div>
        )}

        {section.sentenceStartFeatures && section.sentenceStartFeatures.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {section.sentenceStartFeatures.map((feat, idx) => (
              <span
                key={idx}
                className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-bold tracking-tighter"
              >
                Start: {feat}
              </span>
            ))}
          </div>
        )}

        {section.sentenceEndFeatures && section.sentenceEndFeatures.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {section.sentenceEndFeatures.map((feat, idx) => (
              <span
                key={idx}
                className="text-[8px] bg-pink-50 text-pink-500 px-1.5 py-0.5 rounded border border-pink-100 font-bold tracking-tighter"
              >
                End: {feat}
              </span>
            ))}
          </div>
        )}

        {(section.suppress?.length > 0 || section.augment?.length > 0) && (
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-50">
            {section.suppress?.length > 0 && (
              <div className="space-y-1">
                <p className="text-[8px] font-black text-rose-400 uppercase">Suppress</p>
                {section.suppress.map((s, i) => (
                  <div
                    key={i}
                    className="text-[9px] text-rose-600 leading-tight flex gap-1 items-start"
                  >
                    <span className="shrink-0 text-[10px] mt-[-1px]">×</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            )}
            {section.augment?.length > 0 && (
              <div className="space-y-1">
                <p className="text-[8px] font-black text-blue-400 uppercase">Augment</p>
                {section.augment.map((a, i) => (
                  <div
                    key={i}
                    className="text-[9px] text-blue-600 leading-tight flex gap-1 items-start"
                  >
                    <span className="shrink-0 text-[10px] mt-[-1px]">+</span>
                    <span>{a}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const KeywordItem: React.FC<{ kw: FrequentWordsPlacementAnalysis }> = ({ kw }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group/kw">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-black text-gray-800">{kw.word}</span>
        <div className="flex gap-1 flex-wrap">
          {kw.isSentenceStart && (
            <span className="px-1.5 py-0.5 bg-indigo-50 text-blue-600 rounded text-[8px] font-black border border-blue-100">
              START
            </span>
          )}
          {kw.isSentenceEnd && (
            <span className="px-1.5 py-0.5 bg-pink-50 text-pink-600 rounded text-[8px] font-black border border-pink-100">
              END
            </span>
          )}
          {kw.isPrefix && (
            <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black border border-blue-100">
              PREFIX
            </span>
          )}
          {kw.isSuffix && (
            <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black border border-emerald-100">
              SUFFIX
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        {kw.plan?.slice(0, 2).map((p, idx) => (
          <p key={idx} className="text-[10px] text-gray-500 leading-snug flex gap-1.5">
            <Zap className="w-2.5 h-2.5 text-blue-400 mt-0.5 shrink-0" />
            <span>{p}</span>
          </p>
        ))}
      </div>

      {kw.exampleSentence && (
        <div className="mt-2 p-2 bg-indigo-50/30 rounded-lg border border-blue-100/30">
          <p className="text-[9px] font-black text-blue-400 uppercase mb-1">Target Example</p>
          <p className="text-[10px] text-blue-900 leading-snug italic">"{kw.exampleSentence}"</p>
        </div>
      )}

      {kw.snippets && kw.snippets.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-50 overflow-hidden">
          <p className="text-[9px] font-black text-gray-300 uppercase mb-1">Context</p>
          <p className="text-[9px] text-gray-400 italic leading-normal line-clamp-2">
            "...{kw.snippets[0]}..."
          </p>
        </div>
      )}
    </div>
  );

  const EmptyState = () => (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-60">
      <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-6 rotate-3">
        <FileSearch className="w-8 h-8 text-gray-400" />
      </div>
      <h4 className="text-base font-bold text-gray-700 mb-2">No Analysis Data</h4>
      <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">
        Run Step 1 to generate SEO insights, structure, and conversion mappings.
      </p>
    </div>
  );

  return (
    <div
      className="flex flex-col h-full bg-slate-100/50 w-full border-l border-gray-200 font-sans overflow-hidden"
      style={
        displayScale !== 1
          ? {
              transform: `scale(${displayScale})`,
              transformOrigin: 'top left',
              width: `${100 / displayScale}%`,
              height: `${100 / displayScale}%`,
            }
          : undefined
      }
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-20 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-xl ${isDisplayingDocument ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'}`}
            >
              {isDisplayingDocument ? (
                <Database className="w-4 h-4" />
              ) : (
                <BarChart2 className="w-4 h-4" />
              )}
            </div>
            <div>
              <h2 className="text-[12px] font-black text-gray-900 tracking-tight leading-none mb-1">
                {isDisplayingDocument ? 'RECORDED DOCUMENT' : 'LIVE INTELLIGENCE'}
              </h2>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                {isDisplayingDocument ? 'READ ONLY VIEW' : 'REAL-TIME ANALYSIS'}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {isDisplayingDocument && selectedDocs.length > 1 && (
              <div className="flex flex-col gap-2 p-2 bg-indigo-50/50 rounded-xl border border-blue-100">
                <div className="flex items-center gap-1.5 px-1">
                  <Zap className="w-3 h-3 text-blue-500" />
                  <span className="text-[10px] font-black text-blue-700 uppercase tracking-wide">
                    Synthesis Goal
                  </span>
                </div>
                <textarea
                  value={synthesisInstruction}
                  onChange={(e) => setSynthesisInstruction(e.target.value)}
                  placeholder="Optional: Provide direction (e.g. 'Focus on pricing comparison' or 'Target beginners')..."
                  className="w-full text-[11px] p-2 rounded-lg border border-blue-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-400 bg-white placeholder:text-gray-400 resize-none h-16 leading-relaxed"
                />
                <button
                  onClick={handleSynthesize}
                  disabled={isSynthesizing}
                  className="w-full text-[10px] font-extrabold text-white bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-2.5 rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all border border-blue-500/50 flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:cursor-wait"
                >
                  {isSynthesizing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Zap className="w-3 h-3 fill-current" />
                  )}
                  SYNTHESIZE {selectedDocs.length} SOURCES
                </button>
              </div>
            )}

            {isDisplayingDocument && (
              <button
                onClick={() => analysisStore.setSelectedDocumentIds([])}
                className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-3 py-2 rounded-xl hover:bg-white transition-all border border-blue-100 shadow-sm flex items-center gap-1.5 group"
              >
                <ArrowRight className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform rotate-180" />
                BACK TO LIVE
              </button>
            )}
            {status === 'analyzing' && (
              <button
                onClick={onStop}
                className="px-3 py-2 text-[10px] font-extrabold text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl transition-all flex items-center gap-1.5"
              >
                <Square className="w-3 h-3 fill-current" />
                STOP
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-20">
        {!currentRefAnalysis &&
        !currentKeywords.length &&
        status !== 'analyzing' &&
        !isDisplayingDocument ? (
          <EmptyState />
        ) : (
          <>
            {/* 1. Analysis Status Signal */}
            {status === 'analyzing' && !isDisplayingDocument && (
              <div className="p-4 bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 rounded-2xl shadow-xl shadow-blue-500/20 border border-blue-400/30 overflow-hidden relative group">
                <div className="absolute -top-4 -right-4 p-4 opacity-10 rotate-12 transition-transform duration-700 group-hover:scale-150">
                  <Zap className="w-24 h-24 text-white" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/20 backdrop-blur-md">
                      <RotateCcw className="w-3.5 h-3.5 text-white animate-spin" />
                    </div>
                    <span className="text-[11px] font-black text-white uppercase tracking-[0.1em]">
                      Processing Phase: Intelligence Extraction
                    </span>
                  </div>
                  <p className="text-[10px] text-blue-50 font-medium leading-relaxed max-w-[90%]">
                    Gemini 2.0 is mapping semantic clusters, regional linguistic nuances, and
                    competitive positioning...
                  </p>
                </div>
              </div>
            )}

            {/* 2. Localization Profile */}
            {(currentAudience || currentLangInst) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-4 group hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-blue-500" /> Regional DNA
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCopyLanguage}
                      className="p-2 hover:bg-indigo-50 rounded-xl transition-all text-gray-400 hover:text-blue-600 active:scale-95"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => setShowLangDetails(!showLangDetails)}
                      className="text-[9px] font-black text-gray-400 hover:text-blue-600 px-2 py-1 bg-gray-50 rounded-lg hover:bg-white transition-all uppercase tracking-tight"
                    >
                      {showLangDetails ? 'Collapse' : 'Expand'}
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-colors">
                    <span className="text-[10px] font-black text-gray-400 uppercase">
                      Target Market
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-black text-slate-800">
                        {currentAudience === 'zh-TW'
                          ? '🇹🇼 Taiwan / 繁中'
                          : currentAudience === 'zh-HK'
                            ? '🇭🇰 HK / 繁中'
                            : '🇲🇾 MY / 簡中'}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`relative px-4 py-3 bg-indigo-50/20 rounded-2xl border border-blue-100/40 transition-all duration-500 ${showLangDetails ? 'max-h-[800px]' : 'max-h-[100px] shadow-inner'}`}
                  >
                    <div
                      className={`text-[11px] text-gray-600 leading-[1.6] font-mono whitespace-pre-wrap ${showLangDetails ? '' : 'line-clamp-3 overflow-hidden'}`}
                    >
                      {currentLangInst || 'Default regional formatting applied.'}
                    </div>
                    {!showLangDetails && currentLangInst && (
                      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-indigo-50/40 to-transparent pointer-events-none" />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Conversion Map */}
            {(currentProductBrief || currentProductMapping.length > 0) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-4 group hover:shadow-md transition-all duration-300">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" /> Value Proposition Mapping
                </h3>
                <div className="space-y-4">
                  {currentProductBrief && (
                    <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 group-hover:bg-white transition-colors relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-5">
                        <Gem className="w-12 h-12 text-emerald-600" />
                      </div>
                      <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                        <Target className="w-3 h-3" /> Core Solution
                      </div>
                      <div className="text-[12px] font-black text-gray-800 mb-1">
                        {currentProductBrief.brandName} • {currentProductBrief.productName}
                      </div>
                      <p className="text-[10px] text-emerald-700/80 leading-relaxed font-medium mt-2 p-2 bg-emerald-100/30 rounded-lg">
                        {currentProductBrief.usp}
                      </p>
                    </div>
                  )}
                  {currentProductMapping.length > 0 && (
                    <div className="space-y-2.5">
                      <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest px-1">
                        Logic Injection Chain
                      </p>
                      {currentProductMapping.map((map, i) => (
                        <div
                          key={i}
                          className="flex gap-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100 group/item hover:bg-white hover:border-blue-100 transition-all"
                        >
                          <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0 shadow-sm group-hover/item:scale-110 transition-transform" />
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-gray-700 leading-snug mb-1.5">
                              "{map.painPoint}"
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-blue-100 rounded-lg">
                                <ArrowRight className="w-3 h-3 text-blue-400" />
                                <span className="text-[10px] font-black text-blue-600 truncate uppercase tracking-tighter">
                                  {map.productFeature}
                                </span>
                              </div>
                            </div>
                            {map.relevanceKeywords?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {map.relevanceKeywords.slice(0, 3).map((k, ki) => (
                                  <span
                                    key={ki}
                                    className="text-[8px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-100"
                                  >
                                    #{k}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. Strategic Narrative & Voice */}
            {(currentRefAnalysis?.humanWritingVoice ||
              currentRefAnalysis?.toneSensation ||
              currentVisualStyle) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-4 group hover:shadow-md transition-all duration-300">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-500" /> Tactical Voice
                  Architecture
                </h3>
                <div className="space-y-4">
                  {currentRefAnalysis?.toneSensation && (
                    <div className="flex gap-3 p-3 bg-purple-50/40 rounded-2xl border border-purple-100/50">
                      <div className="w-6 h-6 rounded-lg bg-white border border-purple-100 flex items-center justify-center shrink-0 shadow-sm">
                        <Quote className="w-3 h-3 text-purple-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-0.5">
                          Vibe / Sensation
                        </p>
                        <p className="text-[11px] text-purple-900 font-bold leading-relaxed">
                          {currentRefAnalysis.toneSensation}
                        </p>
                      </div>
                    </div>
                  )}

                  {currentRefAnalysis?.humanWritingVoice && (
                    <div className="p-4 bg-white border border-blue-100 rounded-2xl shadow-sm relative overflow-hidden group">
                      <div className="flex items-center gap-2 mb-2">
                        <BrainCircuit className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">
                          Human Voice Blueprint
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-2 items-start">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                          <p className="text-[11px] text-gray-700 leading-relaxed font-medium">
                            {currentRefAnalysis.humanWritingVoice}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {currentVisualStyle && (
                    <div className="p-4 bg-amber-50/20 rounded-2xl border border-amber-100/40 group-hover:bg-white transition-colors border-dashed">
                      <div className="flex items-center gap-2 mb-2">
                        <LayoutTemplate className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                          Visual Style Guide
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-900 leading-[1.6] font-medium italic">
                        {currentVisualStyle}
                      </p>
                    </div>
                  )}

                  {currentRefAnalysis?.entryPoint && (
                    <div className="p-2.5 bg-indigo-50/30 rounded-xl border border-blue-100 flex items-center gap-3">
                      <div className="text-[10px] font-black text-blue-600 shrink-0">
                        ENTRY POINT
                      </div>
                      <div className="text-[10px] text-blue-700 font-bold leading-tight">
                        {currentRefAnalysis.entryPoint}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. Semantic Clusters (Keywords) */}
            {currentKeywords.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5 text-blue-500" /> Semantic Blueprint
                  </h3>
                  <span className="text-[9px] font-black text-gray-300 uppercase">
                    {currentKeywords.length} Clusters
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {currentKeywords.slice(0, 15).map((kw, i) => (
                    <KeywordItem key={i} kw={kw} />
                  ))}
                </div>
                {currentKeywords.length > 15 && (
                  <div className="py-2 text-center">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em] font-mono">
                      + {currentKeywords.length - 15} Additional Nodes Hidden
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 6. Grounding & Authority */}
            {currentAuthAnalysis && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-4 group hover:shadow-md transition-all duration-300">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Authority Grounding
                </h3>
                <div className="flex flex-wrap gap-2 mb-5">
                  {currentAuthAnalysis.relevantTerms.slice(0, 18).map((term, i) => (
                    <div
                      key={i}
                      className="px-2.5 py-1 bg-indigo-50/50 text-blue-700 border border-blue-100 rounded-xl text-[10px] font-black hover:bg-white hover:border-indigo-300 transition-colors cursor-default"
                    >
                      #{term}
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest px-1">
                    Strategic Permutations
                  </p>
                  {currentAuthAnalysis.combinations.slice(0, 3).map((c, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[11px] text-slate-700 leading-relaxed italic group/comb hover:bg-white hover:border-blue-100 transition-all"
                    >
                      <span className="text-indigo-300 font-black mr-2">0{i + 1}</span>
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. Regional Safety */}
            {currentRefAnalysis &&
              (totalDetectedCount > 0 ||
                (currentRefAnalysis.regionalReplacements &&
                  currentRefAnalysis.regionalReplacements.length > 0)) && (
                <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden p-4 group hover:shadow-md transition-all duration-300">
                  <h3 className="text-[10px] font-black text-rose-500/70 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Regional Compliance
                  </h3>
                  <div className="space-y-4">
                    {totalDetectedCount > 0 && (
                      <div className="space-y-3">
                        <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-2xl shadow-sm relative overflow-hidden group/alert">
                          <div className="absolute top-0 right-0 p-2 opacity-5">
                            <Info className="w-12 h-12 text-rose-600" />
                          </div>
                          <p className="text-[11px] font-black text-rose-700 mb-3 flex items-center gap-2">
                            Blocked Competition Detected ({totalDetectedCount})
                          </p>
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {detectedBrands.map((b, i) => (
                              <span
                                key={`b-${i}`}
                                className="bg-white px-2.5 py-1 rounded-xl border border-rose-200 text-rose-600 text-[10px] font-black shadow-sm shrink-0"
                              >
                                -{b}
                              </span>
                            ))}
                            {detectedProducts.map((p, i) => (
                              <span
                                key={`p-${i}`}
                                className="bg-white px-2.5 py-1 rounded-xl border border-orange-200 text-orange-600 text-[10px] font-black shadow-sm shrink-0"
                              >
                                -{p}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={onSearchLocalAlternatives}
                            disabled={isSearchingAlternatives || !onSearchLocalAlternatives}
                            className="w-full py-3 bg-white text-blue-600 text-[10px] font-black rounded-xl border border-blue-100 hover:bg-blue-600 hover:text-white shadow-sm transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                          >
                            {isSearchingAlternatives ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Search className="w-3.5 h-3.5" />
                            )}
                            SCAN FOR REGIONAL ALTERNATIVES
                          </button>
                        </div>
                      </div>
                    )}

                    {currentRefAnalysis.regionalReplacements &&
                      currentRefAnalysis.regionalReplacements.length > 0 && (
                        <div className="space-y-2.5">
                          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest px-1">
                            Linguistic Overrides
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {currentRefAnalysis.regionalReplacements.map((item, i) => (
                              <div
                                key={i}
                                className="p-3 bg-white border border-gray-100 rounded-2xl flex flex-col gap-2 hover:border-amber-200 transition-all"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <span className="text-[11px] text-gray-400 line-through font-medium">
                                      {item.original}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-amber-400" />
                                    <span className="text-[11px] font-black text-emerald-600">
                                      {item.replacement || '(Nullify)'}
                                    </span>
                                  </div>
                                  <span className="text-[8px] font-black bg-slate-50 text-slate-400 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                    {item.reason?.split(' ')[0] || 'Nuance'}
                                  </span>
                                </div>
                                {item.reason && (
                                  <p className="text-[9px] text-gray-400 leading-normal italic px-1">
                                    {item.reason}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

            {/* 8. Narrative Map (Structure) */}
            {currentRefAnalysis && currentRefAnalysis.structure && (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-blue-500" /> Narrative Structure
                  </h3>
                  <span className="text-[10px] font-black text-slate-300 font-mono">
                    {currentRefAnalysis.structure.length} Sections
                  </span>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 relative overflow-hidden group hover:shadow-md transition-shadow">
                  {currentRefAnalysis.h1Title && (
                    <div className="mb-4 bg-indigo-50/50 p-4 rounded-2xl border border-blue-100/50">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                        <FileText className="w-3 h-3" /> Extracted H1 Title
                      </p>
                      <p className="text-[13px] font-black text-blue-900 leading-tight">
                        {currentRefAnalysis.h1Title}
                      </p>
                    </div>
                  )}
                  {currentRefAnalysis.introText && (
                    <div className="mb-6 pb-6 border-b border-indigo-50 px-2">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Info className="w-3 h-3" /> Context Abstract
                      </p>
                      <p className="text-[11px] text-gray-800 leading-relaxed font-medium italic">
                        "{currentRefAnalysis.introText}"
                      </p>
                    </div>
                  )}
                  <div className="absolute left-[26px] top-8 bottom-8 w-px bg-slate-100 z-0" />
                  <div className="relative z-10">
                    {currentRefAnalysis.structure.map((section, idx) => (
                      <SectionItem key={idx} section={section} index={idx} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 9. Strategic Depth (Key Facts & Conversion Plans) */}
            {currentRefAnalysis &&
              ((currentRefAnalysis.keyInformationPoints &&
                currentRefAnalysis.keyInformationPoints.length > 0) ||
                (currentRefAnalysis.conversionPlan &&
                  currentRefAnalysis.conversionPlan.length > 0) ||
                (currentRefAnalysis.brandExclusivePoints &&
                  currentRefAnalysis.brandExclusivePoints.length > 0)) && (
                <div className="bg-slate-800 rounded-2xl shadow-xl overflow-hidden relative group p-6">
                  <div className="absolute top-0 right-0 p-4 opacity-5 rotate-12 group-hover:scale-150 transition-transform duration-1000">
                    <Gem className="w-20 h-20 text-white" />
                  </div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">
                    Strategic Intelligence Hub
                  </h3>

                  <div className="space-y-6">
                    {currentRefAnalysis.keyInformationPoints &&
                      currentRefAnalysis.keyInformationPoints.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                            Global Key Facts
                          </p>
                          {currentRefAnalysis.keyInformationPoints.map((point, idx) => (
                            <div
                              key={idx}
                              className="flex gap-3 text-[11px] text-slate-300 leading-relaxed font-medium"
                            >
                              <span className="text-blue-500 font-black">#</span>
                              <span>{point}</span>
                            </div>
                          ))}
                        </div>
                      )}

                    {currentRefAnalysis.conversionPlan &&
                      currentRefAnalysis.conversionPlan.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-slate-700/50">
                          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                            Conversion Psychology Plan
                          </p>
                          {currentRefAnalysis.conversionPlan.map((plan, idx) => (
                            <div
                              key={idx}
                              className="flex gap-3 text-[11px] text-slate-300 leading-relaxed font-medium"
                            >
                              <span className="text-emerald-500 font-black">→</span>
                              <span>{plan}</span>
                            </div>
                          ))}
                        </div>
                      )}

                    {currentRefAnalysis.brandExclusivePoints &&
                      currentRefAnalysis.brandExclusivePoints.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-slate-700/50">
                          <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
                            Brand Exclusive Assets
                          </p>
                          {currentRefAnalysis.brandExclusivePoints.map((asset, idx) => (
                            <div
                              key={idx}
                              className="flex gap-3 text-[11px] text-slate-300 leading-relaxed font-medium"
                            >
                              <span className="text-amber-500 font-black">★</span>
                              <span>{asset}</span>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              )}

            {/* 10. Human-AI Logic Summary */}
            {currentRefAnalysis?.generalPlan && currentRefAnalysis.generalPlan.length > 0 && (
              <div className="p-4 bg-white border border-blue-100 rounded-2xl shadow-sm overflow-hidden relative group">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4">
                  Core Narrative Engine
                </h3>
                <div className="space-y-3">
                  {currentRefAnalysis.generalPlan.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 text-[11px] text-gray-700 leading-relaxed font-medium"
                    >
                      <span className="text-blue-400 font-black">•</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
                {currentRefAnalysis?.regionVoiceDetect && (
                  <div className="mt-4 pt-4 border-t border-indigo-50 flex items-center justify-between">
                    <span className="text-[9px] font-black text-gray-400 uppercase">
                      Linguistic Fingerprint
                    </span>
                    <span className="text-[10px] font-black text-blue-600">
                      {currentRefAnalysis.regionVoiceDetect}
                    </span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
