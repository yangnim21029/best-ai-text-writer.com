import React, { useState } from 'react';
import { Image as ImageIcon, Loader2, X, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ImageGeneratorModalProps {
    show: boolean;
    imagePrompts: string[];
    onPromptChange: (index: number, value: string) => void;
    onSubmit: (selectedPrompt: string) => void;
    isLoading: boolean;
    onClose: () => void;
}

export const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = ({
    show,
    imagePrompts,
    onPromptChange,
    onSubmit,
    isLoading,
    onClose,
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    if (!show) return null;

    const prompts = Array.isArray(imagePrompts) ? imagePrompts : [imagePrompts];

    return (
        <div
            className="fixed z-[100] inset-0 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-pink-50/50 to-white">
                    <div className="flex items-center space-x-3 text-pink-600">
                        <div className="w-8 h-8 rounded-xl bg-pink-100 flex items-center justify-center">
                            <ImageIcon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest">
                            AI Image Generator (Nano Banana)
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">
                            Select a Prompt Direction
                        </label>

                        <div className="space-y-3">
                            {prompts.map((p, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedIndex(idx)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-2xl border transition-all relative group",
                                        selectedIndex === idx
                                            ? "border-pink-500 bg-pink-50/30 ring-4 ring-pink-500/5 shadow-sm"
                                            : "border-gray-100 bg-gray-50/50 hover:border-gray-200 hover:bg-gray-50"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "mt-1 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors",
                                            selectedIndex === idx ? "bg-pink-600 border-pink-600 text-white" : "bg-white border-gray-200 text-transparent"
                                        )}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <p className={cn(
                                            "text-sm leading-relaxed",
                                            selectedIndex === idx ? "text-gray-900 font-medium" : "text-gray-600"
                                        )}>
                                            {p}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {prompts[selectedIndex] !== undefined && (
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                                Refine Selected Prompt
                            </label>
                            <textarea
                                value={prompts[selectedIndex]}
                                onChange={(e) => onPromptChange(selectedIndex, e.target.value)}
                                className="w-full h-32 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm focus:border-pink-500 focus:ring-4 focus:ring-pink-500/5 outline-none resize-none transition-all font-medium"
                                placeholder="Edit the prompt here..."
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(prompts[selectedIndex])}
                        disabled={isLoading || !prompts[selectedIndex]}
                        className="flex items-center gap-2 px-8 py-2.5 bg-pink-600 text-white rounded-2xl text-sm font-black shadow-xl shadow-pink-200 hover:bg-pink-700 hover:shadow-pink-300 active:scale-95 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        Generate Image
                    </button>
                </div>
            </div>
        </div>
    );
};
