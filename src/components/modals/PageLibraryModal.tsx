import React, { useState } from 'react';
import {
  FileText,
  LayoutTemplate,
  Trash2,
  CheckCircle2,
  Globe,
  Clock,
  ExternalLink,
  Edit2,
  Save,
  ShieldCheck,
  Plus,
  Type,
  AlignLeft,
  Link
} from 'lucide-react';
import { PageProfile, TargetAudience } from '@/types';
import { GenericLibraryModal } from './GenericLibraryModal';

interface PageLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pages: PageProfile[];
  activePageId?: string;
  onSelect: (page: PageProfile) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<PageProfile>) => void;
  onCreate: (name: string) => void;
}

const getRegionInfo = (code: TargetAudience) => {
  switch (code) {
    case 'zh-TW': return { flag: '🇹🇼', name: 'TW' };
    case 'zh-HK': return { flag: '🇭🇰', name: 'HK' };
    case 'zh-MY': return { flag: '🇲🇾', name: 'MY' };
    default: return { flag: '🌐', name: 'GL' };
  }
};

const PageCreationForm = ({ onCreate, onCancel }: { onCreate: (name: string) => void; onCancel: () => void }) => {
  const [newName, setNewName] = useState('');
  return (
    <div className="flex items-center gap-3 animate-in slide-in-from-right-4 w-full">
      <input autoFocus type="text" placeholder="Profile Name" value={newName} onChange={e => setNewName(e.target.value)} className="flex-1 px-4 py-3 border-2 border-indigo-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 min-w-[240px]" onKeyDown={e => e.key === 'Enter' && newName.trim() && onCreate(newName)} />
      <button onClick={() => newName.trim() && onCreate(newName)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 whitespace-nowrap">Save Profile</button>
      <button onClick={onCancel} className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all">Cancel</button>
    </div>
  );
};

const PageProfileDetail = ({
  page,
  onUpdate
}: {
  page?: PageProfile;
  onUpdate: (id: string, updates: Partial<PageProfile>) => void
}) => {
  if (!page) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="space-y-4 border-b border-slate-100 pb-8">
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Profile Name</label>
          <input
            type="text"
            value={page.name}
            onChange={(e) => onUpdate(page.id, { name: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-lg font-bold text-slate-900 outline-none transition-all"
            placeholder="Name your profile..."
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Type className="w-3 h-3" /> Page Title
            </label>
            <input
              type="text"
              value={page.title || ''}
              onChange={(e) => onUpdate(page.id, { title: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
              placeholder="SEO Title..."
            />
          </div>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <LayoutTemplate className="w-3 h-3" /> Website Type
          </label>
          <input
            type="text"
            value={page.websiteType || ''}
            onChange={(e) => onUpdate(page.id, { websiteType: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm transition-all"
            placeholder="e.g. Medical Clinic"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" /> Authority Terms
          </label>
          <input
            type="text"
            value={page.authorityTerms || ''}
            onChange={(e) => onUpdate(page.id, { authorityTerms: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm transition-all"
            placeholder="e.g. medical degree, phd"
          />
        </div>
      </div>

      {/* Content Section */}
      <div className="space-y-2">
        <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <ExternalLink className="w-3 h-3" /> Reference Source Content
        </label>
        <div className="relative group">
          <textarea
            value={page.referenceContent || ''}
            readOnly
            className="w-full h-64 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-600 leading-relaxed outline-none resize-none font-mono"
            placeholder="No content provided..."
          />
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="px-2 py-1 bg-white shadow-sm border border-slate-200 rounded-md text-[10px] font-bold text-slate-400">READ ONLY</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const PageLibraryModal: React.FC<PageLibraryModalProps> = ({
  isOpen, onClose, pages, activePageId, onSelect, onDelete, onUpdate, onCreate,
}) => {
  return (
    <GenericLibraryModal
      isOpen={isOpen}
      onClose={onClose}
      title="Page Profile Library"
      subtitle="Manage your article topics, source materials, and outlines"
      icon={<FileText className="w-7 h-7 text-indigo-600" />}
      items={pages}
      activeItemId={activePageId}
      onSelect={onSelect}
      onDelete={onDelete}
      createButtonLabel="Create from Current Form"
      searchPlaceholder="Search page profiles..."
      filterItem={(p, q) => p.name.toLowerCase().includes(q.toLowerCase()) || p.title.toLowerCase().includes(q.toLowerCase()) || (p.websiteType || '').toLowerCase().includes(q.toLowerCase())}
      renderCreateForm={(handleCreate, onCancel) => (
        <PageCreationForm onCreate={handleCreate} onCancel={onCancel} />
      )}
      onCreate={(name: any) => onCreate(name)}
      renderItem={(page, isActive) => {
        const region = getRegionInfo(page.targetAudience);
        return (
          <div className={`group relative bg-white border rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md ${isActive ? 'border-indigo-600 ring-2 ring-indigo-500/10 bg-indigo-50/10' : 'border-slate-100 hover:border-indigo-200'}`}>
            <div className="flex items-start justify-between mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${isActive ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                <FileText className="w-5 h-5" />
              </div>
              {isActive && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> ACTIVE</span>}
            </div>

            <h3 className={`text-sm font-bold line-clamp-2 leading-tight mb-1 ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>{page.name}</h3>

            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium border border-slate-200"><Globe className="w-3 h-3 text-slate-400" />{region.name}</span>
              {page.websiteType && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[10px] font-medium border border-slate-100"><LayoutTemplate className="w-3 h-3" />{page.websiteType}</span>}
            </div>
          </div>
        );
      }}
      renderDetail={(page) => (
        <PageProfileDetail page={page} onUpdate={onUpdate} />
      )}
    />
  );
};