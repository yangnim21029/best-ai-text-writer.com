import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Globe, Download, Loader2 } from 'lucide-react';
import { LoadingButton } from '../LoadingButton';

interface UrlInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (url: string) => Promise<void>;
    isLoading?: boolean;
}

export const UrlInputModal: React.FC<UrlInputModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false,
}) => {
    const [url, setUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!url.trim()) {
            setError('Please enter a valid URL');
            return;
        }

        try {
            setError(null);
            await onConfirm(url);
            onClose(); // Close on success if onConfirm resolves without error
        } catch (err) {
            // Error handling is likely done in parent, but good to have a catch
            console.error('Failed to import URL', err);
            // Keep modal open if error
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={() => !isLoading && onClose()}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden scale-100 animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                            <Globe className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Import from URL</h3>
                            <p className="text-[10px] text-slate-500 font-medium">Auto-extract content from any webpage</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider ml-1">
                            Website Link
                        </label>
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <Globe className="w-4 h-4" />
                            </div>
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => {
                                    setUrl(e.target.value);
                                    if (error) setError(null);
                                }}
                                placeholder="https://example.com/article..."
                                className={`w-full h-11 pl-10 pr-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-700 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all ${error ? 'border-red-300 bg-red-50/50 focus:border-red-500' : 'border-slate-200'
                                    }`}
                                autoFocus
                            />
                        </div>
                        {error && (
                            <p className="text-[11px] font-bold text-red-500 ml-1 animate-in slide-in-from-top-1">
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100/50">
                        <div className="flex gap-2">
                            <div className="w-1 h-full min-h-[24px] rounded-full bg-blue-400 flex-shrink-0" />
                            <p className="text-[10px] leading-relaxed text-slate-600 font-medium">
                                <span className="font-bold text-blue-700">Pro Tip:</span> The imported content will automatically populate the reference text area. You can still edit or convert it later.
                            </p>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-all"
                    >
                        Cancel
                    </button>
                    <LoadingButton
                        type="submit"
                        onClick={handleSubmit}
                        isLoading={isLoading}
                        disabled={!url.trim()}
                        icon={<Download className="w-4 h-4" />}
                        className="px-5 py-2 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/20"
                    >
                        Import Content
                    </LoadingButton>
                </div>
            </div>
        </div>,
        document.body
    );
};
