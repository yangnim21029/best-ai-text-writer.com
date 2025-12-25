import React, { useState } from 'react';
import { ShoppingBag, FileText, Sparkles, Copy, Trash2, CheckCircle2 } from 'lucide-react';
import { SavedProfile } from '@/types';
import { GenericLibraryModal } from './GenericLibraryModal';

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

const ServiceCreationForm = ({ onCreate, onCancel }: { onCreate: (data: { name: string; content: string }) => void; onCancel: () => void }) => {
  const [newName, setNewName] = useState('');
  const [newContent, setNewContent] = useState('');
  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl w-full mx-auto space-y-8">
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2">
            <FileText className="w-4 h-4" /> Create New Service Snippet
          </label>
          <input type="text" placeholder="Brand / Service Title" value={newName} onChange={e => setNewName(e.target.value)} className="text-2xl font-black w-full outline-none border-b-2 border-slate-100 focus:border-emerald-500 pb-2" />
        </div>
        <div className="space-y-4">
          <textarea placeholder="Paste description..." value={newContent} onChange={e => setNewContent(e.target.value)} className="w-full h-[400px] p-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-emerald-500/5 resize-none custom-scrollbar" />
        </div>
        <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-6 py-2.5 text-slate-500 font-bold text-sm hover:text-slate-800">Discard</button>
          <button onClick={() => newName.trim() && onCreate({ name: newName, content: newContent })} className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all">Save to Library</button>
        </div>
      </div>
    </div>
  );
};

export const ServiceLibraryModal: React.FC<ServiceLibraryModalProps> = ({
  isOpen, onClose, profiles, activeProfileId, onSelect, onDelete, onCreate, onUpdate,
}) => {
  const [editingContent, setEditingContent] = useState<string | null>(null);

  return (
    <GenericLibraryModal
      isOpen={isOpen}
      onClose={onClose}
      title="Service & Product Library"
      subtitle="Store and pick the best product descriptions for your articles"
      icon={<ShoppingBag className="w-7 h-7 text-emerald-600" />}
      items={profiles}
      activeItemId={activeProfileId}
      onSelect={onSelect}
      onDelete={onDelete}
      createButtonLabel="New Service"
      searchPlaceholder="Search services..."
      filterItem={(p, q) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.productRawText || '').toLowerCase().includes(q.toLowerCase())}
      renderCreateForm={(handleCreate, onCancel) => (
        <ServiceCreationForm onCreate={handleCreate} onCancel={onCancel} />
      )}
      onCreate={(data: any) => onCreate(data.name, data.content)}
      renderItem={(p, isActive) => (
        <div className={`group relative bg-white border-b last:border-0 p-4 transition-all hover:bg-slate-50 flex items-center gap-4 ${isActive ? 'bg-emerald-50/50 hover:bg-emerald-50' : ''}`}>

          {/* Icon */}
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors shrink-0 ${isActive ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200' : 'bg-white border-slate-100 text-slate-400 group-hover:border-slate-200'}`}>
            <ShoppingBag className="w-5 h-5" />
          </div>

          {/* Content Info */}
          <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
            {/* Name */}
            <div className="col-span-12 sm:col-span-4 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-bold truncate ${isActive ? 'text-emerald-900' : 'text-slate-800'}`}>{p.name}</h3>
                {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
            </div>

            {/* Description Snippet */}
            <div className="col-span-12 sm:col-span-8 min-w-0">
              <p className={`text-xs truncate font-medium ${isActive ? 'text-emerald-700/70' : 'text-slate-400'}`}>
                {p.productRawText ? p.productRawText.substring(0, 100) : 'No details provided'}
              </p>
            </div>
          </div>

          {/* Action Arrow (Hover) */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300">
            <FileText className="w-4 h-4" />
          </div>
        </div>
      )}
      renderDetail={(p) => {
        if (!p) return null;
        return (
          <>
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-2"><FileText className="w-4 h-4" /> Active Service Details</label>
              <input type="text" value={p.name} readOnly className="text-2xl font-black w-full outline-none text-slate-900" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description & Selling Points</label>
                <button className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 hover:underline"><Sparkles className="w-3 h-3" /> AI Improve</button>
              </div>
              <textarea
                placeholder="Description..."
                value={editingContent !== null ? editingContent : p.productRawText}
                onChange={e => setEditingContent(e.target.value)}
                className="w-full h-[400px] p-6 bg-slate-50 border border-slate-100 rounded-2xl text-sm leading-relaxed text-slate-700 outline-none focus:ring-4 focus:ring-emerald-500/5 transition-all resize-none custom-scrollbar shadow-inner"
              />
            </div>
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => { navigator.clipboard.writeText(editingContent || p.productRawText || ''); alert('Copied!'); }} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors"><Copy className="w-4 h-4" /> Copy Text</button>
                <button onClick={() => onDelete(p.id)} className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /> Delete</button>
              </div>
              <div className="flex items-center gap-3">
                {editingContent !== null && (
                  <button onClick={() => { if (onUpdate) { onUpdate(p.id, { productRawText: editingContent }); setEditingContent(null); } }} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Save Changes</button>
                )}
                <button onClick={() => onSelect(p)} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all">Apply to Article</button>
              </div>
            </div>
          </>
        );
      }}
      emptyState={
        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-10 text-center animate-in fade-in duration-500">
          <div className="w-24 h-24 rounded-[2rem] bg-emerald-50 flex items-center justify-center mb-6"><Sparkles className="w-12 h-12 text-emerald-200" /></div>
          <h3 className="text-xl font-black text-slate-800 mb-2">Select a Service Snippet</h3>
          <p className="text-sm text-slate-500 max-w-xs mx-auto">Click a service on the left to view or edit details.</p>
        </div>
      }
    />
  );
};
