import React, { useState } from 'react';
import { UseFormRegister } from 'react-hook-form';
import { ArticleFormValues } from '../../schemas/formSchema';
import { SavedProfile } from '../../types';
import { ChevronDown, Download, Edit2, Loader2, Settings2, ShoppingBag, Sparkles } from 'lucide-react';

interface ServiceProductSectionProps {
    register: UseFormRegister<ArticleFormValues>;
    productMode: 'text' | 'url';
    setProductMode: (mode: 'text' | 'url') => void;
    productRawText?: string;
    isSummarizingProduct: boolean;
    canAnalyzeFromUrls: boolean;
    activeProfile?: SavedProfile | null;
    onOpenLibrary: () => void;
    onAnalyzeFromUrls: () => Promise<void>;
}

export const ServiceProductSection: React.FC<ServiceProductSectionProps> = ({
    register,
    productMode,
    setProductMode,
    productRawText,
    isSummarizingProduct,
    canAnalyzeFromUrls,
    activeProfile,
    onOpenLibrary,
    onAnalyzeFromUrls,
}) => {
    const [showDetails, setShowDetails] = useState(false);

    const handleAnalyzeUrls = async () => {
        await onAnalyzeFromUrls();
    };

    return (
        <div className="space-y-2">
            <div className={`bg-white rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300 ${showDetails ? 'ring-2 ring-blue-50/50' : 'hover:shadow-md'}`}>

                <div
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors group"
                    onClick={() => setShowDetails(!showDetails)}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100/50 flex-shrink-0 group-hover:bg-blue-100/50 transition-colors">
                            <ShoppingBag className="w-4.5 h-4.5 text-blue-600" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[12px] font-black text-slate-800 tracking-tight">
                                {activeProfile ? `Service: ${activeProfile.name}` : 'Our Service & Product'}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-0.5">
                                {productRawText ? (
                                    <span className="truncate max-w-[150px] text-blue-600">
                                        {productRawText.substring(0, 30)}...
                                    </span>
                                ) : (
                                    <span>Not Configured</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onOpenLibrary();
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all border border-transparent hover:border-blue-100"
                            title="Manage Services"
                        >
                            <Settings2 className="w-4 h-4" />
                        </button>
                        <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} />
                    </div>
                </div>

                {showDetails && (
                    <div className="p-4 pt-0 border-t border-slate-50 animate-in slide-in-from-top-1 fade-in duration-200 mt-3">
                        <div className="flex items-center justify-between gap-2 mb-4">
                            <div className="flex items-center gap-1 flex-1 p-1 bg-slate-50 rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setProductMode('text')}
                                    className={`flex-1 text-[10px] py-1.5 rounded-md font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${productMode === 'text' ? 'bg-white shadow text-blue-600 border-slate-100 border' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Edit2 className="w-3 h-3" /> Content
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setProductMode('url')}
                                    className={`flex-1 text-[10px] py-1.5 rounded-md font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${productMode === 'url' ? 'bg-white shadow text-blue-600 border-slate-100 border' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Download className="w-3 h-3" /> URLs
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={onOpenLibrary}
                                className="h-8 px-3 bg-white border border-blue-200 text-blue-600 rounded-lg text-[10px] font-black hover:bg-blue-50 transition-all shadow-sm flex items-center gap-2 active:scale-95"
                            >
                                <Settings2 className="w-3.5 h-3.5" />
                                Library
                            </button>
                        </div>

                        {productMode === 'text' ? (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Details</label>
                                <textarea
                                    {...register('productRawText')}
                                    className="w-full h-48 px-3 py-3 bg-slate-50/50 rounded-xl border border-slate-100 text-xs text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none custom-scrollbar transition-all"
                                    placeholder="Paste details about YOUR Service/Product here..."
                                />
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source URLs</label>
                                    <textarea
                                        {...register('productUrlList')}
                                        className="w-full h-32 px-3 py-3 bg-slate-50/50 rounded-xl border border-slate-100 text-xs text-slate-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none custom-scrollbar font-mono"
                                        placeholder="https://example.com/product-a"
                                    />
                                    <p className="text-[9px] text-slate-400 font-bold italic">One URL per line. AI will summarize key info.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAnalyzeUrls}
                                    disabled={isSummarizingProduct || !canAnalyzeFromUrls}
                                    className="w-full h-10 bg-white border border-blue-200 text-blue-600 rounded-xl text-xs font-black hover:bg-blue-50 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                                >
                                    {isSummarizingProduct ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                    {isSummarizingProduct ? 'ANALYZING...' : 'ANALYZE & SUMMARIZE'}
                                </button>
                            </div>
                        )}

                        <div className="mt-4 text-[10px] text-slate-500 italic bg-blue-50/30 p-2.5 rounded-lg border border-blue-100/50 flex items-center gap-2 font-medium">
                            <Sparkles className="w-3 h-3 text-blue-400 flex-shrink-0" />
                            AI will use this info to replace competitor brand names in the final article.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
