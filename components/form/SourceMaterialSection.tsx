import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { ArticleFormValues } from '../../schemas/formSchema';
import { ScrapedImage } from '../../types';
import { Download, FileText, Filter, ImageIcon, Link2, Loader2 } from 'lucide-react';
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
}) => {
    const [showAllExtracted, setShowAllExtracted] = React.useState(false);
    const MAX_PREVIEW_IMAGES = 24;
    const dedupedImages = React.useMemo(() => dedupeScrapedImages(scrapedImages), [scrapedImages]);
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
        <div className="space-y-2">
            <h3 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider px-1 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Source Material
            </h3>
            <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-4 space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Article Topic</label>
                    <input
                        type="text"
                        {...register('title')}
                        placeholder="e.g. Advanced React Patterns"
                        className={`w-full px-3 py-2 bg-white rounded-lg border text-sm font-medium text-gray-800 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all ${errors.title ? 'border-red-500' : 'border-gray-200'}`}
                    />
                    {errors.title && <p className="text-[10px] text-red-500">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                            Reference Content
                            {dedupedImages.length > 0 && (
                                <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 text-[9px] flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3" /> {dedupedImages.length} Images
                                </span>
                            )}
                            <span className="text-amber-500 bg-amber-50 px-1 rounded text-[9px] ml-auto border border-amber-100">Required</span>
                        </label>
                        <div className="flex bg-gray-100 p-0.5 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setInputType('text')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${inputType === 'text' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Paste Text
                            </button>
                            <button
                                type="button"
                                onClick={() => setInputType('url')}
                                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${inputType === 'url' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                From URL
                            </button>
                        </div>
                    </div>

                    {inputType === 'text' ? (
                        <div className="relative group">
                            <textarea
                                {...register('referenceContent')}
                                placeholder="Paste your source text here..."
                                className={`w-full h-36 px-3 py-2 bg-gray-50 rounded-lg border text-xs font-mono text-gray-600 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none custom-scrollbar transition-all group-hover:bg-white ${errors.referenceContent ? 'border-red-500' : 'border-gray-200'}`}
                            />
                            {errors.referenceContent && <p className="text-[10px] text-red-500">{errors.referenceContent.message}</p>}
                            <div className="flex justify-between items-center mt-1 gap-2 flex-wrap">
                                <span className="text-[10px] text-gray-400 font-mono">
                                    {refWordCount} words | {refCharCount} chars
                                </span>
                                <button
                                    type="button"
                                    onClick={onRequestSemanticFilter}
                                    disabled={!canSemanticFilter}
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-semibold transition-colors ${canSemanticFilter
                                        ? 'border-blue-200 text-blue-600 bg-blue-50 hover:bg-blue-100'
                                        : 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                                        }`}
                                >
                                    <Filter className="w-3 h-3" />
                                    語意過濾 (空白行分段)
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                    <Link2 className="w-3.5 h-3.5 text-gray-400" />
                                </div>
                                <input
                                    type="url"
                                    {...register('urlInput')}
                                    placeholder="https://example.com/article"
                                    className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    autoFocus
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleFetch}
                                disabled={isFetchingUrl || !urlValue}
                                className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center justify-center min-w-[40px]"
                            >
                                {isFetchingUrl ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            </button>
                        </div>
                    )}

                    {dedupedImages.length > 0 && (
                        <div className="mt-3 bg-gray-50 rounded-lg p-2 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                    <ImageIcon className="w-3 h-3" /> Extracted Visuals
                                </h5>
                                <div className="flex items-center gap-2">
                                    {orderedImages.length > MAX_PREVIEW_IMAGES && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAllExtracted((prev) => !prev)}
                                            className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 hover:bg-blue-100 transition-colors"
                                        >
                                            {showAllExtracted ? 'Collapse' : `Show All (${orderedImages.length})`}
                                        </button>
                                    )}
                                    <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 font-medium">
                                        AI will analyze first 5 images during generation
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                                {visibleImages.map((img, idx) => {
                                    // Use an index-suffixed key to prevent duplicate keys when the same URL appears multiple times
                                    const key = img.id || `${img.url || img.altText || 'image'}-${idx}`;
                                    const isIgnored = Boolean(img.ignored);
                                    const clickable = Boolean(onToggleScrapedImage);
                                    return (
                                        <div
                                            key={key}
                                            className={`relative group rounded-md overflow-hidden border aspect-square shadow-sm transition-all ${isIgnored ? 'border-gray-300' : 'border-gray-200 bg-white'} ${clickable ? 'cursor-pointer hover:border-blue-200' : ''}`}
                                            onClick={() => onToggleScrapedImage?.(img)}
                                            title={isIgnored ? 'Click to include again' : 'Click to ignore this image'}
                                        >
                                            <div className="absolute top-1 right-1 z-10">
                                                <input
                                                    type="checkbox"
                                                    checked={!isIgnored}
                                                    readOnly={!onToggleScrapedImage}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        onToggleScrapedImage?.(img);
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    aria-label={isIgnored ? 'Include image' : 'Exclude image'}
                                                />
                                            </div>
                                            {img.url ? (
                                                <img
                                                    src={img.url}
                                                    loading="lazy"
                                                    alt={img.altText}
                                                    className={`w-full h-full object-cover transition ${isIgnored ? 'grayscale opacity-60' : ''}`}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                                    <ImageIcon className="w-4 h-4" />
                                                </div>
                                            )}

                                            {isIgnored && (
                                                <div className="absolute inset-0 bg-black/30" />
                                            )}
                                        </div>
                                    );
                                })}
                                {hiddenCount > 0 && !showAllExtracted && (
                                    <button
                                        type="button"
                                        onClick={() => setShowAllExtracted(true)}
                                        className="flex items-center justify-center text-[10px] font-semibold text-blue-600 bg-white border border-blue-100 rounded-md h-full min-h-[72px] hover:bg-blue-50 transition-colors col-span-4"
                                    >
                                        + {hiddenCount} more
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
