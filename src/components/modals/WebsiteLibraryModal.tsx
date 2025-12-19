import React, { useState } from 'react';
import { Search, Globe, LayoutTemplate, Briefcase, Trash2, CheckCircle2, MoreVertical, Plus, X, BookOpen, Link2, FileUp, Slack, FolderOpen, FileText } from 'lucide-react';
import { SavedProfile, TargetAudience } from '@/types';

interface WebsiteLibraryModalProps {
    isOpen: boolean;
    onClose: () => void;
    profiles: SavedProfile[];
    activeProfileId?: string;
    onSelect: (profile: SavedProfile) => void;
    onDelete: (id: string) => void;
    onCreate: (name: string, siteUrl?: string) => void;
    onUpdate?: (id: string, updates: Partial<SavedProfile>) => void;
    onRename?: (id: string, newName: string) => void;
    onAnalyzeSite?: (url: string) => Promise<{ websiteType: string; authorityTerms: string }>;
}

const getRegionInfo = (code: TargetAudience) => {
    switch (code) {
        case 'zh-TW': return { flag: '🇹🇼', name: 'Taiwan' };
        case 'zh-HK': return { flag: '🇭🇰', name: 'Hong Kong' };
        case 'zh-MY': return { flag: '🇲🇾', name: 'Malaysia' };
        default: return { flag: '🌐', name: 'Global' };
    }
};

