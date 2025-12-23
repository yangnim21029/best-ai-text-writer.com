import React, { useState } from 'react';
import { Briefcase, Globe, LayoutTemplate, Link2, Sparkles, Trash2, CheckCircle2, BookOpen } from 'lucide-react';
import { SavedProfile, TargetAudience } from '@/types';
import { GenericLibraryModal } from './GenericLibraryModal';
import { LoadingButton } from '../LoadingButton';

interface WebsiteLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: SavedProfile[];
  activeProfileId?: string;
  onSelect: (profile: SavedProfile) => void;
  onDelete: (id: string) => void;
  onCreate: (name: string, siteUrl?: string) => void;
  onUpdate?: (id: string, updates: Partial<SavedProfile>) => void;
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

const WebsiteCreationForm = ({ onCreate, onCancel }: { onCreate: (data: { name: string; siteUrl: string }) => void; onCancel: () => void }) => {
  const [newName, setNewName] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');
  return (
    <div className="p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-200 space-y-3 animate-in slide-in-from-top-2">
      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">New Site Profile</h4>
      <input autoFocus type="text" placeholder="Profile Name" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 bg-white border border-indigo-100 rounded-xl text-xs outline-none focus:ring-4 focus:ring-indigo-500/10" />
      <input type="url" placeholder="Site URL" value={newSiteUrl} onChange={e => setNewSiteUrl(e.target.value)} className="w-full px-3 py-2 bg-white border border-indigo-100 rounded-xl text-xs outline-none focus:ring-4 focus:ring-indigo-500/10" />
      <div className="flex gap-2">
        <button onClick={() => newName && onCreate({ name: newName, siteUrl: newSiteUrl })} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold hover:bg-indigo-700 transition-all">Create</button>
        <button onClick={onCancel} className="px-3 py-2 bg-white text-slate-500 border border-slate-200 rounded-xl text-[10px] font-bold hover:bg-slate-50 transition-all">Cancel</button>
      </div>
    </div>
  );
};

