import React, { useState } from 'react';
import {
  Search,
  FileText,
  LayoutTemplate,
  Trash2,
  CheckCircle2,
  Plus,
  X,
  Globe,
  Clock,
  ExternalLink,
  Edit2,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { PageProfile, TargetAudience } from '@/types';

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
    case 'zh-TW':
      return { flag: '🇹🇼', name: 'TW' };
    case 'zh-HK':
      return { flag: '🇭🇰', name: 'HK' };
    case 'zh-MY':
      return { flag: '🇲🇾', name: 'MY' };
    default:
      return { flag: '🌐', name: 'GL' };
  }
};

export const PageLibraryModal: React.FC<PageLibraryModalProps> = ({
  isOpen,
  onClose,
  pages,
  activePageId,
  onSelect,
  onDelete,
  onUpdate,
  onCreate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWebsiteType, setEditWebsiteType] = useState('');
  const [editAuthorityTerms, setEditAuthorityTerms] = useState('');

  if (!isOpen) return null;

  const filteredPages = pages.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.websiteType || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim());
      setNewName('');
      setIsCreating(false);
    }
  };

  const startEditing = (e: React.MouseEvent, page: PageProfile) => {
    e.stopPropagation();
    setEditingId(page.id);
    setEditWebsiteType(page.websiteType || '');
    setEditAuthorityTerms(page.authorityTerms || '');
  };

  const handleSave = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onUpdate(id, {
      websiteType: editWebsiteType,
      authorityTerms: editAuthorityTerms,
    });
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-indigo-900/10 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-6xl h-full max-h-[850px] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-indigo-100 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="px-10 py-8 border-b border-indigo-50 flex items-center justify-between bg-indigo-50/20">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <FileText className="w-7 h-7 text-indigo-600" />
              Page Profile Library
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Manage your article topics, source materials, and outlines
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-full hover:bg-indigo-100/50 text-slate-400 hover:text-indigo-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-10 py-5 bg-white border-b border-indigo-50 flex flex-col sm:flex-row gap-6 items-center justify-between">
          <div className="relative w-full sm:w-[400px]">
            <Search className="absolute left-4 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search page profiles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-100 border-2 border-transparent focus:bg-white focus:border-indigo-500 rounded-2xl text-sm outline-none transition-all shadow-inner"
            />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isCreating ? (
              <div className="flex items-center gap-3 animate-in slide-in-from-right-4 w-full">
                <input
                  autoFocus
                  type="text"
                  placeholder="Profile Name (e.g. Laser Hair Removal Blog)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-indigo-200 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 min-w-[240px]"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <button
                  onClick={handleCreate}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95 whitespace-nowrap"
                >
                  Save Profile
                </button>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 active:scale-95 group"
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                Create from Current Form
              </button>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/30">
          {filteredPages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-6">
              <div className="w-24 h-24 rounded-[2rem] bg-indigo-50 flex items-center justify-center">
                <FileText className="w-12 h-12 text-indigo-200" />
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-slate-500">No page profiles yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Save your current article settings as a profile for easy reuse.
                </p>
              </div>
              <button
                onClick={() => setIsCreating(true)}
                className="text-indigo-600 font-extrabold hover:underline flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Save your first profile
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPages.map((page) => {
                const region = getRegionInfo(page.targetAudience);
                const isActive = activePageId === page.id;
                const isEditing = editingId === page.id;

                return (
                  <div
                    key={page.id}
                    onClick={() => !isEditing && onSelect(page)}
                    className={`group relative bg-white border-2 rounded-3xl p-6 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1.5 ${isActive ? 'border-indigo-600 ring-4 ring-indigo-500/10 shadow-xl' : 'border-slate-100'}`}
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-colors ${isActive ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-50 group-hover:bg-indigo-50 group-hover:border-indigo-100'}`}
                      >
                        <FileText
                          className={`w-7 h-7 ${isActive ? 'text-indigo-600' : 'text-slate-300 group-hover:text-indigo-600'}`}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-black flex items-center gap-1 border border-green-100 shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            ACTIVE
                          </span>
                        )}
                        {!isEditing && (
                          <button
                            onClick={(e) => startEditing(e, page)}
                            className="p-2 rounded-xl text-slate-200 hover:text-indigo-600 hover:bg-indigo-50 transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Delete this page profile?')) onDelete(page.id);
                          }}
                          className="p-2 rounded-xl text-slate-200 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 line-clamp-2 leading-tight mb-2 min-h-[3rem]">
                      {page.name}
                    </h3>

                    <p className="text-xs text-slate-500 font-medium line-clamp-1 mb-4 flex items-center gap-1.5 italic">
                      {page.title || 'No title set'}
                    </p>

                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-50">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold border border-slate-200/50">
                        <Globe className="w-3 h-3 text-slate-400" />
                        {region.flag} {region.name}
                      </span>
                      
                      {isEditing ? (
                        <div className="w-full space-y-3 mt-2" onClick={(e) => e.stopPropagation()}>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Website Type</label>
                            <input
                              type="text"
                              value={editWebsiteType}
                              onChange={(e) => setEditWebsiteType(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                              placeholder="e.g. Medical Clinic"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Authority Terms</label>
                            <textarea
                              value={editAuthorityTerms}
                              onChange={(e) => setEditAuthorityTerms(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500 min-h-[60px]"
                              placeholder="e.g. medical degree, awards..."
                            />
                          </div>
                          <button
                            onClick={(e) => handleSave(e, page.id)}
                            className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
                          >
                            <Save className="w-3.5 h-3.5" />
                            Save Changes
                          </button>
                        </div>
                      ) : (
                        <>
                          {page.websiteType && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold border border-indigo-100/30">
                              <LayoutTemplate className="w-3 h-3" />
                              {page.websiteType}
                            </span>
                          )}
                          {page.authorityTerms && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100/30">
                              <ShieldCheck className="w-3 h-3" />
                              {page.authorityTerms.split(',')[0]}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="mt-4 bg-slate-50/50 rounded-2xl p-3 border border-slate-100 group-hover:bg-indigo-50/30 transition-colors">
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          <Clock className="w-3 h-3" /> Source Content
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {page.referenceContent
                            ? page.referenceContent.substring(0, 100)
                            : 'No content provided'}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-10 py-6 border-t border-indigo-50 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-slate-300" /> Persistent Storage
            </span>
            <span className="flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-slate-300" /> Cloud Sync Ready
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};