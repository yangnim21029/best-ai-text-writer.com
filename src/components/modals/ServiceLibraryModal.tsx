import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  Plus,
  X,
  FileText,
  Sparkles,
  Copy,
  ExternalLink,
  MoreVertical,
} from 'lucide-react';
import { SavedProfile } from '@/types';

interface ServiceLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: SavedProfile[];
  activeProfileId?: string;
  onSelect: (profile: SavedProfile) => void;
  onDelete: (id: string) => void;
  onCreate: (name: string, content: string) => void;
  onUpdate?: (id: string, updates: Partial<SavedProfile>) => void;
}

export const ServiceLibraryModal: React.FC<ServiceLibraryModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSelect,
  onDelete,
  onCreate,
  onUpdate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingContent, setEditingContent] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredProfiles = profiles.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.productRawText || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(newName.trim(), newContent);
      setNewName('');
      setNewContent('');
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-emerald-900/10 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-6xl h-full max-h-[850px] bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col border border-emerald-100 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="px-10 py-8 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/20">
          <div>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <ShoppingBag className="w-7 h-7 text-emerald-600" />
              Service & Product Library
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Store and pick the best product descriptions for your articles
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-full hover:bg-emerald-100/50 text-slate-400 hover:text-emerald-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar / List */}
          <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
              {filteredProfiles.map((profile) => {
                const isActive = activeProfileId === profile.id;
                return (
                  <div
                    key={profile.id}
                    onClick={() => onSelect(profile)}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'hover:bg-white hover:shadow-sm text-slate-600'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}
                      >
                        {profile.name}
                      </p>
                      <p
                        className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}
                      >
                        {profile.productRawText
                          ? profile.productRawText.substring(0, 40) + '...'
                          : 'No details'}
                      </p>
                    </div>
                    {isActive && <CheckCircle2 className="w-4 h-4 text-white ml-2" />}
                  </div>
                );
              })}
              <button
                onClick={() => setIsCreating(true)}
                className="w-full p-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all flex items-center justify-center gap-2 mt-4 text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                New Service
              </button>
            </div>
          </div>

          {/* Editor / Details */}
          <div className="flex-1 bg-white flex flex-col">
            {isCreating || activeProfileId ? (
              <div className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl w-full mx-auto space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {isCreating ? 'Create New Service Snippet' : 'Active Service Details'}
                    </label>
                    <input
                      type="text"
                      placeholder="Brand / Service Title (e.g. Acme Dental - Painless Implants)"
                      value={
                        isCreating ? newName : profiles.find((p) => p.id === activeProfileId)?.name
                      }
                      readOnly={!isCreating}
                      className={`text-2xl font-black w-full outline-none ${isCreating ? 'border-b-2 border-slate-100 focus:border-emerald-500 pb-2' : 'text-slate-900'}`}
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Description & Selling Points
                      </label>
                      {!isCreating && (
                        <button className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:underline">
                          <Sparkles className="w-3 h-3" />
                          AI Improve
                        </button>
                      )}
                    </div>
                    <textarea
                      placeholder="Paste detailed product specs, brand story, contact info, and USPs here..."
                      value={
                        isCreating
                          ? newContent
                          : editingContent !== null
                            ? editingContent
                            : profiles.find((p) => p.id === activeProfileId)?.productRawText
                      }
                      onChange={(e) =>
                        isCreating
                          ? setNewContent(e.target.value)
                          : setEditingContent(e.target.value)
                      }
                      className="w-full h-[400px] p-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm leading-relaxed text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all resize-none custom-scrollbar shadow-inner"
                    />
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => {
                          const text = isCreating
                            ? newContent
                            : editingContent ||
                              profiles.find((p) => p.id === activeProfileId)?.productRawText;
                          if (text) {
                            navigator.clipboard.writeText(text);
                            alert('Copied to clipboard!');
                          }
                        }}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Copy Text
                      </button>
                      <button
                        onClick={() => activeProfileId && onDelete(activeProfileId)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                    {isCreating ? (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsCreating(false)}
                          className="px-6 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-800"
                        >
                          Discard
                        </button>
                        <button
                          onClick={handleCreate}
                          className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all"
                        >
                          Save to Library
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        {editingContent !== null && (
                          <button
                            onClick={() => {
                              if (activeProfileId && onUpdate) {
                                onUpdate(activeProfileId, { productRawText: editingContent });
                                setEditingContent(null);
                              }
                            }}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                          >
                            Save Changes
                          </button>
                        )}
                        <button
                          onClick={onClose}
                          className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all"
                        >
                          Apply to Article
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10 text-center animate-in fade-in duration-500">
                <div className="w-24 h-24 rounded-[2rem] bg-emerald-50 flex items-center justify-center mb-6">
                  <Sparkles className="w-12 h-12 text-emerald-200" />
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2">Select a Service Snippet</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Click a service on the left to view or edit its details. AI will use this info to
                  replace competitor names.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
