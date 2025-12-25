'use client';

import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { X, Sparkles, Wand2, FlaskConical, Target, FileText, Download, Copy, Database, MessageSquare, Bot, Activity, Play } from 'lucide-react';
import { LoadingButton } from '../LoadingButton';
import { runFullReplicationTestAction, runMixAndMatchReplicationAction } from '@/app/actions/analysis';

interface VoiceReplicationResult {
  voiceProfile: any;
  structure: any;
  targetSection: any;
  simulatedSource?: any;
  contentSourceData?: any;
  generatedContent: any;
  originalVoiceContent?: any;
  variations?: Array<{ id: string; label: string; data: any }>;
}

interface VoiceAnalysisLabProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceAnalysisLab: React.FC<VoiceAnalysisLabProps> = ({ isOpen, onClose }) => {
  const [voiceText, setVoiceText] = useState('');
  const [structureText, setStructureText] = useState('');
  const [contentText, setContentText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<VoiceReplicationResult | null>(null);
  const [viewMode, setViewMode] = useState<string>('full');
  const [copied, setCopied] = useState(false);

  // Safe Accessor for UI
  const variations = result?.variations || [
    { id: 'full', label: 'Replicated (Full)', data: result?.generatedContent },
    { id: 'original', label: 'Original (Source B)', data: result?.originalVoiceContent }
  ];

  const handleRunReplication = async () => {
    if (!voiceText.trim() || !structureText.trim() || !contentText.trim()) return;
    setIsProcessing(true);
    setResult(null);
    try {
      // Use the new Mix & Match Action
      const res = await runMixAndMatchReplicationAction(voiceText, structureText, contentText, 'zh-TW');
      console.log('Voice Lab Result:', res);
      setResult(res);
    } catch (e) {
      console.error(e);
      alert('Replication test failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = (data: any) => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-8 py-6 border-b border-indigo-100 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-indigo-100">
                      <FlaskConical className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <Dialog.Title as="h3" className="text-xl font-black text-slate-800">
                        Voice Replication Lab
                      </Dialog.Title>
                      <p className="text-xs text-slate-500 font-bold tracking-wider uppercase mt-1">Experimental Feature</p>
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
                      {/* A: Voice */}
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between">
                          <span>A. Voice Source</span>
                          <span className="text-slate-300 font-normal normal-case">Style/Tone</span>
                        </label>
                        <textarea
                          className="w-full h-32 p-3 bg-white border-2 border-slate-100 focus:border-purple-500 rounded-xl text-xs leading-relaxed outline-none resize-none transition-all custom-scrollbar placeholder:text-slate-300 font-medium shadow-sm"
                          placeholder="Paste URLs (one per line) or Article Text for VOICE..."
                          value={voiceText}
                          onChange={(e) => setVoiceText(e.target.value)}
                        />
                      </div>

                      {/* B: Structure */}
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between">
                          <span>B. Structure Source</span>
                          <span className="text-slate-300 font-normal normal-case">Layout/Flow</span>
                        </label>
                        <textarea
                          className="w-full h-32 p-3 bg-white border-2 border-slate-100 focus:border-blue-500 rounded-xl text-xs leading-relaxed outline-none resize-none transition-all custom-scrollbar placeholder:text-slate-300 font-medium shadow-sm"
                          placeholder="Paste URL or Article Text for STRUCTURE..."
                          value={structureText}
                          onChange={(e) => setStructureText(e.target.value)}
                        />
                      </div>

                      {/* C: Content */}
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex justify-between">
                          <span>C. Content Source</span>
                          <span className="text-slate-300 font-normal normal-case">Facts/Data</span>
                        </label>
                        <textarea
                          className="w-full h-32 p-3 bg-white border-2 border-slate-100 focus:border-emerald-500 rounded-xl text-xs leading-relaxed outline-none resize-none transition-all custom-scrollbar placeholder:text-slate-300 font-medium shadow-sm"
                          placeholder="Paste URL (simulates network fetch) or Text Facts..."
                          value={contentText}
                          onChange={(e) => setContentText(e.target.value)}
                        />
                      </div>

                      <LoadingButton
                        isLoading={isProcessing}
                        disabled={!voiceText.trim() || !structureText.trim() || !contentText.trim()}
                        onClick={handleRunReplication}
                        variant="primary"
                        icon={<Play className="w-4 h-4" />}
                        className="w-full py-4 rounded-xl shadow-lg shadow-indigo-200 mt-2"
                      >
                        Mix & Replicate
                      </LoadingButton>
                    </div>
                  </div>

                  {/* Right Column: Results Dashboard */}
                  <div className="flex-[2] p-8 overflow-y-auto custom-scrollbar bg-white">
                    {!result ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                        <FlaskConical className="w-16 h-16 opacity-50" />
                        <p className="text-sm font-medium">Ready to analyze & replicate</p>
                      </div>
                    ) : (
                      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* 1. Voice Profile */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-purple-600 uppercase tracking-widest flex items-center gap-2">
                              <Sparkles className="w-3.5 h-3.5" /> Extracted Voice Profile
                            </label>
                            <button onClick={() => handleCopy(result.voiceProfile)} className="text-[10px] font-bold text-slate-400 hover:text-purple-600 flex items-center gap-1"><Copy className="w-3 h-3" /> JSON</button>
                          </div>
                          <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100 flex flex-col gap-4">
                            {/* Row 1: High Level Vibe */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Tone & Human (Inactive)</p>
                                <p className="text-sm font-bold text-slate-500 mt-1">{result.voiceProfile.toneSensation}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Region Detect (Inactive)</p>
                                <p className="text-sm font-medium text-slate-500 mt-1">{result.voiceProfile.regionVoiceDetect}</p>
                              </div>
                            </div>
                            {/* Row 2: Human Touch & Strategy */}
                            <div className="grid grid-cols-2 gap-4 border-t border-purple-100/50 pt-3">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Human Touch (Inactive)</p>
                                <p className="text-xs font-medium text-slate-500 mt-1 leading-snug">{result.voiceProfile.humanWritingVoice}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-purple-400 uppercase">Strategy: Entry</p>
                                <p className="text-xs font-medium text-purple-800/80 mt-1 leading-snug">{result.voiceProfile.entryPoint || 'Direct entry'}</p>
                              </div>
                            </div>

                            {/* Row 3: Logic & Plans */}
                            <div className="space-y-3 border-t border-purple-100/50 pt-3">

                              {/* Semantic Logic (New) */}
                              {result.voiceProfile.logicStyle && result.voiceProfile.logicStyle.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 opacity-50" /> Logic Arc (Inactive)
                                  </p>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {result.voiceProfile.logicStyle.slice(0, 2).map((l: string, i: number) => (
                                      <span key={i} className="px-2 py-1 bg-white border border-purple-100 rounded text-[10px] text-purple-700 shadow-sm">{l}</span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div>
                                <p className="text-[10px] font-bold text-purple-400 uppercase">Strategy: Plan</p>
                                <ul className="list-disc list-inside mt-1 text-xs font-medium text-purple-800 space-y-1">
                                  {result.voiceProfile.generalPlan.slice(0, 3).map((p: string, i: number) => <li key={i}>{p}</li>)}
                                </ul>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-[10px] font-bold text-purple-400 uppercase">Sentence Flow</p>
                                  <ul className="list-disc list-inside mt-1 text-[10px] text-purple-800/70">
                                    {(result.voiceProfile.sentenceStartFeatures || []).slice(0, 2).map((p: string, i: number) => <li key={i}>{p}</li>)}
                                  </ul>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-purple-400 uppercase">Conversion</p>
                                  <ul className="list-disc list-inside mt-1 text-[10px] text-purple-800/70">
                                    {(result.voiceProfile.conversionPlan || []).slice(0, 2).map((p: string, i: number) => <li key={i}>{p}</li>)}
                                  </ul>
                                </div>
                              </div>

                              {/* NLP Keywords (New) */}
                              {result.voiceProfile.keywordPlans && result.voiceProfile.keywordPlans.length > 0 && (
                                <div className="border-t border-purple-100/50 pt-3">
                                  <p className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3" /> NLP Key Terms & Usage
                                  </p>
                                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {result.voiceProfile.keywordPlans.slice(0, 8).map((k: any, i: number) => (
                                      <div key={i} className="bg-white/50 p-2 rounded border border-purple-50">
                                        <div className="flex justify-between items-center mb-0.5">
                                          <p className="text-[10px] font-bold text-purple-700">{k.word}</p>
                                          {k.score && (
                                            <span className="text-[9px] font-mono text-purple-400 bg-purple-50 px-1 rounded">
                                              {Math.round(k.score * 100)}%
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[9px] text-purple-500 leading-tight">{k.plan?.[0] || 'Strategic usage'}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 2. Structure & Facts */}
                        <div className="space-y-3">
                          <label className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <Database className="w-3.5 h-3.5" /> Extracted Structure & Facts
                          </label>
                          <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 text-xs text-slate-700">
                            <div className="flex items-center gap-2 mb-3">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-bold">Target Section</span>
                              <span className="font-black text-sm">{result.targetSection.title}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
                                <p className="font-bold text-blue-400 mb-1 uppercase text-[10px]">Writing Guide</p>
                                <div className="space-y-1">
                                  <div className="flex justify-between border-b border-slate-50 pb-1">
                                    <span className="text-slate-500">Mode</span>
                                    <span className="font-bold text-slate-700 uppercase">{result.targetSection.writingMode || 'DIRECT'}</span>
                                  </div>
                                  <div className="flex justify-between border-b border-slate-50 pb-1 opacity-50">
                                    <span className="text-slate-500">Difficulty (Inactive)</span>
                                    <span className="font-bold text-slate-700 capitalize">{result.targetSection.difficulty || 'Medium'}</span>
                                  </div>
                                  <div className="opacity-50" title="This parameter is currently ignored during generation">
                                    <span className="text-slate-500 block mb-0.5">Focus (Inactive)</span>
                                    <p className="font-bold text-slate-700 leading-snug">{result.targetSection.coreFocus || 'Informative'}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="p-3 bg-white rounded-xl border border-blue-100 shadow-sm col-span-2">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Logic Arc (Inactive)</p>
                                <p className="text-[11px] font-medium text-slate-500 leading-relaxed line-clamp-2">
                                  {result.voiceProfile.logicStyle ? result.voiceProfile.logicStyle[0] : 'N/A'}
                                </p>
                                {result.targetSection.instruction && (
                                  <div className="mb-2 p-2 bg-slate-50 rounded text-[11px] text-slate-600 border border-slate-100">
                                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Instruction</span>
                                    {result.targetSection.instruction}
                                  </div>
                                )}
                                {result.targetSection.narrativePlan && result.targetSection.narrativePlan.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="font-bold text-slate-400 uppercase text-[9px] block">Narrative Action Plan</span>
                                    <ul className="list-decimal list-inside text-[10px] text-slate-600 space-y-0.5">
                                      {result.targetSection.narrativePlan.map((step: string, i: number) => (
                                        <li key={i}>{step}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                              <div>
                                <p className="font-bold text-blue-400 mb-1 uppercase text-[10px]">H3 Structure & Facts</p>
                                {result.targetSection.subheadings && result.targetSection.subheadings.length > 0 ? (
                                  <ul className="list-disc list-inside space-y-1 text-blue-900/80 font-bold mb-2">
                                    {result.targetSection.subheadings.map((h3: string, i: number) => <li key={i}>{h3}</li>)}
                                  </ul>
                                ) : <p className="text-slate-400 italic mb-2">No H3 subheadings</p>}

                                <p className="font-bold text-blue-300 mb-1 uppercase text-[10px]">Key Facts (Source B)</p>
                                <ul className="list-disc list-inside space-y-1 text-blue-900/80">
                                  {result.targetSection.keyFacts?.slice(0, 3).map((f: string, i: number) => <li key={i}>{f}</li>) || <li className="text-slate-400">No facts in B</li>}
                                </ul>
                              </div>
                              <div>
                                <p className="font-bold text-emerald-500 mb-1 uppercase text-[10px]">Content Payload (Source C)</p>
                                <ul className="list-disc list-inside space-y-1 text-emerald-900/80">
                                  {(result.simulatedSource?.facts || result.contentSourceData?.keyInformationPoints || []).slice(0, 5).map((f: string, i: number) => <li key={i}>{f}</li>)}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 3. Generated Content with Variations */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                              <Bot className="w-3.5 h-3.5" />
                              Final Output ({variations.find(v => v.id === viewMode)?.label})
                            </label>

                            {/* Copy Button */}
                            <button
                              onClick={() => {
                                const activeContent = variations.find(v => v.id === viewMode)?.data?.content;
                                if (activeContent) handleCopy(activeContent);
                              }}
                              className="text-[10px] font-bold text-slate-400 hover:text-indigo-600 flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" /> Copy
                            </button>
                          </div>

                          {/* Variation Tabs */}
                          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/50 rounded-xl">
                            <p className="text-[10px] font-bold text-purple-300 uppercase mr-2">Voice A:</p>
                            {variations.filter(v =>
                              !v.id.startsWith('rag_') &&
                              v.id !== 'original' &&
                              !['no_difficulty', 'no_mode', 'no_narrative'].includes(v.id)
                            ).map((v) => (
                              <button
                                key={v.id}
                                onClick={() => setViewMode(v.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${viewMode === v.id
                                  ? 'bg-white text-purple-700 shadow-sm border-purple-100'
                                  : 'text-slate-500 hover:bg-white/50 border-transparent'
                                  }`}
                              >
                                {v.label}
                              </button>
                            ))}
                          </div>



                          {/* Structure B Ablations (Deep Logic) */}
                          <div className="flex flex-wrap gap-1.5 p-1 bg-yellow-50/50 rounded-xl mt-2 border-t border-yellow-100">
                            <p className="text-[10px] font-bold text-yellow-600 uppercase mr-2">Structure B:</p>
                            {variations.filter(v => ['no_difficulty', 'no_mode', 'no_narrative'].includes(v.id)).map((v) => (
                              <button
                                key={v.id}
                                onClick={() => setViewMode(v.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${viewMode === v.id
                                  ? 'bg-white text-yellow-700 shadow-sm border-yellow-100'
                                  : 'text-slate-500 hover:bg-white/50 border-transparent'
                                  }`}
                              >
                                {v.label}
                              </button>
                            ))}
                          </div>

                          {/* RAG Variations Group */}
                          <div className="flex flex-wrap gap-2 items-center border-t border-slate-100 pt-2 mt-2">
                            <p className="text-[10px] font-bold text-slate-300 uppercase mr-2">Source B (RAG):</p>
                            <button
                              onClick={() => setViewMode('original')}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${viewMode === 'original'
                                ? 'bg-white text-indigo-700 shadow-sm border-indigo-100'
                                : 'text-slate-500 hover:bg-white/50 border-transparent'
                                }`}
                            >
                              Original (Default)
                            </button>
                            {variations.filter(v => v.id.startsWith('rag_')).map((v) => (
                              <button
                                key={v.id}
                                onClick={() => setViewMode(v.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${viewMode === v.id
                                  ? 'bg-white text-indigo-700 shadow-sm border-indigo-100'
                                  : 'text-slate-500 hover:bg-white/50 border-transparent'
                                  }`}
                              >
                                {v.label}
                              </button>
                            ))}
                          </div>

                          {/* Display Area */}
                          <div className="p-6 bg-white rounded-2xl border border-indigo-100 shadow-sm min-h-[300px]">
                            {/* Optional Header for context */}
                            {result.targetSection?.title && (
                              <div className="mb-4 pb-3 border-b border-slate-50">
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Targeting Section</p>
                                <p className="text-sm font-bold text-slate-700">{result.targetSection.title}</p>
                              </div>
                            )}

                            <div className="prose prose-sm max-w-none prose-headings:font-bold prose-headings:text-indigo-900 prose-p:text-slate-600 prose-p:leading-relaxed">
                              {variations.find(v => v.id === viewMode)?.data?.content ? (
                                <div dangerouslySetInnerHTML={{
                                  __html: variations.find(v => v.id === viewMode)?.data?.content.replace(/\n/g, '<br />') || ''
                                }} />
                              ) : (
                                <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-xs">
                                  <Activity className="w-5 h-5 mb-2 opacity-20" />
                                  <p>Content generating...</p>
                                </div>
                              )}
                            </div>

                            {/* Prompt Comment / Debug Info */}
                            {variations.find(v => v.id === viewMode)?.data?.comment && (
                              <div className="mt-8 pt-4 border-t border-slate-50">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">AI Logic Note</p>
                                <p className="text-xs text-slate-500 italic">
                                  "{variations.find(v => v.id === viewMode)?.data?.comment}"
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <div className="flex-1 p-3 bg-yellow-50 rounded-xl border border-yellow-100 text-[10px] text-yellow-800 font-medium">
                            <span className="font-bold block mb-1">🤖 AI Reasoning:</span> {result?.generatedContent?.comment}
                          </div>
                          <div className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-600 font-medium">
                            <span className="font-bold block mb-1">💉 Injections:</span> {result?.generatedContent?.usedPoints?.length || 0} points used, {result?.generatedContent?.injectedCount || 0} product mentions.
                          </div>
                        </div>
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
