import React, { useState } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { ArticleFormValues } from '../../schemas/formSchema';
import { ScrapedImage } from '../../types';
import { Download, FileText, Filter, ImageIcon, Link2, Loader2, Globe, ChevronDown, Briefcase, LayoutTemplate, Info, Database, CheckCircle2, RotateCw, Plus } from 'lucide-react';
import { dedupeScrapedImages } from '../../utils/imageUtils';

interface SourceMaterialSectionProps {
    register: UseFormRegister<ArticleFormValues>;
    errors: any;
    inputType: 'text' | 'url';
    setInputType: (type: 'text' | 'url') => void;
    urlValue?: string;
    refWordCount: number;
    refCharCount: number;
    scrapedImages: ScrapedImage[];
    onFetchUrl: () => Promise<void>;
    isFetchingUrl: boolean;
    onToggleScrapedImage?: (image: ScrapedImage) => void;
    onRequestSemanticFilter: () => void;
    canSemanticFilter: boolean;
    // Page Profile Props
    websiteType?: string;
    activePageId?: string;
    onOpenLibrary: () => void;
    onCreatePage: (name: string) => void;
    activePageTitle?: string;
}

export const SourceMaterialSection: React.FC<SourceMaterialSectionProps> = ({
    register,
    errors,
    inputType,
    setInputType,
    urlValue,
    refWordCount,
    refCharCount,
    scrapedImages,
    onFetchUrl,
    isFetchingUrl,
    onToggleScrapedImage,
    onRequestSemanticFilter,
    canSemanticFilter,
    websiteType,
    activePageId,
    onOpenLibrary,
    onCreatePage,
    activePageTitle,
}) => {
    const [showAllExtracted, setShowAllExtracted] = useState(false);
    const [isSourceInputOpen, setIsSourceInputOpen] = useState(true);

    const MAX_PREVIEW_IMAGES = 24;
    // ... dedupedImages logic etc
    const dedupedImages = React.useMemo(() => dedupeScrapedImages(scrapedImages), [scrapedImages]);
    // ... orderedImages logic etc
    const orderedImages = React.useMemo(
        () =>
            dedupedImages
                .map((img, idx) => ({ img, idx }))
                .sort((a, b) => {
                    const aIgnored = Boolean(a.img.ignored);
                    const bIgnored = Boolean(b.img.ignored);
                    if (aIgnored === bIgnored) return a.idx - b.idx;
                    return aIgnored ? 1 : -1; // ignored images go last
                })
                .map(({ img }) => img),
        [dedupedImages]
    );

    const visibleImages = showAllExtracted ? orderedImages : orderedImages.slice(0, MAX_PREVIEW_IMAGES);
    const hiddenCount = orderedImages.length - visibleImages.length;

    const handleFetch = async () => {
        await onFetchUrl();
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
                {/* Header Toggle */}
                <div
                    className="p-3 border-b border-gray-100 bg-gray-50/20 cursor-pointer hover:bg-gray-100/50 transition-colors"
                    onClick={() => setIsSourceInputOpen(!isSourceInputOpen)}
                >
                    <div className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <label className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 flex-shrink-0">
                                <Link2 className="w-3.5 h-3.5 text-blue-600" />
                                Source Input
                            </label>
                            {isSourceInputOpen ? (
                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100/50 uppercase tracking-tighter flex-shrink-0">Required</span>
                            ) : (
                                <span className="text-[10px] text-slate-400 font-medium italic truncate">
                                    {inputType === 'url' ? (urlValue || 'No URL') : (refCharCount > 0 ? `${refCharCount} chars` : 'No text')}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2.5 flex-shrink-0 ml-auto">
                            {isSourceInputOpen && (
                                <div className="flex bg-white p-0.5 rounded-lg border border-gray-200 shadow-sm transition-all" onClick={e => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        onClick={() => setInputType('text')}
                                        className={`px-3 py-1 text-[10px] font-black rounded-[6px] transition-all ${inputType === 'text' ? 'bg-blue-600 text-white shadow-[0_2px_4px_rgba(37,99,235,0.2)]' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Manual
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setInputType('url')}
                                        className={`px-3 py-1 text-[10px] font-black rounded-[6px] transition-all ${inputType === 'url' ? 'bg-blue-600 text-white shadow-[0_2px_4px_rgba(37,99,235,0.2)]' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        URL
                                    </button>
                                </div>
                            )}
                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isSourceInputOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </div>
                </div>

                <div className="animate-in slide-in-from-top-1">
                    {/* 1. Content Input Area (Always Visible) */}
                    <div className="p-4 bg-white">
                        {inputType === 'text' ? (
                            <div className="relative group">
                                <textarea
                                    {...register('referenceContent')}
                                    placeholder="Paste your source text here..."
                                    className={`w-full h-44 px-4 py-3 bg-slate-50/30 rounded-xl border text-[13px] leading-relaxed font-medium text-slate-700 placeholder-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none resize-none custom-scrollbar transition-all ${errors.referenceContent ? 'border-red-500' : 'border-slate-200'}`}
                                />
                                {errors.referenceContent && <p className="text-[10px] text-red-500 mt-1">{errors.referenceContent.message}</p>}
                                <div className="flex justify-between items-center mt-3 px-1">
                                    <span className="text-[10px] text-slate-400 font-bold tracking-tight bg-slate-100/50 px-2 py-1 rounded-md">
                                        {refWordCount} words / {refCharCount} chars
                                    </span>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onRequestSemanticFilter(); }}
                                        disabled={!canSemanticFilter}
                                        className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border text-[10px] font-bold transition-all active:scale-95 ${canSemanticFilter
                                            ? 'border-blue-100 text-blue-600 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-200 shadow-sm'
                                            : 'border-gray-50 text-gray-300 bg-gray-25 cursor-not-allowed opacity-50'
                                            }`}
                                    >
                                        <Filter className="w-3.5 h-3.5" />
                                        Semantic Filter
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-2 p-1">
                                <div className="relative flex-1 group" onClick={e => e.stopPropagation()}>
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-blue-600 text-slate-400">
                                        <Link2 className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="url"
                                        {...register('urlInput')}
                                        placeholder="https://example.com/article"
                                        className="w-full h-11 pl-11 pr-3 bg-slate-50/50 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 placeholder-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-inner"
                                        autoFocus
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleFetch(); }}
                                    disabled={isFetchingUrl || !urlValue}
                                    className="h-11 px-5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center min-w-[56px]"
                                >
                                    {isFetchingUrl ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Compact Library Trigger - Lightweight Integrated Style */}
                    {inputType === 'text' && (
                        <div className="px-4 pb-4 pt-1">
                            <div className="bg-blue-50/20 rounded-2xl border border-blue-100/50 overflow-hidden transition-all hover:bg-white hover:border-blue-200 hover:shadow-sm group">
                                {/* Identity & Info Row */}
                                <div className="p-3.5 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50 flex-shrink-0 group-hover:scale-105 transition-transform">
                                        <FileText className="w-4.5 h-4.5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h4 className="text-[12px] font-black text-slate-800 tracking-tight truncate">
                                                {activePageTitle || 'Draft Content'}
                                            </h4>
                                            {activePageId ? (
                                                <div className="flex items-center gap-1 text-emerald-600">
                                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Active</span>
                                                </div>
                                            ) : (
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Local</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                                                <FileText className="w-3 h-3 text-slate-300" />
                                                {refWordCount} <span className="font-medium text-slate-400 lowercase">words</span>
                                            </div>
                                            {websiteType && (
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-blue-500 uppercase tracking-tighter">
                                                    <LayoutTemplate className="w-3 h-3 text-blue-300" />
                                                    {websiteType}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Row - Integrated & Lighter */}
                                <div className="px-3 pb-3 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); onOpenLibrary(); }}
                                        className="flex-1 h-8 px-3 bg-white text-slate-600 rounded-lg text-[10px] font-black hover:bg-slate-50 transition-all border border-slate-200 shadow-xs active:scale-95 flex items-center justify-center gap-1.5"
                                    >
                                        <Database className="w-3 h-3" />
                                        Library
                                    </button>

                                    {activePageId ? (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                window.dispatchEvent(new CustomEvent('updateActivePage'));
                                            }}
                                            className="flex-1 h-8 px-3 bg-white text-blue-600 rounded-lg text-[10px] font-black hover:bg-blue-50 transition-all border border-blue-200 shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                                        >
                                            <RotateCw className="w-3 h-3" />
                                            Update
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const name = prompt('Enter a name for this profile:', activePageTitle || 'New Draft');
                                                if (name) onCreatePage(name);
                                            }}
                                            className="flex-1 h-8 px-3 bg-white text-blue-600 rounded-lg text-[10px] font-black hover:bg-blue-50 transition-all border border-blue-200 shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Save
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
