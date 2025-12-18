import React, { useState } from 'react';
import { X, ImageIcon, Sparkles, Wand2, Settings2, Trash2, PlayCircle, Loader2, ArrowRight, Eye, Layout, Palette, User, CheckCircle2 } from 'lucide-react';
import { ImageAssetPlan } from '../../types';
import { cn } from '../../utils/cn';

interface VisualAssetPlanningModalProps {
    open: boolean;
    onClose: () => void;
    imagePlans: ImageAssetPlan[];
    isPlanning: boolean;
    isBatchProcessing: boolean;
    onAutoPlan: () => void;
    onBatchProcess: () => void;
    onGenerateSingle: (plan: ImageAssetPlan) => void;
    onUpdatePlan: (id: string, updates: Partial<ImageAssetPlan>) => void;
    onDeletePlan: (id: string) => void;
    onInject: (plan: ImageAssetPlan, method: 'auto' | 'cursor') => void;

    // Style Settings
    modelAppearance: string;
    setModelAppearance: (v: string) => void;
    designStyle: string;
    setDesignStyle: (v: string) => void;
}

export const VisualAssetPlanningModal: React.FC<VisualAssetPlanningModalProps> = ({
    open,
    onClose,
    imagePlans,
    isPlanning,
    isBatchProcessing,
    onAutoPlan,
    onBatchProcess,
    onGenerateSingle,
    onUpdatePlan,
    onDeletePlan,
    onInject,
    modelAppearance,
    setModelAppearance,
    designStyle,
    setDesignStyle,
}) => {
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    if (!open) return null;

    const stats = {
        total: imagePlans.length,
        ready: imagePlans.filter(p => p.status === 'done').length,
        pending: imagePlans.filter(p => p.status === 'idle' || p.status === 'error').length,
        generating: imagePlans.filter(p => p.status === 'generating').length,
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white w-full max-w-6xl h-[85vh] rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-blue-50/50 via-white to-purple-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
                            <ImageIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Visual Asset Planning</h3>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-0.5 flex items-center gap-2">
                                <Sparkles className="w-3 h-3 text-blue-500" />
                                Batch Image Generation Flow
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onAutoPlan}
                            disabled={isPlanning}
                            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-2xl text-sm font-bold shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isPlanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 text-blue-500" />}
                            Auto-Plan All Visuals
                        </button>

                        <button
                            onClick={onBatchProcess}
                            disabled={isBatchProcessing || stats.pending === 0}
                            className="px-6 py-2 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transition-all flex items-center gap-2 disabled:opacity-50 disabled:shadow-none"
                        >
                            {isBatchProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                            Generate All ({stats.pending})
                        </button>

                        <div className="w-px h-8 bg-gray-100 mx-2" />

                        <button onClick={onClose} className="p-2.5 rounded-2xl hover:bg-gray-100 text-gray-400 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar: Global Style Settings */}
                    <aside className="w-80 border-r border-gray-50 bg-gray-50/30 overflow-y-auto custom-scrollbar p-6 space-y-8">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block flex items-center gap-2">
                                <User className="w-3 h-3 text-blue-500" />
                                Global Model Appearance
                            </label>
                            <textarea
                                value={modelAppearance}
                                onChange={(e) => setModelAppearance(e.target.value)}
                                className="w-full h-32 p-4 bg-white rounded-2xl border border-gray-100 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none resize-none transition-all shadow-sm font-medium leading-relaxed"
                                placeholder="e.g. Asian professional, natural lighting, high-end photography..."
                            />
                            <p className="mt-2 text-[10px] text-gray-400 font-medium">Applied to Lifestyle and Product photography.</p>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block flex items-center gap-2">
                                <Palette className="w-3 h-3 text-purple-500" />
                                Infographic Design Style
                            </label>
                            <textarea
                                value={designStyle}
                                onChange={(e) => setDesignStyle(e.target.value)}
                                className="w-full h-32 p-4 bg-white rounded-2xl border border-gray-100 text-sm focus:border-purple-500 focus:ring-4 focus:ring-purple-500/5 outline-none resize-none transition-all shadow-sm font-medium leading-relaxed"
                                placeholder="e.g. Minimalist flat design, corporate blue & white palette, clean lines..."
                            />
                            <p className="mt-2 text-[10px] text-gray-400 font-medium">Applied to data visualizations and diagrams.</p>
                        </div>

                        {/* Batch Progress */}
                        <div className="pt-6 border-t border-gray-100">
                            <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                                    <span className="text-gray-400">Generation Progress</span>
                                    <span className="text-blue-600">{stats.ready} / {stats.total}</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 transition-all duration-500"
                                        style={{ width: `${(stats.ready / (stats.total || 1)) * 100}%` }}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[10px] font-black text-gray-500">
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        {stats.pending} Pending
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 rounded-lg text-green-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        {stats.ready} Ready
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content: Asset List */}
                    <main className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
                        {imagePlans.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-500">
                                <div className="w-20 h-20 rounded-[2.5rem] bg-gray-50 flex items-center justify-center text-gray-300">
                                    <ImageIcon className="w-10 h-10" />
                                </div>
                                <div className="max-w-xs">
                                    <h4 className="text-lg font-bold text-gray-900">No Visual Assets Planned</h4>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Click <strong>"Auto-Plan All Visuals"</strong> to let AI analyze your article and suggest the perfect images.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {imagePlans.map((plan, idx) => (
                                    <div
                                        key={plan.id}
                                        className={cn(
                                            "group relative flex flex-col bg-white rounded-[2rem] border overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-0.5",
                                            plan.status === 'done' ? "border-green-100" : "border-gray-100"
                                        )}
                                    >
                                        {/* Status Ribbon */}
                                        <div className={cn(
                                            "absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest z-10",
                                            plan.status === 'done' ? "bg-green-500 text-white" :
                                                plan.status === 'error' ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-400"
                                        )}>
                                            {plan.status}
                                        </div>

                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-gray-400">
                                                    {idx + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <select
                                                        value={plan.category}
                                                        onChange={(e) => onUpdatePlan(plan.id, { category: e.target.value })}
                                                        className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50/50 px-3 py-1 rounded-lg border-none focus:ring-2 focus:ring-blue-500 outline-none"
                                                    >
                                                        <option value="BRANDED_LIFESTYLE">Lifestyle Photography</option>
                                                        <option value="PRODUCT_DETAIL">Product Detail</option>
                                                        <option value="INFOGRAPHIC">Infographic</option>
                                                        <option value="PRODUCT_INFOGRAPHIC">Product Infographic</option>
                                                    </select>
                                                </div>
                                                <button
                                                    onClick={() => onDeletePlan(plan.id)}
                                                    className="p-2 text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="flex-1 flex gap-4">
                                                <div className="flex-1 space-y-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">AI Generation Prompt</label>
                                                        <textarea
                                                            value={plan.generatedPrompt}
                                                            onChange={(e) => onUpdatePlan(plan.id, { generatedPrompt: e.target.value })}
                                                            className="w-full h-24 p-3 bg-gray-50/50 rounded-xl border border-gray-100 text-sm focus:border-blue-500 focus:bg-white outline-none resize-none transition-all font-medium leading-relaxed"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                                                        <Layout className="w-3 h-3" />
                                                        Insert After:
                                                        <span className="text-gray-900 truncate max-w-[150px]" title={plan.insertAfter}>
                                                            "{plan.insertAfter}"
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="w-32 h-32 shrink-0 rounded-[1.5rem] bg-gray-50 border-2 border-dashed border-gray-100 flex flex-col items-center justify-center overflow-hidden relative group/preview">
                                                    {plan.status === 'done' && plan.url ? (
                                                        <>
                                                            <img src={plan.url} className="w-full h-full object-cover" />
                                                            <button
                                                                onClick={() => setPreviewImageUrl(plan.url!)}
                                                                className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center cursor-pointer border-none outline-none"
                                                            >
                                                                <Eye className="w-6 h-6 text-white" />
                                                            </button>
                                                        </>
                                                    ) : plan.status === 'generating' ? (
                                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                                    ) : (
                                                        <ImageIcon className="w-8 h-8 text-gray-200" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Item Actions */}
                                            <div className="mt-6 flex gap-2">
                                                {plan.status === 'done' ? (
                                                    <>
                                                        <button
                                                            onClick={() => onInject(plan, 'auto')}
                                                            className="flex-1 py-3 bg-green-50 text-green-700 rounded-2xl text-xs font-black flex items-center justify-center gap-2 hover:bg-green-100 transition-all border border-green-100"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Insert Auto
                                                        </button>
                                                        <button
                                                            onClick={() => onInject(plan, 'cursor')}
                                                            className="px-4 py-3 bg-blue-50 text-blue-700 rounded-2xl text-xs font-black flex items-center justify-center gap-2 hover:bg-blue-100 transition-all border border-blue-100"
                                                        >
                                                            Cursor
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => onGenerateSingle(plan)}
                                                        disabled={plan.status === 'generating' || isBatchProcessing}
                                                        className="flex-1 py-3 bg-white border border-gray-100 text-gray-700 rounded-2xl text-xs font-black flex items-center justify-center gap-2 hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                                                    >
                                                        {plan.status === 'generating' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4 text-blue-500" />}
                                                        Generate Now
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-50 flex items-center justify-between bg-gray-50/10">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Total {stats.total} assets planned • {stats.ready} ready to insert
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-black text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            Close
                        </button>
                        <button
                            onClick={onBatchProcess}
                            disabled={isBatchProcessing || stats.pending === 0}
                            className="px-8 py-2.5 bg-gray-900 text-white rounded-2xl text-sm font-black shadow-xl shadow-gray-200 hover:bg-black transition-all disabled:opacity-50"
                        >
                            {isBatchProcessing ? "Generating..." : `Start Generating ${stats.pending} Assets`}
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Preview Overlay */}
            {previewImageUrl && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300"
                    onClick={() => setPreviewImageUrl(null)}
                >
                    <button
                        onClick={() => setPreviewImageUrl(null)}
                        className="absolute top-8 right-8 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all"
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={previewImageUrl}
                        className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};
