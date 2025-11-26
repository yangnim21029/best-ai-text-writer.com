import React from 'react';
import { Image as ImageIcon, Loader2, X } from 'lucide-react';

interface ImageGeneratorModalProps {
    show: boolean;
    imagePrompt: string;
    onPromptChange: (value: string) => void;
    onSubmit: () => void;
    isLoading: boolean;
    onClose: () => void;
}

export const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = ({
    show,
    imagePrompt,
    onPromptChange,
    onSubmit,
    isLoading,
    onClose,
}) => {
    if (!show) return null;

    return (
        <div
            className="absolute z-50 bg-white rounded-lg shadow-2xl border border-gray-200 w-96 p-4 animate-in fade-in zoom-in-95 duration-200"
            style={{ top: 50, right: 10 }}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-pink-600">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wide">
                        AI Image Generator (Nano Banana)
                    </span>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                </button>
            </div>

            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit();
                }}
                className="space-y-3"
            >
                <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Image Prompt</label>
                    <textarea
                        value={imagePrompt}
                        onChange={(e) => onPromptChange(e.target.value)}
                        className="w-full h-24 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none resize-none mt-1"
                        placeholder="Describe the image..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !imagePrompt}
                    className="w-full py-2 bg-pink-600 text-white rounded-lg text-sm font-semibold hover:bg-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    Generate Image
                </button>
            </form>
        </div>
    );
};
