import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { ArticleFormValues } from '../../schemas/formSchema';
import { ScrapedImage } from '../../types';
import { Download, FileText, ImageIcon, Link2, Loader2 } from 'lucide-react';

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
}) => {
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
                            {scrapedImages.length > 0 && (
                                <span className="text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 text-[9px] flex items-center gap-1">
                                    <ImageIcon className="w-3 h-3" /> {scrapedImages.length} Images
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
                            <div className="flex justify-end mt-1">
                                <span className="text-[10px] text-gray-400 font-mono">
                                    {refWordCount} words | {refCharCount} chars
                                </span>
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

                    {scrapedImages.length > 0 && (
                        <div className="mt-3 bg-gray-50 rounded-lg p-2 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <h5 className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                                    <ImageIcon className="w-3 h-3" /> Extracted Visuals
                                </h5>
                                <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 font-medium">
                                    AI will analyze first 5 images during generation
                                </span>
                            </div>

                            <div className="grid grid-cols-4 gap-2 max-h-32 overflow-y-auto custom-scrollbar p-1">
                                {scrapedImages.map((img, idx) => (
                                    <div key={idx} className="relative group rounded-md overflow-hidden bg-white border border-gray-200 aspect-square shadow-sm">
                                        {img.url ? (
                                            <img
                                                src={img.url}
                                                alt={img.altText}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                                                <ImageIcon className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
