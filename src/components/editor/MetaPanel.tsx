import React from 'react';
import { Sparkles, X } from 'lucide-react';

interface MetaPanelProps {
    metaTitle: string;
    metaDescription: string;
    urlSlug: string;
    isMetaLoading: boolean;
    onGenerateMeta: () => void;
    onClose: () => void;
    onMetaTitleChange: (value: string) => void;
    onMetaDescriptionChange: (value: string) => void;
    onUrlSlugChange: (value: string) => void;
}

export const MetaPanel: React.FC<MetaPanelProps> = ({
    metaTitle,
    metaDescription,
    urlSlug,
    isMetaLoading,
    onGenerateMeta,
    onClose,
    onMetaTitleChange,
    onMetaDescriptionChange,
    onUrlSlugChange,
}) => {
    return (
        <div className="absolute z-30 right-4 top-28 w-full max-w-xl bg-white border border-gray-200 shadow-2xl rounded-xl p-4 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-xs font-bold text-gray-700 uppercase">SEO Meta</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onGenerateMeta}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-white border border-purple-200 rounded-md hover:bg-purple-50 transition-colors disabled:opacity-60"
                        disabled={isMetaLoading}
                    >
                        {isMetaLoading ? <Sparkles className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        <span>Auto-generate</span>
                    </button>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Meta Title</label>
                    <input
                        value={metaTitle}
                        onChange={(e) => onMetaTitleChange(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 bg-white"
                        placeholder="e.g. AI Text Writer Pro — 高質內容生成"
                    />
                </div>
                <div className="md:col-span-1">
                    <label className="text-[10px] font-bold uppercase text-gray-500">Meta Description</label>
                    <textarea
                        value={metaDescription}
                        onChange={(e) => onMetaDescriptionChange(e.target.value)}
                        className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 bg-white h-20 resize-none"
                        placeholder="140-160 chars summary"
                    />
                </div>
            </div>

            <div>
                <label className="text-[10px] font-bold uppercase text-gray-500">URL Slug</label>
                <input
                    value={urlSlug}
                    onChange={(e) => onUrlSlugChange(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 bg-white"
                    placeholder="your-article-slug"
                />
            </div>
        </div>
    );
};
