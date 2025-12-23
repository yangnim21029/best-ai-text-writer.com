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
        <div className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between group ${isActive ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'hover:bg-white hover:shadow-sm text-slate-600'}`}>
          <div className="min-w-0 flex-1">
            <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>{p.name}</p>
            <p className={`text-[10px] truncate ${isActive ? 'text-emerald-100' : 'text-slate-400'}`}>{p.productRawText ? p.productRawText.substring(0, 40) + '...' : 'No details'}</p>
          </div>
          {isActive && <CheckCircle2 className="w-4 h-4 text-white ml-2" />}
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
                <button onClick={onClose} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all">Apply to Article</button>
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
