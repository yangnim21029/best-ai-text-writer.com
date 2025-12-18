'use client';

import React, { useMemo, useState } from 'react';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { useAppStore } from '@/store/useAppStore';
import { BrainCircuit, Layers, Target, ShieldCheck, Database, ListChecks, Zap, Hash, BarChart2, FileSearch, BookOpen, UploadCloud, X, ShoppingBag, ArrowRight, Gem, Square, Languages, Copy, Check } from 'lucide-react';
import { GenerationStatus, FrequentWordsPlacementAnalysis, ReferenceAnalysis, AuthorityAnalysis, ProblemProductMapping, ProductBrief, TargetAudience } from '@/types';
import { Search, Loader2 } from 'lucide-react';

interface SeoSidebarProps {
    keywordPlans: FrequentWordsPlacementAnalysis[];
    referenceAnalysis: ReferenceAnalysis | null;
    authorityAnalysis: AuthorityAnalysis | null;
    productMapping?: ProblemProductMapping[];
    productBrief?: ProductBrief;
    headingOptimizations?: {
        h2_before: string;
        h2_after: string;
        h2_reason?: string;
        h2_options?: { text: string; reason?: string; score?: number }[];
        needs_manual?: boolean;
        h3?: { h3_before: string; h3_after: string; h3_reason?: string }[];
    }[];
    targetAudience: TargetAudience;
    languageInstruction: string;
    isLoading: boolean;
    status: GenerationStatus;
    onStop: () => void;
    brandKnowledge: string;
    setBrandKnowledge: (kb: string) => void;
    displayScale?: number;
    onSearchLocalAlternatives?: () => Promise<void>;
    isSearchingAlternatives?: boolean;
}

type Tab = 'analysis' | 'knowledge';