export const WebsiteLibraryModal: React.FC<WebsiteLibraryModalProps> = ({
  isOpen, onClose, profiles, activeProfileId, onSelect, onDelete, onCreate, onUpdate, onAnalyzeSite
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async (url: string, targetId: string) => {
    if (!url || !onAnalyzeSite) return;
    setIsAnalyzing(true);
    try {
      const result = await onAnalyzeSite(url);
      if (onUpdate) onUpdate(targetId, { ...result, siteUrl: url });
    } catch (e) {
      alert('Failed to analyze site.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <GenericLibraryModal
      isOpen={isOpen}
      onClose={onClose}
      title="Website & Site Library"
      subtitle="Manage site identities, domain analysis, and brand authority."
      icon={<Briefcase className="w-8 h-8 text-indigo-600" />}
      items={profiles}
      activeItemId={activeProfileId}
      onSelect={onSelect}
      onDelete={onDelete}
      createButtonLabel="Add New Site"
      searchPlaceholder="Search sites..."
      filterItem={(p, q) => 
        p.name.toLowerCase().includes(q.toLowerCase()) || 
        p.websiteType.toLowerCase().includes(q.toLowerCase()) || 
        (p.siteUrl || '').toLowerCase().includes(q.toLowerCase())
      }
      renderCreateForm={(handleCreate, onCancel) => (
        <WebsiteCreationForm onCreate={handleCreate} onCancel={onCancel} />
      )}
      onCreate={(data: any) => onCreate(data.name, data.siteUrl)}
      renderItem={(p, isActive) => (
        <div className={`p-4 rounded-2xl cursor-pointer transition-all border-2 group ${isActive ? 'bg-indigo-600 text-white border-indigo-500 shadow-xl shadow-indigo-200 scale-[1.02]' : 'bg-white border-transparent hover:border-indigo-100 hover:bg-indigo-50/20 text-slate-600 shadow-sm'}`}>
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-black truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>{p.name}</p>
              <p className={`text-[10px] font-medium truncate mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-400'}`}>{p.siteUrl || p.websiteType || 'No URL set'}</p>
            </div>
            {isActive && <CheckCircle2 className="w-4 h-4 text-white ml-2 shrink-0" />}
          </div>
        </div>
      )}
      renderDetail={(p, isCreating) => {
        if (!p) return null;
        const region = getRegionInfo(p.targetAudience);
        return (
          <>
            <div className="flex items-center gap-6 pb-10 border-b border-slate-100">
              <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 flex items-center justify-center border-2 border-indigo-100 shrink-0"><Globe className="w-10 h-10 text-indigo-600" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-3xl font-black text-slate-900 truncate">{p.name}</h3>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black border border-indigo-100 uppercase tracking-widest">{region.flag} {region.name}</span>
                </div>
                <p className="text-slate-400 font-medium flex items-center gap-1.5 uppercase text-[10px] tracking-widest"><LayoutTemplate className="w-3.5 h-3.5" />{p.websiteType || 'General Site'}</p>
              </div>
              <button onClick={() => onDelete(p.id)} className="p-3 rounded-2xl text-slate-300 hover:text-white hover:bg-red-500 transition-all active:scale-95"><Trash2 className="w-6 h-6" /></button>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Site Identification URL</label>
                <div className="flex gap-3">
                  <div className="relative flex-1 group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"><Globe className="w-5 h-5" /></div>
                    <input type="url" placeholder="e.g., https://www.clinique.com.hk" defaultValue={p.siteUrl} onBlur={e => onUpdate?.(p.id, { siteUrl: e.target.value })} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-[1.25rem] text-sm font-medium text-slate-700 transition-all outline-none" />
                  </div>
                  <LoadingButton
                    isLoading={isAnalyzing}
                    disabled={!p.siteUrl}
                    onClick={() => p.siteUrl && handleAnalyze(p.siteUrl, p.id)}
                    variant="slate"
                    icon={<Sparkles className="w-4 h-4" />}
                    className="whitespace-nowrap px-6 py-4 rounded-[1.25rem] h-auto"
                  >
                    Smart Analyze Site
                  </LoadingButton>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Niche / Website Type</label>
                  <input type="text" placeholder="e.g., Aesthetic Clinic" value={p.websiteType} onChange={e => onUpdate?.(p.id, { websiteType: e.target.value })} className="w-full px-4 py-3 bg-white border-2 border-slate-100 focus:border-indigo-500 rounded-xl text-sm font-bold text-slate-700 outline-none transition-all" />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Region</label>
                  <div className="px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-500 flex items-center gap-2 cursor-not-allowed">{region.flag} {region.name}</div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Authority Keywords & Brand Identity</label>
                <textarea placeholder="List core ingredients..." value={p.authorityTerms} onChange={e => onUpdate?.(p.id, { authorityTerms: e.target.value })} className="w-full h-32 px-5 py-4 bg-white border-2 border-slate-100 focus:border-indigo-500 rounded-2xl text-sm leading-relaxed text-slate-600 outline-none transition-all resize-none custom-scrollbar" />
              </div>

              <div className="space-y-3 p-6 bg-slate-50/50 rounded-[2rem] border-2 border-slate-100/50">
                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> External Knowledge Base (RAG)</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors"><Link2 className="w-5 h-5" /></div>
                  <input type="url" placeholder="https://rag.external-brand.com/kb" value={p.brandRagUrl} onChange={e => onUpdate?.(p.id, { brandRagUrl: e.target.value })} className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-sm font-medium text-slate-700 outline-none transition-all shadow-sm" />
                </div>
              </div>
            </div>

            <div className="pt-10 flex items-center justify-end gap-3">
              <button onClick={onClose} className="px-10 py-4 bg-indigo-600 text-white rounded-[1.25rem] text-sm font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95">Apply Profile to Form</button>
            </div>
          </>
        );
      }}
    />
  );
};
