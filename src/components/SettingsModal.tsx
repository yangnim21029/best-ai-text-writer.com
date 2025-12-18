'use client';

import React from 'react';
import { X, Settings, Database, Cpu, Hash, RotateCcw, Save } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface SettingsModalProps {
    open: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
    const {
        modelFlash,
        modelImage,
        keywordCharDivisor,
        minKeywords,
        maxKeywords,
        setModelFlash,
        setModelImage,
        setKeywordCharDivisor,
        setMinKeywords,
        setMaxKeywords,
        resetSettings: resetToDefaults
    } = useAppStore();

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={onClose} />

            <div className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-50 bg-gradient-to-br from-gray-50 to-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-900 text-white flex items-center justify-center shadow-xl shadow-gray-200">
                            <Settings className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">System Settings</h3>
                            <p className="text-sm text-gray-500 font-medium">Configure models and magic numbers</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Model Config */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-gray-900">
                            <Cpu className="w-5 h-5 text-blue-600" />
                            <h4 className="font-bold text-sm uppercase tracking-widest">AI Core Models</h4>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 ml-1">Text Analysis & Writing (FLASH)</label>
                                <input
                                    type="text"
                                    value={modelFlash}
                                    onChange={(e) => setModelFlash(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-mono focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. gemini-3-flash-preview"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 ml-1">Vision & Image Understanding</label>
                                <input
                                    type="text"
                                    value={modelImage}
                                    onChange={(e) => setModelImage(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-mono focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                    placeholder="e.g. google/gemini-2.5-flash-image"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Magic Numbers */}
                    <section className="space-y-4 pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-gray-900">
                            <Hash className="w-5 h-5 text-emerald-600" />
                            <h4 className="font-bold text-sm uppercase tracking-widest">Keyword Logic (NLP)</h4>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                                <label className="text-xs font-bold text-gray-500 ml-1">Char count divisor (1 keyword per X chars)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="50"
                                        max="1000"
                                        step="50"
                                        value={keywordCharDivisor}
                                        onChange={(e) => setKeywordCharDivisor(parseInt(e.target.value))}
                                        className="flex-1 accent-gray-900"
                                    />
                                    <span className="w-12 text-center font-bold text-gray-900 bg-gray-50 py-1 rounded-lg border border-gray-100">{keywordCharDivisor}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 ml-1">Min Keywords</label>
                                <input
                                    type="number"
                                    value={minKeywords}
                                    onChange={(e) => setMinKeywords(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 ml-1">Max Keywords</label>
                                <input
                                    type="number"
                                    value={maxKeywords}
                                    onChange={(e) => setMaxKeywords(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 italic leading-tight">
                            Calculation: limit = clamp(min, max, floor(content_length / divisor))
                        </p>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between">
                    <button
                        onClick={resetToDefaults}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset Defaults
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onClose}
                            className="flex items-center gap-2 px-8 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-2xl shadow-xl shadow-gray-200 hover:shadow-gray-300 active:scale-95 transition-all"
                        >
                            <Save className="w-4 h-4" />
                            Save Config
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