export const WebsiteLibraryModal: React.FC<WebsiteLibraryModalProps> = ({
    isOpen,
    onClose,
    profiles,
    activeProfileId,
    onSelect,
    onDelete,
    onCreate,
    onUpdate,
    onAnalyzeSite,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newSiteUrl, setNewSiteUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

    if (!isOpen) return null;

    const filteredProfiles = profiles.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.websiteType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.siteUrl || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreate = () => {
        if (newName.trim()) {
            onCreate(newName.trim(), newSiteUrl.trim());
            setNewName('');
            setNewSiteUrl('');
            setIsCreating(false);
        }
    };

    const handleAnalyze = async (url: string, targetId?: string) => {
        if (!url || !onAnalyzeSite) return;
        setIsAnalyzing(true);
        try {
            const result = await onAnalyzeSite(url);
            if (targetId && onUpdate) {
                onUpdate(targetId, { ...result, siteUrl: url });
            } else if (isCreating) {
                // If we are in the creation flyout, we can't easily auto-fill without more state, 
                // but for now let's just alert or handle if we add more creation fields
                alert(`Analysis complete: ${result.websiteType}. Save the profile to apply.`);
            }
        } catch (e) {
            alert('Failed to analyze site. Please check the URL.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:p-10">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-6xl h-full max-h-[850px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

                {/* Header */}
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                            <Briefcase className="w-8 h-8 text-indigo-600" />
                            Website & Site Library
                        </h2>
                        <p className="text-sm text-slate-500 font-medium mt-1">Manage site identities, domain analysis, and brand authority.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 rounded-full hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Main Body */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Sidebar / List */}
                    <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
                        <div className="p-5 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search sites..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                            {isCreating ? (
                                <div className="p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-200 space-y-3 animate-in slide-in-from-top-2">
                                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">New Site Profile</h4>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Profile Name (e.g. My Tech Blog)"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-indigo-100 rounded-xl text-xs outline-none focus:ring-4 focus:ring-indigo-500/10"
                                    />
                                    <input
                                        type="url"
                                        placeholder="Site URL (Domain or Subfolder)"
                                        value={newSiteUrl}
                                        onChange={(e) => setNewSiteUrl(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-indigo-100 rounded-xl text-xs outline-none focus:ring-4 focus:ring-indigo-500/10"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleCreate}
                                            className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                                        >
                                            Create
                                        </button>
                                        <button
                                            onClick={() => setIsCreating(false)}
                                            className="px-3 py-2 bg-white text-slate-500 border border-slate-200 rounded-xl text-[10px] font-bold hover:bg-slate-50 transition-all"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add New Site
                                </button>
                            )}

                            {filteredProfiles.map((p) => {
                                const isActive = activeProfileId === p.id;
                                const isEditing = editingProfileId === p.id;
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => {
                                            setEditingProfileId(p.id);
                                            onSelect(p);
                                        }}
                                        className={`p-4 rounded-2xl cursor-pointer transition-all border-2 group ${isActive ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-200 scale-[1.02]' : 'bg-white border-transparent hover:border-indigo-100 hover:bg-indigo-50/20 text-slate-600 shadow-sm'}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-xs font-black truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>{p.name}</p>
                                                <p className={`text-[10px] font-medium truncate mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>
                                                    {p.siteUrl || p.websiteType || 'No URL set'}
                                                </p>
                                            </div>
                                            {isActive && <CheckCircle2 className="w-4 h-4 text-white ml-2 shrink-0" />}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 bg-white overflow-y-auto p-12 custom-scrollbar">
                        {editingProfileId || activeProfileId ? (
                            <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {(() => {
                                    const p = profiles.find(x => x.id === (editingProfileId || activeProfileId));
                                    if (!p) return null;
                                    const region = getRegionInfo(p.targetAudience);

                                    return (
                                        <>
                                            {/* Top Banner / Identity */}
                                            <div className="flex items-center gap-6 pb-10 border-b border-slate-100">
                                                <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 flex items-center justify-center border-2 border-indigo-100 shrink-0">
                                                    <Globe className="w-10 h-10 text-indigo-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="text-3xl font-black text-slate-900 truncate">{p.name}</h3>
                                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black border border-indigo-100 uppercase tracking-widest">
                                                            {region.flag} {region.name}
                                                        </span>
                                                    </div>
                                                    <p className="text-slate-400 font-medium flex items-center gap-1.5 uppercase text-[10px] tracking-widest">
                                                        <LayoutTemplate className="w-3.5 h-3.5" />
                                                        {p.websiteType || 'General Site'}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => onDelete(p.id)}
                                                    className="p-3 rounded-2xl text-slate-300 hover:text-white hover:bg-red-500 transition-all active:scale-95"
                                                    title="Delete Profile"
                                                >
                                                    <Trash2 className="w-6 h-6" />
                                                </button>
                                            </div>

                                            {/* URL & Analysis Section */}
                                            <div className="grid grid-cols-1 gap-8">
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Site Identification URL</label>
                                                    <div className="flex gap-3">
                                                        <div className="relative flex-1 group">
                                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                                                <Globe className="w-5 h-5" />
                                                            </div>
                                                            <input
                                                                type="url"
                                                                placeholder="e.g., https://www.clinique.com.hk"
                                                                defaultValue={p.siteUrl}
                                                                onBlur={(e) => onUpdate?.(p.id, { siteUrl: e.target.value })}
                                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-[1.25rem] text-sm font-medium text-slate-700 transition-all outline-none"
                                                            />
                                                        </div>
                                                        <button
                                                            disabled={isAnalyzing || !p.siteUrl}
                                                            onClick={() => p.siteUrl && handleAnalyze(p.siteUrl, p.id)}
                                                            className="px-6 py-4 bg-slate-900 text-white rounded-[1.25rem] text-sm font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-2 whitespace-nowrap shadow-lg shadow-slate-200"
                                                        >
                                                            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                            Smart Analyze Site
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-medium italic">
                                                        Analyzing the site URL will automatically update the Niche and Authority Terms below based on the entire brand profile.
                                                    </p>
                                                </div>

                                                {/* Niche & Terms */}
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Niche / Website Type</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g., Aesthetic Clinic"
                                                            value={p.websiteType}
                                                            onChange={(e) => onUpdate?.(p.id, { websiteType: e.target.value })}
                                                            className="w-full px-4 py-3 bg-white border-2 border-slate-100 focus:border-indigo-500 rounded-xl text-sm font-bold text-slate-700 outline-none transition-all"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Region</label>
                                                        <div className="px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-500 flex items-center gap-2 cursor-not-allowed">
                                                            {region.flag} {region.name}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                                        Authority Keywords & Brand Identity
                                                        <span className="font-medium normal-case text-slate-300">Used for replacement logic</span>
                                                    </label>
                                                    <textarea
                                                        placeholder="List core ingredients, certifications, or USPs that define this site..."
                                                        value={p.authorityTerms}
                                                        onChange={(e) => onUpdate?.(p.id, { authorityTerms: e.target.value })}
                                                        className="w-full h-32 px-5 py-4 bg-white border-2 border-slate-100 focus:border-indigo-500 rounded-2xl text-sm leading-relaxed text-slate-600 outline-none transition-all resize-none custom-scrollbar"
                                                    />
                                                </div>

                                                <div className="space-y-3 p-6 bg-slate-50/50 rounded-[2rem] border-2 border-slate-100/50">
                                                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                                        <BookOpen className="w-3.5 h-3.5" />
                                                        External Knowledge Base (RAG)
                                                    </label>
                                                    <div className="relative group">
                                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                                            <Link2 className="w-5 h-5" />
                                                        </div>
                                                        <input
                                                            type="url"
                                                            placeholder="https://rag.external-brand.com/kb"
                                                            value={p.brandRagUrl}
                                                            onChange={(e) => onUpdate?.(p.id, { brandRagUrl: e.target.value })}
                                                            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-sm font-medium text-slate-700 outline-none transition-all shadow-sm"
                                                        />
                                                    </div>

                                                    {/* Future Connectors */}
                                                    <div className="flex items-center gap-4 px-2 pt-2 opacity-30 grayscale pointer-events-none select-none">
                                                        <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                            Coming Soon
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div title="PDF" className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm"><FileUp className="w-4 h-4" /></div>
                                                            <div title="Notion" className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm"><FileText className="w-4 h-4" /></div>
                                                            <div title="Slack" className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm"><Slack className="w-4 h-4" /></div>
                                                            <div title="Google Drive" className="p-2 rounded-xl bg-white border border-slate-100 shadow-sm"><FolderOpen className="w-4 h-4" /></div>
                                                        </div>
                                                    </div>

                                                    <p className="text-[10px] text-slate-400 font-medium px-1">
                                                        Link to the external RAG system or knowledge source for this brand.
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Bar */}
                                            <div className="pt-10 flex items-center justify-end gap-3">
                                                <button
                                                    onClick={onClose}
                                                    className="px-10 py-4 bg-indigo-600 text-white rounded-[1.25rem] text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95"
                                                >
                                                    Apply Profile to Form
                                                </button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-200 text-center space-y-6">
                                <div className="w-32 h-32 rounded-[3rem] bg-slate-50 flex items-center justify-center mb-4">
                                    <Briefcase className="w-16 h-16 text-slate-100" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-400">Select a Site Profile</h3>
                                    <p className="text-slate-300 font-medium max-w-sm mx-auto mt-2">Pick a brand from your library or create a new one from a URL to instantly load identity settings.</p>
                                </div>
                                <button
                                    onClick={() => setIsCreating(true)}
                                    className="px-8 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-sm font-black hover:bg-indigo-100 transition-all flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Add your first site
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// Internal Loader sub-component
const Loader2 = ({ className }: { className?: string }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const Sparkles = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        <path d="M5 3v4" />
        <path d="M19 17v4" />
        <path d="M3 5h4" />
        <path d="M17 19h4" />
    </svg>
);
