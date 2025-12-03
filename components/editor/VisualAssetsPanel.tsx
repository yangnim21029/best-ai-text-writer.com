import React from 'react';
import { GalleryHorizontalEnd, Sparkles, Loader2, Image as ImageIcon, PlayCircle, RefreshCw, Map, ArrowRight, MousePointerClick, Eye } from 'lucide-react';
import { ImageAssetPlan, ScrapedImage } from '../../types';

interface VisualAssetsPanelProps {
    scrapedImages: ScrapedImage[];
    onToggleImage: (image: ScrapedImage) => void;
    imagePlans: ImageAssetPlan[];
    isPlanning: boolean;
    isBatchProcessing: boolean;
    onBatchProcess: () => void;
    onAutoPlan: () => void;
    onGenerateSinglePlan: (plan: ImageAssetPlan) => void;
    onUpdatePlanPrompt: (planId: string, prompt: string) => void;
    onInjectImage: (plan: ImageAssetPlan, mode: 'auto' | 'cursor') => void;
    useTiptap: boolean;
    isTiptapReady: boolean;
}

export const VisualAssetsPanel: React.FC<VisualAssetsPanelProps> = ({
    scrapedImages,
    onToggleImage,
    imagePlans,
    isPlanning,
    isBatchProcessing,
    onBatchProcess,
    onAutoPlan,
    onGenerateSinglePlan,
    onUpdatePlanPrompt,
    onInjectImage,
    useTiptap,
    isTiptapReady,
}) => {
    const handleAutoPlan = () => {
        if (useTiptap && !isTiptapReady) {
            alert("Editor not ready.");
            return;
        }
        onAutoPlan();
    };

    return (
        <div className="w-80 bg-blue-50/50 border-l border-blue-100 p-4 overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-200 flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-bold uppercase text-blue-600 flex items-center gap-2">
                    <GalleryHorizontalEnd className="w-4 h-4" />
                    Visual Assets
                </h4>
                <button 
                    onClick={handleAutoPlan}
                    disabled={isPlanning || (useTiptap && !isTiptapReady)}
                    className="text-[10px] bg-white border border-blue-200 text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
                    title="讓 AI 根據內容自動規劃插圖位置與提示"
                >
                    {isPlanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Auto-Plan
                </button>
            </div>

            {scrapedImages.length > 0 && (
                <div className="mb-4 bg-white p-2 rounded-lg border border-gray-200">
                    <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Source References</h5>
                    <div className="grid grid-cols-4 gap-2">
                        {scrapedImages.map((img, idx) => {
                            const key = img.id || img.url || `${idx}-${img.altText}`;
                            return (
                                <div
                                    key={key}
                                    className={`relative aspect-square rounded overflow-hidden group cursor-pointer border transition-all ${img.ignored ? 'border-gray-300' : 'border-gray-200 bg-white'} hover:border-blue-200`}
                                    title={img.altText}
                                    onClick={() => onToggleImage({ ...img, ignored: !img.ignored })}
                                >
                                    <img src={img.url} className={`w-full h-full object-cover transition ${img.ignored ? 'grayscale opacity-60' : ''}`} />
                                    {img.aiDescription && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full m-1 border border-white"></div>}
                                    {img.ignored && <div className="absolute inset-0 bg-black/30" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {imagePlans.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center space-y-2 opacity-60">
                    <ImageIcon className="w-8 h-8" />
                    <p className="text-xs">No visual assets planned.</p>
                    <p className="text-[10px]">Click "Auto-Plan" to generate ideas based on your content.</p>
                </div>
            ) : (
                <div className="space-y-3 pb-20">
                        <div className="flex justify-between items-center bg-blue-100/50 p-2 rounded-md">
                            <span className="text-[10px] font-bold text-blue-700">{imagePlans.filter(p => p.status === 'done').length}/{imagePlans.length} Ready</span>
                            <button 
                                onClick={onBatchProcess}
                                disabled={isBatchProcessing}
                                className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50"
                                title="一次生成所有尚未產出的圖像"
                            >
                                {isBatchProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                                Generate All
                            </button>
                        </div>

                        {imagePlans.map((plan) => (
                            <div key={plan.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm space-y-2 group">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase">Prompt</span>
                                        <p 
                                            className="text-[10px] text-gray-600 leading-snug line-clamp-3 hover:line-clamp-none cursor-text focus:outline-none focus:bg-gray-50 rounded"
                                            contentEditable
                                            onBlur={(e) => onUpdatePlanPrompt(plan.id, e.currentTarget.innerText)}
                                            dangerouslySetInnerHTML={{ __html: plan.generatedPrompt }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                            {plan.status === 'done' ? (
                                                <div className="w-16 h-16 rounded bg-gray-100 overflow-hidden border border-gray-200 relative group/img">
                                                    <img src={plan.url} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                        <Eye className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                onClick={() => onGenerateSinglePlan(plan)}
                                                disabled={plan.status === 'generating'}
                                                className="p-1.5 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded border border-gray-200 transition-colors"
                                                title="生成此圖像"
                                            >
                                                {plan.status === 'generating' ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <RefreshCw className="w-4 h-4" />}
                                            </button>
                                            )}
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-1.5 rounded text-[10px] text-gray-500 flex items-center gap-1.5">
                                    <Map className="w-3 h-3 text-gray-400" />
                                    <span className="truncate flex-1" title={plan.insertAfter || 'No anchor detected'}>
                                        After: "{(plan.insertAfter || 'N/A').substring(0, 25)}..."
                                    </span>
                                </div>

                                {plan.status === 'done' && (
                                    <div className="flex gap-1 pt-1">
                                            <button 
                                                onClick={() => onInjectImage(plan, 'auto')}
                                                className="flex-1 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] font-bold hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <ArrowRight className="w-3 h-3" /> Insert Auto
                                            </button>
                                            <button 
                                                onClick={() => onInjectImage(plan, 'cursor')}
                                                className="flex-1 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                                                title="Insert at current cursor position"
                                            >
                                                <MousePointerClick className="w-3 h-3" /> Cursor
                                            </button>
                                    </div>
                                )}
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};