export const SeoSidebar: React.FC<SeoSidebarProps> = ({
    keywordPlans,
    referenceAnalysis,
    authorityAnalysis,
    productMapping = [],
    productBrief,
    headingOptimizations = [],
    targetAudience,
    languageInstruction,
    isLoading,
    status,
    onStop,
    brandKnowledge,
    setBrandKnowledge,
    displayScale = 1,
    onSearchLocalAlternatives,
    isSearchingAlternatives = false
}) => {
    const visualStyle = useAnalysisStore(state => state.visualStyle);
    const [activeTab, setActiveTab] = useState<Tab>('analysis');
    const [showLangDetails, setShowLangDetails] = useState(false);
    const [copied, setCopied] = useState(false);
    const filteredKeywordPlans = useMemo(() => {
        const MAGIC_MAX_WORDS = 3;
        const MAGIC_MAX_LENGTH = 15;
        return keywordPlans.filter(plan => {
            const keyword = (plan.word || '').trim();
            if (!keyword) return false;
            const wordCount = keyword.split(/\s+/).filter(Boolean).length;
            return wordCount <= MAGIC_MAX_WORDS && keyword.length <= MAGIC_MAX_LENGTH;
        });
    }, [keywordPlans]);

    const audienceLabelMap: Record<TargetAudience, string> = {
        'zh-TW': '繁體中文（台灣）',
        'zh-HK': '繁體中文（香港）',
        'zh-MY': '簡體中文（馬來西亞）',
    };
    const audienceLabel = audienceLabelMap[targetAudience] || targetAudience || '未設定';

    const handleCopyLanguage = async () => {
        const text = (languageInstruction || audienceLabel || '').trim();
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch (e) {
            console.warn('Copy failed', e);
        }
    };

    const formatInstruction = (raw: string, expanded: boolean) => {
        const trimmed = raw.trim();
        if (!trimmed) return '尚未載入語言指令。請在設定中選擇目標受眾。';
        if (expanded) return trimmed;
        const compact = trimmed.replace(/\s+/g, ' ').trim();
        return compact.length > 220 ? `${compact.slice(0, 220)}…` : compact;
    };

    const getKeywordLocationTags = (word: string, snippets: string[] = []) => {
        const normalized = (word || '').trim().toLowerCase();
        if (!normalized) return [{ label: 'Unknown', variant: 'unknown' as const }];

        const sections = referenceAnalysis?.structure || [];
        let headingHits = 0;
        sections.forEach(section => {
            if ((section.title || '').toLowerCase().includes(normalized)) headingHits++;
            (section.subheadings || []).forEach(sub => {
                if ((sub || '').toLowerCase().includes(normalized)) headingHits++;
            });
        });

        const bodyHits = snippets.length;
        const tags: { label: string; variant: 'heading' | 'body' | 'unknown' }[] = [];

        if (headingHits > 0) {
            tags.push({
                label: headingHits >= bodyHits ? 'Heading-heavy' : 'Heading',
                variant: 'heading'
            });
        }

        if (bodyHits > 0) {
            tags.push({
                label: bodyHits > headingHits ? 'Body-heavy' : 'Body',
                variant: 'body'
            });
        }

        if (tags.length === 0) {
            tags.push({ label: 'Unknown', variant: 'unknown' });
        }

        return tags.slice(0, 2);
    };

    const hasData = filteredKeywordPlans.length > 0 || referenceAnalysis !== null || authorityAnalysis !== null || productMapping.length > 0;
    const hasKnowledge = brandKnowledge && brandKnowledge.trim().length > 0;

    const difficultyBadge = (value?: string) => {
        const map: Record<string, { label: string; bg: string; text: string; border: string }> = {
            easy: { label: 'Easy', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
            medium: { label: 'Medium', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
            unclear: { label: 'Unclear', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
        };
        const variant = map[value || 'easy'] || map.easy;
        return (
            <span className={`px-2 py-0.5 text-xs font-bold rounded-full border ${variant.bg} ${variant.text} ${variant.border}`}>
                {variant.label}
            </span>
        );
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                const text = event.target.result as string;
                // Append to existing or replace? Let's append if existing, else replace.
                const newContent = brandKnowledge ? brandKnowledge + "\n\n" + text : text;
                setBrandKnowledge(newContent);
            }
        };
        reader.readAsText(file);
    };

    const isRunning = status === 'analyzing' || status === 'streaming';

    const AnalysisView = () => {
        // Show loading state only if we have absolutely no data yet
        if (isLoading && !hasData) {
            return (
                <div className="flex flex-col h-full p-8 items-center justify-center bg-white/50 space-y-6">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <BrainCircuit className="w-6 h-6 text-indigo-600 animate-pulse" />
                        </div>
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className="text-lg font-bold text-gray-800">Analyzing Content</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Parallel Analysis: Structure & Voice Strategy...</p>
                    </div>
                </div>
            );
        }

        if (!hasData) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-60">
                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                        <FileSearch className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-base font-bold text-gray-700 mb-2">No Data Available</h4>
                    <p className="text-xs text-gray-500 max-w-[200px] leading-relaxed">
                        Start a generation to see NLP insights, structural breakdown, and authority signals here.
                    </p>
                </div>
            );
        }

        // Helper to find which section matches a mapping
        const getMatchingSections = (keywords: string[]) => {
            if (!referenceAnalysis?.structure) return [];
            return referenceAnalysis.structure.filter(s =>
                keywords.some(k => s.title.toLowerCase().includes(k.toLowerCase()))
            ).map(s => s.title);
        };

        return (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {/* Language Profile Card */}
                <div className="bg-white rounded-xl border border-indigo-100 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden">
                    <div className="px-4 py-2 flex items-center justify-between gap-3 bg-indigo-50">
                        <div className="flex items-center gap-2">
                            <Languages className="w-4 h-4 text-indigo-600" />
                            <div className="leading-tight">
                                <span className="block text-xs font-extrabold uppercase tracking-wider text-indigo-800">語言設定</span>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-semibold text-indigo-700 bg-white/70 px-2 py-0.5 rounded-full border border-indigo-100">
                                        {audienceLabel}
                                    </span>
                                    <span className="text-xs text-indigo-500 font-semibold bg-indigo-100/60 px-2 py-0.5 rounded-full border border-indigo-200">
                                        {targetAudience || '未設定'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={handleCopyLanguage}
                                className="h-8 w-8 flex items-center justify-center rounded-md border border-indigo-100 bg-white text-indigo-600 hover:bg-indigo-50 active:scale-95 transition"
                                title="複製完整語言指令"
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <button
                                onClick={() => setShowLangDetails(v => !v)}
                                className="h-8 px-3 text-xs font-semibold text-indigo-700 rounded-md border border-indigo-100 bg-white hover:bg-indigo-50 active:scale-95 transition"
                            >
                                {showLangDetails ? '收起' : '全文'}
                            </button>
                        </div>
                    </div>
                    <div className={`p-3 text-sm text-gray-700 leading-snug ${showLangDetails ? 'whitespace-pre-line' : ''}`}>
                        {formatInstruction(languageInstruction || '', showLangDetails)}
                    </div>
                </div>

                {/* NEW: Product & Conversion Strategy Card */}
                {productBrief && productBrief.productName && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden group hover:shadow-md transition-all duration-300">
                        <div className="px-4 py-2.5 border-b border-gray-50 bg-gradient-to-r from-emerald-50/80 to-white flex items-center gap-2">
                            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
                            <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Service & Product Strategy</h4>
                        </div>
                        <div className="p-3 space-y-3">
                            {/* Product Summary */}
                            <div className="flex flex-col gap-1.5 text-xs bg-emerald-50/50 p-3 rounded border border-emerald-100">
                                <span className="font-bold text-emerald-700">{productBrief.productName}</span>
                                <span className="text-emerald-600/70 break-words leading-relaxed">{productBrief.usp}</span>
                            </div>

                            {/* Mapping Strategy */}
                            <div className="space-y-2">
                                <h5 className="text-xs font-bold text-gray-400 uppercase">Injection Map</h5>
                                {productMapping.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">No specific mappings generated.</p>
                                ) : (
                                    productMapping.map((map, idx) => {
                                        const matchedSections = getMatchingSections(map.relevanceKeywords);
                                        return (
                                            <div key={idx} className="bg-gray-50 rounded p-3 border border-gray-100 flex flex-col gap-2">
                                                <div className="flex items-start gap-2">
                                                    <div className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" title="Pain Point"></div>
                                                    <span className="text-xs text-gray-700 leading-relaxed break-words">
                                                        {map.painPoint}
                                                    </span>
                                                </div>
                                                <div className="flex items-start gap-2 pl-3.5">
                                                    <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0 mt-0.5" />
                                                    <span className="text-xs font-bold text-emerald-600 leading-relaxed break-words">
                                                        {map.productFeature}
                                                    </span>
                                                </div>
                                                {matchedSections.length > 0 && (
                                                    <div className="mt-1 pl-3.5 flex flex-wrap gap-1.5">
                                                        {matchedSections.map((s, si) => (
                                                            <span key={si} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded border border-blue-100 break-words">
                                                                📍 {s}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>


                        </div>
                    </div>
                )}

                {/* NEW: Visual Style Card */}
                {referenceAnalysis && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden group hover:shadow-md transition-all duration-300">
                        <div className="px-4 py-2.5 border-b border-gray-50 bg-gradient-to-r from-pink-50/80 to-white flex items-center gap-2">
                            <div className="w-3.5 h-3.5 text-pink-600 flex items-center justify-center">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>
                            </div>
                            <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Visual Style</h4>
                        </div>
                        <div className="p-3">
                            <p className="text-sm text-gray-600 leading-relaxed italic">
                                "{visualStyle || "Clean, modern professional photography with natural lighting."}"
                            </p>
                        </div>
                    </div>
                )}

                {/* NEW: Localization & Safety Card */}
                {referenceAnalysis && ((referenceAnalysis.regionalReplacements && referenceAnalysis.regionalReplacements.length > 0) || (referenceAnalysis.replacementRules && referenceAnalysis.replacementRules.length > 0)) && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden group hover:shadow-md transition-all duration-300">
                        <div className="px-4 py-2.5 border-b border-gray-50 bg-gradient-to-r from-amber-50/80 to-white flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Localization & Safety</h4>
                        </div>
                        <div className="p-3 space-y-3">
                            {/* Regional Corrections */}
                            {referenceAnalysis.regionalReplacements && referenceAnalysis.regionalReplacements.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h5 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                                            Regional Corrections
                                            <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full text-[10px]">{referenceAnalysis.regionalReplacements.length}</span>
                                        </h5>
                                    </div>
                                    <ul className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                        {referenceAnalysis.regionalReplacements.map((item, idx) => (
                                            <li key={idx} className={`rounded p-2 border flex flex-col gap-1 ${item.replacement ? 'bg-amber-50/50 border-amber-100' : 'bg-red-50/50 border-red-100'}`}>
                                                <div className="flex items-center gap-2 text-xs font-medium text-gray-800 flex-wrap">
                                                    <span className="text-red-500 line-through decoration-red-500/50">{item.original}</span>
                                                    <span className="text-gray-400">→</span>
                                                    {item.replacement ? (
                                                        <span className="text-emerald-600 font-bold">{item.replacement}</span>
                                                    ) : (
                                                        <span className="text-red-500 font-bold italic">(刪除)</span>
                                                    )}
                                                </div>
                                                {item.reason && <span className="text-[10px] text-gray-500 leading-snug">{item.reason}</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Blocked Competitor Terms with Classification */}
                            {((referenceAnalysis.competitorBrands && referenceAnalysis.competitorBrands.length > 0) ||
                                (referenceAnalysis.competitorProducts && referenceAnalysis.competitorProducts.length > 0)) && (
                                    <div className={`space-y-2 ${referenceAnalysis.regionalReplacements?.length ? 'pt-2 border-t border-gray-100' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <h5 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                                                Blocked Terms
                                                <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full text-[10px]">
                                                    {(referenceAnalysis.competitorBrands?.length || 0) + (referenceAnalysis.competitorProducts?.length || 0)}
                                                </span>
                                            </h5>
                                        </div>

                                        {/* Recommendation Banner */}
                                        {((referenceAnalysis.competitorBrands?.length || 0) + (referenceAnalysis.competitorProducts?.length || 0)) >= 3 && (
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 space-y-2">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-blue-600 text-sm">💡</span>
                                                    <p className="text-xs text-blue-700 leading-relaxed">
                                                        偵測到 <strong>{(referenceAnalysis.competitorBrands?.length || 0) + (referenceAnalysis.competitorProducts?.length || 0)}</strong> 個品牌/產品需要本地替換
                                                    </p>
                                                </div>
                                                <button
                                                    className="w-full px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    onClick={onSearchLocalAlternatives}
                                                    disabled={isSearchingAlternatives || !onSearchLocalAlternatives}
                                                >
                                                    {isSearchingAlternatives ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Search className="w-3.5 h-3.5" />
                                                    )}
                                                    搜尋本地替代品牌
                                                </button>
                                            </div>
                                        )}

                                        <ul className="space-y-1.5">
                                            {/* Brand items */}
                                            {referenceAnalysis.competitorBrands?.map((brand, idx) => (
                                                <li key={`brand-${idx}`} className="text-xs text-gray-600 flex items-center justify-between gap-2 bg-gray-50 rounded px-2 py-1.5 border border-gray-100">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-red-400 font-bold">[-]</span>
                                                        <span className="break-words font-medium">{brand}</span>
                                                    </div>
                                                    <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded-full">品牌</span>
                                                </li>
                                            ))}
                                            {/* Product items */}
                                            {referenceAnalysis.competitorProducts?.map((product, idx) => (
                                                <li key={`product-${idx}`} className="text-xs text-gray-600 flex items-center justify-between gap-2 bg-gray-50 rounded px-2 py-1.5 border border-gray-100">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-red-400 font-bold">[-]</span>
                                                        <span className="break-words font-medium">{product}</span>
                                                    </div>
                                                    <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full">產品</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                        </div>
                    </div>
                )}

                {/* Card 1: Voice & Strategy */}
                {referenceAnalysis && (referenceAnalysis.generalPlan.length > 0 || referenceAnalysis.humanWritingVoice || referenceAnalysis.toneSensation) && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden group hover:shadow-md transition-all duration-300">
                        <div className="px-4 py-2.5 border-b border-gray-50 bg-gradient-to-r from-purple-50/80 to-white flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 text-purple-600" />
                            <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Voice Strategy</h4>
                        </div>
                        <div className="p-3">
                            {/* Detailed Metrics */}
                            <div className="grid grid-cols-1 gap-2.5 mb-4">
                                {referenceAnalysis.toneSensation && (
                                    <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-100/50 flex items-start gap-2">
                                        <div className="p-1 px-1.5 bg-white rounded shadow-sm text-purple-600 font-bold text-[10px] flex-shrink-0">語感</div>
                                        <p className="text-[11px] text-purple-900 font-medium leading-relaxed">{referenceAnalysis.toneSensation}</p>
                                    </div>
                                )}
                                {referenceAnalysis.entryPoint && (
                                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/50 flex items-start gap-2">
                                        <div className="p-1 px-1.5 bg-white rounded shadow-sm text-slate-500 font-bold text-[10px] flex-shrink-0">切入點</div>
                                        <p className="text-[11px] text-slate-700 font-medium leading-relaxed">{referenceAnalysis.entryPoint}</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 border-t border-purple-50 pt-3">
                                {referenceAnalysis.generalPlan.map((point, idx) => (
                                    <div key={idx} className="flex gap-2.5 items-start">
                                        <div className="w-1 h-1 mt-2 rounded-full bg-purple-400 flex-shrink-0"></div>
                                        <p className="text-sm text-gray-600 leading-relaxed">{point}</p>
                                    </div>
                                ))}
                            </div>

                            {/* New: Voice Detect & Identity */}
                            <div className="mt-3 pt-3 border-t border-purple-50 space-y-2">
                                {referenceAnalysis.regionVoiceDetect && referenceAnalysis.regionVoiceDetect !== "Match" && (
                                    <div className="bg-rose-50 border border-rose-100 rounded-md p-2 flex gap-2 items-start">
                                        <div className="mt-0.5 text-rose-500">⚠️</div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-rose-700 uppercase">Region Voice %</p>
                                            <p className="text-xs text-rose-600 leading-relaxed">{referenceAnalysis.regionVoiceDetect}</p>
                                        </div>
                                    </div>
                                )}
                                {referenceAnalysis.humanWritingVoice && (
                                    <div className="flex gap-2 items-start bg-purple-50/50 p-2 rounded-md border border-purple-50">
                                        <div className="mt-0.5 text-xs">🗣️</div>
                                        <div className="space-y-0.5">
                                            <p className="text-xs font-bold text-purple-700 uppercase">Human Writing Voice</p>
                                            <p className="text-xs text-purple-600 leading-relaxed italic">
                                                "{referenceAnalysis.humanWritingVoice}"
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Card 2: Authority Signals */}
                {authorityAnalysis && authorityAnalysis.relevantTerms.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden group hover:shadow-md transition-all duration-300">
                        <div className="px-4 py-2.5 border-b border-gray-50 bg-gradient-to-r from-teal-50/80 to-white flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                            <h4 className="text-sm font-extrabold text-gray-700 uppercase tracking-wider">Core Topic</h4>
                        </div>
                        <div className="p-4 space-y-3">
                            <div className="flex flex-wrap gap-1.5">
                                {authorityAnalysis.relevantTerms.slice(0, 8).map((term, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded text-sm font-semibold">
                                        {term}
                                    </span>
                                ))}
                                {authorityAnalysis.relevantTerms.length > 8 && (
                                    <span className="px-2 py-1 text-gray-400 text-sm font-medium bg-gray-50 rounded border border-gray-100">
                                        +{authorityAnalysis.relevantTerms.length - 8} more
                                    </span>
                                )}
                            </div>

                            <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                                <h5 className="text-sm font-bold text-gray-400 mb-2 uppercase flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-amber-400" /> Integration Plan
                                </h5>
                                <ul className="space-y-1.5">
                                    {(authorityAnalysis.combinations || []).map((plan, idx) => (
                                        <li key={idx} className="text-sm text-gray-600 flex items-start gap-1.5 leading-snug">
                                            <span className="text-teal-400 mt-0.5">•</span>
                                            <span>{plan}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* Card 3: Structure Map */}
                {referenceAnalysis && referenceAnalysis.structure.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden group hover:shadow-md transition-all duration-300">
                        <div className="px-4 py-2.5 border-b border-gray-50 bg-gradient-to-r from-blue-50/80 to-white flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-blue-600" />
                            <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Narrative Structure (Outline)</h4>
                        </div>
                        <div className="relative py-2 max-h-96 overflow-y-auto custom-scrollbar">
                            {/* Timeline Line */}
                            <div className="absolute left-5 top-4 bottom-4 w-px bg-gray-100"></div>

                            <div className="relative z-10">
                                {referenceAnalysis.structure.map((section, idx) => {
                                    const mode = section.writingMode || (section.difficulty === 'easy' ? 'direct' : 'multi_solutions');
                                    const angles = section.solutionAngles?.filter(Boolean).slice(0, 2) || [];
                                    return (
                                        <div key={idx} className="px-4 py-3 pl-10 relative hover:bg-blue-50/30 transition-colors group/item">
                                            <div className="absolute left-3 top-3.5 w-4 h-4 rounded-full border-2 border-white bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm text-xs font-bold z-10 group-hover/item:bg-blue-600 group-hover/item:text-white transition-all">
                                                {idx + 1}
                                            </div>
                                            <div className="flex items-start justify-between gap-3 pr-1">
                                                <div className="flex-1">
                                                    <h5 className="text-sm font-bold text-gray-800 mb-1 leading-normal break-words">{section.title}</h5>
                                                    {section.coreQuestion && (
                                                        <p className="text-xs text-gray-500 leading-relaxed break-words">Q: {section.coreQuestion}</p>
                                                    )}
                                                </div>
                                                {difficultyBadge(section.difficulty)}
                                            </div>
                                            {section.narrativePlan && section.narrativePlan.length > 0 && (
                                                <div className="mt-1.5 space-y-1">
                                                    {section.narrativePlan.slice(0, 3).map((plan, pIdx) => (
                                                        <p key={pIdx} className="text-xs text-gray-400 leading-relaxed break-words">
                                                            {plan}
                                                        </p>
                                                    ))}
                                                    {section.narrativePlan.length > 3 && (
                                                        <p className="text-[10px] text-gray-300">+{section.narrativePlan.length - 3} more</p>
                                                    )}
                                                </div>
                                            )}
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {section.isChecklist && (
                                                    <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Checklist</span>
                                                )}
                                                {section.uspNotes && section.uspNotes.slice(0, 2).map((usp, uIdx) => (
                                                    <span key={`usp-${uIdx}`} className="text-[10px] px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 break-words">
                                                        USP: {usp}
                                                    </span>
                                                ))}
                                                {section.augment && section.augment.slice(0, 2).map((aug, aIdx) => (
                                                    <span key={`aug-${aIdx}`} className="text-[10px] px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 break-words">
                                                        + {aug}
                                                    </span>
                                                ))}
                                                {section.suppress && section.suppress.slice(0, 2).map((sup, sIdx) => (
                                                    <span key={`sup-${sIdx}`} className="text-[10px] px-2 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-100 break-words">
                                                        - {sup}
                                                    </span>
                                                ))}
                                            </div>
                                            {Array.isArray(section.subheadings) && section.subheadings.length > 0 && (
                                                <div className="mt-2 pl-6 border-l border-blue-100 space-y-1">
                                                    {section.subheadings.map((sub, subIdx) => (
                                                        <div key={subIdx} className="flex items-start gap-1.5 text-xs text-gray-600 leading-snug break-words">
                                                            <span className="text-blue-400 mt-0.5">↳</span>
                                                            <span className="font-medium">{sub}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {mode === 'multi_solutions' && angles.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {angles.map((angle, aIdx) => (
                                                        <span key={aIdx} className="text-xs px-2 py-1 rounded-full border border-blue-100 bg-blue-50 text-blue-700 break-words">
                                                            {angle}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {(section.uspNotes && section.uspNotes.length > 0) && (
                                                <div className="mt-2 pl-6 border-l border-purple-100 space-y-1">
                                                    {section.uspNotes.map((usp, uIdx) => (
                                                        <div key={`usp-list-${uIdx}`} className="flex items-start gap-1.5 text-[11px] text-purple-700 leading-snug break-words">
                                                            <span className="text-purple-300 mt-0.5">★</span>
                                                            <span>{usp}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {section.keyFacts && section.keyFacts.length > 0 && (
                                                <div className="mt-2 pl-6 border-l border-gray-100 space-y-1">
                                                    {section.keyFacts.map((fact, fIdx) => (
                                                        <div key={fIdx} className="flex items-start gap-1.5 text-[11px] text-gray-700 leading-snug break-words">
                                                            <span className="text-gray-400 mt-0.5">•</span>
                                                            <span>{fact}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {(section.sentenceStartFeatures && section.sentenceStartFeatures.length > 0) && (
                                                <div className="mt-2 pl-6 border-l border-indigo-100 space-y-1">
                                                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight mb-0.5">Sentence Starts</div>
                                                    {section.sentenceStartFeatures.map((feat, fIdx) => (
                                                        <div key={`start-${fIdx}`} className="flex items-start gap-1.5 text-[11px] text-indigo-600 leading-snug break-words">
                                                            <span className="text-indigo-300 mt-0.5">▷</span>
                                                            <span>{feat}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {(section.sentenceEndFeatures && section.sentenceEndFeatures.length > 0) && (
                                                <div className="mt-2 pl-6 border-l border-rose-100 space-y-1">
                                                    <div className="text-[10px] font-bold text-rose-400 uppercase tracking-tight mb-0.5">Sentence Ends</div>
                                                    {section.sentenceEndFeatures.map((feat, fIdx) => (
                                                        <div key={`end-${fIdx}`} className="flex items-start gap-1.5 text-[11px] text-rose-600 leading-snug break-words">
                                                            <span className="text-rose-300 mt-0.5">◁</span>
                                                            <span>{feat}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            {/* shiftPlan removed */}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}



                {/* Card 5: NLP Keywords */}
                {filteredKeywordPlans.length > 0 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_4px_rgba(0,0,0,0.02)] overflow-hidden group hover:shadow-md transition-all duration-300">
                        <div className="px-4 py-2.5 border-b border-gray-50 bg-gradient-to-r from-indigo-50/80 to-white flex items-center gap-2">
                            <ListChecks className="w-3.5 h-3.5 text-indigo-600" />
                            <h4 className="text-xs font-extrabold text-gray-700 uppercase tracking-wider">Semantic Keywords</h4>
                        </div>
                        <div className="p-3 space-y-3">
                            {filteredKeywordPlans.map((item, idx) => (
                                <div key={idx} className="bg-gray-50/50 rounded-lg p-2.5 border border-gray-100">
                                    <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <Hash className="w-3 h-3 text-indigo-300" />
                                            <span className="text-sm font-bold text-gray-800">
                                                {item.word}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {item.isSentenceStart && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 text-[9px] font-bold">START</span>
                                            )}
                                            {item.isSentenceEnd && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-bold">END</span>
                                            )}
                                            {item.isPrefix && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 text-[9px] font-bold">PRE</span>
                                            )}
                                            {item.isSuffix && (
                                                <span className="px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 border border-teal-200 text-[9px] font-bold">SUF</span>
                                            )}
                                            {getKeywordLocationTags(item.word, item.snippets).map((tag, tagIdx) => {
                                                const base = "px-2 py-0.5 rounded-full border text-[10px] font-semibold flex items-center gap-1";
                                                const styles = tag.variant === 'heading'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                    : tag.variant === 'body'
                                                        ? 'bg-slate-50 text-slate-700 border-slate-200'
                                                        : 'bg-gray-50 text-gray-500 border-gray-200';
                                                return (
                                                    <span key={tagIdx} className={`${base} ${styles}`}>
                                                        {tag.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        {item.plan.map((rule, rIdx) => (
                                            <div key={rIdx} className="text-xs text-gray-600 flex items-start gap-1.5">
                                                <span className="text-indigo-300 mt-px">•</span>
                                                <span className="leading-snug opacity-90">{rule}</span>
                                            </div>
                                        ))}
                                        {item.exampleSentence && (
                                            <div className="mt-2 text-xs text-gray-500 italic border-l-2 border-indigo-100 pl-2">
                                                "{item.exampleSentence}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const KnowledgeView = () => {
        return (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
                <div className="p-4 bg-white border-b border-gray-200 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                            Upload or paste Brand Guidelines, Product Specs, or Whitepapers here.
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <label className="flex-1 cursor-pointer">
                            <input type="file" className="hidden" accept=".txt,.md,.json" onChange={handleFileUpload} />
                            <div className="px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2">
                                <UploadCloud className="w-3.5 h-3.5" />
                                Load File
                            </div>
                        </label>
                        <button
                            onClick={() => setBrandKnowledge('')}
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors"
                            title="Clear Knowledge Base"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-0 relative group">
                    <textarea
                        value={brandKnowledge}
                        onChange={(e) => setBrandKnowledge(e.target.value)}
                        placeholder="Paste heavy documentation here..."
                        className="w-full h-full p-4 bg-gray-50 resize-none outline-none text-xs font-mono text-gray-600 leading-relaxed focus:bg-white transition-colors custom-scrollbar"
                    />
                    {!brandKnowledge && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-gray-300 p-8 text-center">
                            <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                            <p className="text-sm font-bold">Knowledge Base Empty</p>
                            <p className="text-[10px] mt-1">This context is used by RAG to enhance section generation.</p>
                        </div>
                    )}
                </div>

                <div className="p-2 bg-white border-t border-gray-200 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                    <span>{brandKnowledge.length} chars</span>
                    <span className={brandKnowledge.length > 0 ? "text-green-600 font-bold" : ""}>
                        {brandKnowledge.length > 0 ? "RAG Active" : "Inactive"}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div
            className="flex flex-col h-full bg-slate-50/80 w-full border-l border-gray-200 font-sans"
            style={displayScale !== 1 ? { transform: `scale(${displayScale})`, transformOrigin: 'top left', width: `${100 / displayScale}%`, height: `${100 / displayScale}%` } : undefined}
        >

            {/* Sidebar Header / Tabs */}
            <div className="flex items-center px-2 pt-2 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm flex-shrink-0 z-10 justify-between gap-2">
                <div className="flex flex-1 items-center">
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`flex-1 pb-2 pt-1 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'analysis'
                            ? 'border-indigo-600 text-indigo-700'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <BarChart2 className="w-3.5 h-3.5" />
                        Analysis
                    </button>
                    <button
                        onClick={() => setActiveTab('knowledge')}
                        className={`flex-1 pb-2 pt-1 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors relative ${activeTab === 'knowledge'
                            ? 'border-indigo-600 text-indigo-700'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        Knowledge
                        {hasKnowledge && (
                            <span className="absolute top-1 right-6 w-1.5 h-1.5 bg-green-500 rounded-full ring-2 ring-white"></span>
                        )}
                    </button>
                </div>

                {isRunning && (
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100">
                            <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-wide">Analyzing...</span>
                        </div>
                        <button
                            onClick={onStop}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors active:scale-95 whitespace-nowrap"
                            title="停止分析"
                        >
                            <Square className="w-3.5 h-3.5" />
                            <span>停止</span>
                        </button>
                    </div>
                )}
            </div>

            {activeTab === 'analysis' ? <AnalysisView /> : <KnowledgeView />}
        </div>
    );
};
