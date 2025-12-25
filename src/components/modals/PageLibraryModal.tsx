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
  onSyncToActive?: () => void;
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
  onUpdate,
  isActive,
  onSyncToActive,
  onSelect,
  onDelete,
}: {
  page?: PageProfile;
  onUpdate: (id: string, updates: Partial<PageProfile>) => void;
  isActive: boolean;
  onSyncToActive?: () => void;
  onSelect?: (page: PageProfile) => void;
  onDelete?: (id: string) => void;
}) => {
  if (!page) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="space-y-4 border-b border-slate-100 pb-8">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2 flex-1">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Profile Name</label>
            <input
              type="text"
              value={page.name}
              onChange={(e) => onUpdate(page.id, { name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-lg font-bold text-slate-900 outline-none transition-all"
              placeholder="Name your profile..."
            />
          </div>
          {isActive && onSyncToActive && (
            <button
              onClick={onSyncToActive}
              className="flex-shrink-0 px-4 py-3 bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-200 transition-all flex items-center gap-2"
              title="Update this profile with current editor content"
            >
              <Save className="w-4 h-4" />
              Update from Editor
            </button>
          )}
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
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3 h-3" /> Original Source URL
          </label>
          <input
            type="url"
            value={page.originalUrl || ''}
            onChange={(e) => onUpdate(page.id, { originalUrl: e.target.value })}
            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-sm transition-all font-mono"
            placeholder="https://example.com/article"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <ExternalLink className="w-3 h-3" /> Reference Source Content
          </label>
          <div className="relative group">
            <textarea
              value={page.referenceContent || ''}
              readOnly
              className="w-full h-48 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-600 leading-relaxed outline-none resize-none font-mono"
              placeholder="No content provided..."
            />
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="px-2 py-1 bg-white shadow-sm border border-slate-200 rounded-md text-[10px] font-bold text-slate-400">READ ONLY</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="pt-4 flex justify-between items-center">
        <button
          onClick={() => page.id && onDelete && onDelete(page.id)}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
        >
          <Trash2 className="w-4 h-4" />
          Delete Profile
        </button>

        <button
          onClick={() => onSelect && onSelect(page)}
          className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Apply to Article
        </button>
      </div>
    </div>
  );
};

export const PageLibraryModal: React.FC<PageLibraryModalProps> = ({
  isOpen, onClose, pages, activePageId, onSelect, onDelete, onUpdate, onCreate, onSyncToActive,
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
          <div className={`group relative bg-white border-b last:border-0 p-4 transition-all hover:bg-slate-50 flex items-center gap-4 ${isActive ? 'bg-indigo-50/50 hover:bg-indigo-50' : ''}`}>

            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors shrink-0 ${isActive ? 'bg-indigo-100 text-indigo-600 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-white group-hover:border-slate-200'}`}>
              <FileText className="w-5 h-5" />
            </div>

            {/* Content Info */}
            <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
              {/* Name & Title */}
              <div className="col-span-12 sm:col-span-5 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className={`text-sm font-bold truncate ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>{page.name}</h3>
                  {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />}
                </div>
                <p className="text-xs text-slate-400 truncate font-medium">{page.title || 'No title set'}</p>
              </div>

              {/* Website Type & URL */}
              <div className="col-span-6 sm:col-span-4 min-w-0 flex items-center gap-2">
                {page.websiteType && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-md max-w-full truncate">
                    <LayoutTemplate className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{page.websiteType}</span>
                  </span>
                )}
                {page.originalUrl && (
                  <a
                    href={page.originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md max-w-full truncate transition-colors"
                  >
                    <Globe className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate max-w-[150px]">{new URL(page.originalUrl).hostname}</span>
                  </a>
                )}
              </div>

              {/* Region */}
              <div className="col-span-6 sm:col-span-3 min-w-0 flex justify-end">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-100 text-slate-500 rounded-lg text-xs font-bold shadow-sm whitespace-nowrap">
                  <span className="text-base">{region.flag}</span>
                  {region.name}
                </span>
              </div>
            </div>

            {/* Action Buttons (Hover) */}
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(page.id);
                }}
                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                title="Delete Page"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="text-slate-300">
                <Edit2 className="w-4 h-4" />
              </div>
            </div>
          </div>
        );
      }}
      renderDetail={(page) => (
        <PageProfileDetail
          page={page}
          onUpdate={onUpdate}
          isActive={page?.id === activePageId}
          onSyncToActive={onSyncToActive}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      )}
    />
  );
};