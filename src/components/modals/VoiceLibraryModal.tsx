import React, { useState } from 'react';
import { Mic, Globe, Sparkles, Trash2, CheckCircle2, FlaskConical, Plus, MessageSquare } from 'lucide-react';
import { SavedVoiceProfile, TargetAudience } from '@/types';
import { GenericLibraryModal } from './GenericLibraryModal';
import { LoadingButton } from '../LoadingButton';
import { createVoiceProfileAction } from '@/app/actions/analysis';

interface VoiceLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    profiles: SavedVoiceProfile[];
    activeProfileId?: string;
    onSelect: (profileId: string) => void;
    onDelete: (id: string) => void;
    onCreate: (data: { name: string; sources: string[]; voiceData: any }) => void;
}

const VoiceCreationForm = ({ onCreate, onCancel }: { onCreate: (data: { name: string; sources: string[]; voiceData: any }) => void; onCancel: () => void }) => {
    const [name, setName] = useState('');
    const [urls, setUrls] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [status, setStatus] = useState<string>('');

    const handleAnalyze = async () => {
        if (!name.trim()) {
            alert('Please name your voice profile.');
            return;
        }
        const sourceUrls = urls.split('\n').map(u => u.trim()).filter(u => u.length > 0);
        if (sourceUrls.length === 0) {
            alert('Please enter at least one URL.');
            return;
        }

        setIsAnalyzing(true);
        setStatus('Fetching source content...');

        try {
            let combinedContent = '';

            // 1. Scrape All URLs
            for (const url of sourceUrls) {
                setStatus(`Fetching: ${url}`);
                const res = await fetch('/api/scrape', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                if (!res.ok) continue;
                const data = await res.json();
                // Limit context to avoid overflow (~3000 chars per source)
                combinedContent += `\n\n--- Source: ${url} ---\n` + (data.content || '').slice(0, 5000);
            }

            if (combinedContent.length < 100) {
                throw new Error('Could not extract enough content from provided URLs.');
            }

            // 2. Analyze Voice
            setStatus('Analyzing Voice DNA...');
            const voiceData = await createVoiceProfileAction(combinedContent, 'zh-TW'); // Defaulting to TW for analysis base, adjustable later?

            if (!voiceData) throw new Error('Voice analysis failed.');

            // 3. Complete
            onCreate({
                name,
                sources: sourceUrls,
                voiceData: voiceData.data || voiceData // Fallback if already unwrapped
            });

        } catch (e: any) {
            alert(`Error: ${e.message}`);
            setStatus('');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="p-4 bg-purple-50 rounded-2xl border-2 border-purple-200 space-y-4 animate-in slide-in-from-top-2">
            <h4 className="text-[10px] font-black text-purple-600 uppercase tracking-widest">New Voice Profile</h4>

            <div className="space-y-3">
                <div>
                    <label className="text-[10px] font-bold text-purple-400 uppercase mb-1 block">Profile Name</label>
                    <input autoFocus type="text" placeholder="e.g., Apple Style, Casual Blog" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-white border border-purple-100 rounded-xl text-xs outline-none focus:ring-4 focus:ring-purple-500/10" />
                </div>

                <div>
                    <label className="text-[10px] font-bold text-purple-400 uppercase mb-1 block">Source URLs (One per line)</label>
                    <textarea
                        placeholder="https://example.com/article1&#10;https://example.com/article2"
                        value={urls}
                        onChange={e => setUrls(e.target.value)}
                        className="w-full h-24 px-3 py-2 bg-white border border-purple-100 rounded-xl text-xs outline-none focus:ring-4 focus:ring-purple-500/10 resize-none"
                        spellCheck={false}
                    />
                </div>
            </div>

            <div className="flex gap-2 pt-2">
                <LoadingButton
                    isLoading={isAnalyzing}
                    loadingText={status}
                    onClick={handleAnalyze}
                    className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-bold hover:bg-purple-700 transition-all icon-white"
                    icon={<Sparkles className="w-3 h-3" />}
                >
                    Analyze & Create Voice
                </LoadingButton>
                <button onClick={onCancel} disabled={isAnalyzing} className="px-3 py-2 bg-white text-slate-500 border border-slate-200 rounded-xl text-[10px] font-bold hover:bg-slate-50 transition-all">Cancel</button>
            </div>
        </div>
    );
};

export const VoiceLibraryModal: React.FC<VoiceLibraryModalProps> = ({
    isOpen, onClose, profiles, activeProfileId, onSelect, onDelete, onCreate
}) => {
    return (
        <GenericLibraryModal
            isOpen={isOpen}
            onClose={onClose}
            title="Voice Library"
            subtitle="Analyze and save unique writing styles from multiple sources."
            icon={<Mic className="w-8 h-8 text-purple-600" />}
            items={profiles}
            activeItemId={activeProfileId}
            onSelect={(p) => onSelect(p.id)}
            onDelete={onDelete}
            createButtonLabel="Add New Voice"
            searchPlaceholder="Search voices..."
            renderCreateForm={(handleCreate, onCancel) => (
                <VoiceCreationForm onCreate={handleCreate} onCancel={onCancel} />
            )}
            onCreate={(data: any) => onCreate(data)}
            renderItem={(p, isActive) => (
                <div className={`group relative bg-white border-b last:border-0 p-4 transition-all hover:bg-slate-50 flex items-center gap-4 ${isActive ? 'bg-purple-50/50 hover:bg-purple-50' : ''}`}>

                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors shrink-0 ${isActive ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200' : 'bg-white border-slate-100 text-slate-400 group-hover:border-slate-200'}`}>
                        <Mic className="w-5 h-5" />
                    </div>

                    {/* Content Info */}
                    <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
                        {/* Name */}
                        <div className="col-span-12 sm:col-span-6 min-w-0">
                            <div className="flex items-center gap-2">
                                <h3 className={`text-sm font-bold truncate ${isActive ? 'text-purple-900' : 'text-slate-800'}`}>{p.name}</h3>
                                {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{p.sources.length} sources analyzed</p>
                        </div>

                        {/* Preview */}
                        <div className="col-span-12 sm:col-span-6 min-w-0">
                            {p.voiceData.toneSensation ? (
                                <div className="flex flex-wrap gap-1">
                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] border border-slate-200">{p.voiceData.toneSensation.split(' ')[0]}</span>
                                    {p.voiceData.humanWritingVoice && (
                                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] border border-slate-200 truncate max-w-[100px]">{p.voiceData.humanWritingVoice.slice(0, 15)}...</span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-[10px] text-slate-300 italic">No analysis data</span>
                            )}
                        </div>
                    </div>

                    {/* Delete (Hover) */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                </div>
            )}
            renderDetail={(p) => {
                if (!p) return null;
                return (
                    <>
                        <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
                            <div className="w-16 h-16 rounded-3xl bg-purple-50 flex items-center justify-center border-2 border-purple-100 shrink-0"><Mic className="w-8 h-8 text-purple-600" /></div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-black text-slate-900 mb-1">{p.name}</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{p.sources.length} Sources Analyzed</p>
                            </div>
                        </div>

                        <div className="py-6 space-y-6">
                            {/* Detailed Voice Analysis Grid */}
                            <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-100 flex flex-col gap-4">
                                {/* Row 1: High Level Vibe */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Tone & Sensation</p>
                                        <p className="text-sm font-bold text-slate-500 mt-1">{p.voiceData.toneSensation || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Region Detect</p>
                                        <p className="text-sm font-medium text-slate-500 mt-1">{p.voiceData.regionVoiceDetect || 'Global'}</p>
                                    </div>
                                </div>
                                {/* Row 2: Human Touch & Strategy */}
                                <div className="grid grid-cols-2 gap-4 border-t border-purple-100/50 pt-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Writing Persona</p>
                                        <p className="text-xs font-medium text-slate-500 mt-1 leading-snug">{p.voiceData.humanWritingVoice || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-purple-400 uppercase">Strategy: Entry</p>
                                        <p className="text-xs font-medium text-purple-800/80 mt-1 leading-snug">{p.voiceData.entryPoint || 'Direct entry'}</p>
                                    </div>
                                </div>

                                {/* Row 3: Logic & Plans */}
                                <div className="space-y-3 border-t border-purple-100/50 pt-3">

                                    {/* Semantic Logic */}
                                    {p.voiceData.logicStyle && p.voiceData.logicStyle.length > 0 && (
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                <Sparkles className="w-3 h-3 opacity-50" /> Logic Arc
                                            </p>
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {p.voiceData.logicStyle.slice(0, 2).map((l: string, i: number) => (
                                                    <span key={i} className="px-2 py-1 bg-white border border-purple-100 rounded text-[10px] text-purple-700 shadow-sm">{l}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <p className="text-[10px] font-bold text-purple-400 uppercase">Strategy: Plan</p>
                                        <ul className="list-disc list-inside mt-1 text-xs font-medium text-purple-800 space-y-1">
                                            {(p.voiceData.generalPlan || []).slice(0, 3).map((plan: string, i: number) => <li key={i}>{plan}</li>)}
                                        </ul>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-purple-400 uppercase">Sentence Flow</p>
                                            <ul className="list-disc list-inside mt-1 text-[10px] text-purple-800/70">
                                                {(p.voiceData.sentenceStartFeatures || []).slice(0, 2).map((s: string, i: number) => <li key={i}>{s}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-purple-400 uppercase">Conversion</p>
                                            <ul className="list-disc list-inside mt-1 text-[10px] text-purple-800/70">
                                                {(p.voiceData.conversionPlan || []).slice(0, 2).map((c: string, i: number) => <li key={i}>{c}</li>)}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* NLP Keywords */}
                                    {p.voiceData.keywordPlans && p.voiceData.keywordPlans.length > 0 && (
                                        <div className="border-t border-purple-100/50 pt-3">
                                            <p className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" /> NLP Key Terms & Usage
                                            </p>
                                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {p.voiceData.keywordPlans.slice(0, 8).map((k: any, i: number) => (
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

                            {/* Sources List */}
                            {p.sources.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Sources</label>
                                    <div className="space-y-1">
                                        {p.sources.map((s, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs text-slate-500 truncate">
                                                <Globe className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{s}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                            <button onClick={() => onSelect(p.id)} className="w-full py-4 bg-purple-600 text-white rounded-2xl text-sm font-black hover:bg-purple-700 transition-all shadow-xl shadow-purple-200 active:scale-95">
                                Use This Voice
                            </button>
                        </div>
                    </>
                );
            }}
        />
    );
};
