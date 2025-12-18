'use client';

import React from 'react';
import { X, Settings, Database, Cpu, Hash, RotateCcw, Save, Zap, Image as ImageIcon } from 'lucide-react';
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
        defaultModelAppearance,
        defaultDesignStyle,
        setDefaultModelAppearance,
        setDefaultDesignStyle,
        useRag,
        autoImagePlan,
        setUseRag,
        setAutoImagePlan,
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

                    {/* Image Appearance */}
                    <section className="space-y-4 pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-gray-900">
                            <ImageIcon className="w-5 h-5 text-pink-600" />
                            <h4 className="font-bold text-sm uppercase tracking-widest">Image Style & People</h4>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 ml-1">Default Model Appearance (People in Images)</label>
                            <textarea
                                value={defaultModelAppearance}
                                onChange={(e) => setDefaultModelAppearance(e.target.value)}
                                className="w-full h-24 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all resize-none"
                                placeholder="Describe the physical appearance of people (e.g., Asian female, professional attire...)"
                            />
                            <p className="text-[10px] text-gray-400 italic leading-tight">
                                This will be appended to all image prompts involving people to maintain consistency.
                            </p>
                        </div>

                        <div className="space-y-2 mt-4">
                            <label className="text-xs font-bold text-gray-500 ml-1">Default Infographic Design Style</label>
                            <textarea
                                value={defaultDesignStyle}
                                onChange={(e) => setDefaultDesignStyle(e.target.value)}
                                className="w-full h-24 px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-pink-500/10 focus:border-pink-500 outline-none transition-all resize-none"
                                placeholder="Describe the design style for infographics (e.g., Minimalist flat design, clean lines...)"
                            />
                            <p className="text-[10px] text-gray-400 italic leading-tight">
                                This will be applied to all infographic-related prompts.
                            </p>
                        </div>
                    </section>

                    {/* Generation Preferences */}
                    <section className="space-y-4 pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-2 text-gray-900">
                            <Zap className="w-5 h-5 text-amber-600" />
                            <h4 className="font-bold text-sm uppercase tracking-widest">Generation Preferences</h4>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/50 hover:bg-white hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${useRag ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                        <Database className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-800">Knowledge Base (RAG)</span>
                                        <span className="text-[10px] text-gray-500 font-medium leading-tight">Use uploaded brand guidelines for accuracy</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setUseRag(!useRag)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none ${useRag ? 'bg-indigo-600 shadow-inner' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${useRag ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100/50 hover:bg-white hover:shadow-sm transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${autoImagePlan ? 'bg-emerald-100 text-emerald-600' : 'bg-white text-gray-400 border border-gray-100'}`}>
                                        <ImageIcon className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-gray-800">Auto Visual Plan</span>
                                        <span className="text-[10px] text-gray-500 font-medium leading-tight">Automatically script images after writing</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAutoImagePlan(!autoImagePlan)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none ${autoImagePlan ? 'bg-emerald-600 shadow-inner' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${autoImagePlan ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
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
