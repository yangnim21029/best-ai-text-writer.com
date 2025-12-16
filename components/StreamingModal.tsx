import React, { useEffect, useRef } from 'react';
import { Loader2, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { GenerationStep } from '../types';
import { marked } from 'marked';

interface StreamingModalProps {
    isOpen: boolean;
    content: string;
    step: GenerationStep;
    onClose?: () => void; // Optional, mostly for dev or forced close
}

export const StreamingModal: React.FC<StreamingModalProps> = ({
    isOpen,
    content,
    step,
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [content]);

    if (!isOpen) return null;

    const getStepLabel = (s: GenerationStep) => {
        switch (s) {
            case 'writing_content': return 'AI 正在撰寫文章...';
            case 'refining_headings': return '正在優化標題 (H2/H3 Swap)...';
            case 'localizing_hk': return '正在套用香港市場用語...';
            case 'finalizing': return '正在完成最後修飾...';
            default: return 'AI 正在思考...';
        }
    };

    const isRefining = step === 'refining_headings';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isRefining ? 'bg-purple-100' : 'bg-blue-100'}`}>
                            {isRefining ? (
                                <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
                            ) : (
                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                {getStepLabel(step)}
                            </h3>
                            <p className="text-xs text-gray-500">請稍候，文章生成中...</p>
                        </div>
                    </div>

                    {/* Progress Steps (Visual only) */}
                    <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                        <span className={`flex items-center gap-1 ${step === 'writing_content' ? 'text-blue-600' : 'text-gray-600'}`}>
                            <FileText className="w-3 h-3" /> 撰寫
                        </span>
                        <span className="w-4 h-px bg-gray-300" />
                        <span className={`flex items-center gap-1 ${step === 'refining_headings' ? 'text-purple-600' : (step === 'finalizing' ? 'text-green-600' : '')}`}>
                            <Sparkles className="w-3 h-3" /> 優化
                        </span>
                        <span className="w-4 h-px bg-gray-300" />
                        <span className={`flex items-center gap-1 ${step === 'finalizing' ? 'text-green-600' : ''}`}>
                            <CheckCircle2 className="w-3 h-3" /> 完成
                        </span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative bg-white">
                    <div
                        ref={scrollRef}
                        className="absolute inset-0 overflow-y-auto p-8 custom-scrollbar scroll-smooth"
                    >
                        <div className="prose prose-lg max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-p:text-gray-600 prose-p:leading-relaxed">
                            <div dangerouslySetInnerHTML={{ __html: marked.parse(content || '') as string }} />

                            {/* Cursor Effect */}
                            <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse align-middle" />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-400">
                    AI 生成內容僅供參考，請務必人工審閱。
                </div>
            </div>
        </div>
    );
};
