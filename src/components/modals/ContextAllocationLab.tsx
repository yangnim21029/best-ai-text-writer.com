'use client';

import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Layout, FileText, Play, Database, Scale, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { LoadingButton } from '../LoadingButton';
import { compareAllocationStrategiesAction } from '@/app/actions/analysis';

interface ContextAllocationLabProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ContextAllocationLab: React.FC<ContextAllocationLabProps> = ({ isOpen, onClose }) => {
    const [sourceText, setSourceText] = useState('');
    const [sectionsText, setSectionsText] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{ legacy: Record<string, string>; exclusive: Record<string, string> } | null>(null);

    const handleRunComparison = async () => {
        if (!sourceText.trim() || !sectionsText.trim()) return;
        setIsProcessing(true);
        setResult(null);
        try {
            const sections = sectionsText.split('\n').filter(s => s.trim()).map(s => ({ title: s.trim() }));
            const res = await compareAllocationStrategiesAction(sourceText, sections);
            setResult(res);
        } catch (e) {
            console.error(e);
            alert('Comparison failed. See console.');
        } finally {
            setIsProcessing(false);
        }
    };

    const sectionKeys = result ? Object.keys(result.legacy) : [];

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[70]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-7xl transform overflow-hidden rounded-[2rem] bg-white shadow-2xl transition-all border border-slate-200 flex flex-col max-h-[90vh]">
                                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-8 py-6 border-b border-emerald-100 flex items-center justify-between flex-shrink-0">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-xl shadow-sm border border-emerald-100">
                                            <Scale className="w-6 h-6 text-emerald-600" />
                                        </div>
                                        <div>
                                            <Dialog.Title as="h3" className="text-xl font-black text-slate-800">
                                                Context Allocation Lab
                                            </Dialog.Title>
                                            <p className="text-xs text-slate-500 font-bold tracking-wider uppercase mt-1">Global vs Individual Strategy</p>
                                        </div>
                                    </div>
                                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/50 text-slate-400 hover:text-slate-600 transition-colors">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
                                    {/* Left Column: Input & Controls */}
                                    <div className="flex-1 p-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar border-b lg:border-b-0 lg:border-r border-slate-100 lg:max-w-md bg-slate-50/30">
                                        <div className="flex flex-col gap-4">
                                            {/* Source Text */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Database className="w-3.5 h-3.5" /> Source Content
                                                </label>
                                                <textarea
                                                    className="w-full h-48 p-3 bg-white border-2 border-slate-100 focus:border-emerald-500 rounded-xl text-xs leading-relaxed outline-none resize-none transition-all custom-scrollbar placeholder:text-slate-300 font-medium shadow-sm"
                                                    placeholder="Paste the full reference article text here..."
                                                    value={sourceText}
                                                    onChange={(e) => setSourceText(e.target.value)}
                                                />
                                            </div>

                                            {/* Sections */}
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Layout className="w-3.5 h-3.5" /> Sections (One per line)
                                                </label>
                                                <textarea
                                                    className="w-full h-48 p-3 bg-white border-2 border-slate-100 focus:border-teal-500 rounded-xl text-xs leading-relaxed outline-none resize-none transition-all custom-scrollbar placeholder:text-slate-300 font-medium shadow-sm"
                                                    placeholder="Introduction&#10;Benefits of AI&#10;Future Trends&#10;Conclusion"
                                                    value={sectionsText}
                                                    onChange={(e) => setSectionsText(e.target.value)}
                                                />
                                            </div>

                                            <LoadingButton
                                                isLoading={isProcessing}
                                                disabled={!sourceText.trim() || !sectionsText.trim()}
                                                onClick={handleRunComparison}
                                                variant="primary"
                                                icon={<Play className="w-4 h-4" />}
                                                className="w-full py-4 rounded-xl shadow-lg shadow-emerald-200 mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 border-none"
                                            >
                                                Compare Strategies
                                            </LoadingButton>
                                        </div>
                                    </div>

                                    {/* Right Column: Results Dashboard */}
                                    <div className="flex-[2] p-8 overflow-y-auto custom-scrollbar bg-white">
                                        {!result ? (
                                            <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                                                <Scale className="w-16 h-16 opacity-50" />
                                                <p className="text-sm font-medium">Ready to compare allocation strategies</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div className="p-3 bg-slate-100 rounded-xl text-center">
                                                        <h4 className="font-black text-slate-500 uppercase text-xs">Legacy Strategy</h4>
                                                        <p className="text-[10px] text-slate-400">Independent Retrieval (High Overlap)</p>
                                                    </div>
                                                    <div className="p-3 bg-emerald-100 rounded-xl text-center">
                                                        <h4 className="font-black text-emerald-700 uppercase text-xs">New Strategy</h4>
                                                        <p className="text-[10px] text-emerald-600/70">Global Exclusive (Zero Overlap Attempt)</p>
                                                    </div>
                                                </div>

                                                {sectionKeys.map((title, idx) => {
                                                    const legacyCtx = result.legacy[title] || '';
                                                    const exclusiveCtx = result.exclusive[title] || '';
                                                    const isLegacyEmpty = !legacyCtx.trim();
                                                    const isExclusiveEmpty = !exclusiveCtx.trim();
                                                    const score = 0; // Placeholder for similarity score if we had it

                                                    return (
                                                        <div key={idx} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                                            <div className="bg-slate-50/50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                                                                    <h4 className="font-bold text-slate-700 text-sm">{title}</h4>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 divide-x divide-slate-100">
                                                                {/* Legacy */}
                                                                <div className="p-4 bg-white">
                                                                    {isLegacyEmpty ? (
                                                                        <div className="text-slate-300 text-xs italic">No context found</div>
                                                                    ) : (
                                                                        <div className="text-[10px] text-slate-600 leading-relaxed max-h-[200px] overflow-y-auto custom-scrollbar whitespace-pre-wrap">
                                                                            {legacyCtx}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Exclusive */}
                                                                <div className={`p-4 ${isExclusiveEmpty ? 'bg-amber-50/30' : 'bg-emerald-50/10'}`}>
                                                                    {isExclusiveEmpty ? (
                                                                        <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
                                                                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                                                                            <span className="text-xs font-bold text-amber-400">No Allocation (Context Exhausted?)</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="relative">
                                                                            <div className="absolute top-0 right-0">
                                                                                <CheckCircle2 className="w-4 h-4 text-emerald-500 opacity-20" />
                                                                            </div>
                                                                            <div className="text-[10px] text-slate-700 leading-relaxed max-h-[200px] overflow-y-auto custom-scrollbar whitespace-pre-wrap font-medium">
                                                                                {exclusiveCtx}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div >
            </Dialog >
        </Transition >
    );
};
