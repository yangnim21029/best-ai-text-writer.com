import React, { useState, ReactNode } from 'react';
import { Search, X, Plus, CheckCircle2, Edit2, Trash2, Save } from 'lucide-react';

export interface LibraryItem {
  id: string;
  name: string;
  [key: string]: any;
}

interface GenericLibraryModalProps<T extends LibraryItem> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: ReactNode;
  items: T[];
  activeItemId?: string;
  onSelect: (item: T) => void;
  onDelete: (id: string) => void;
  renderItem: (item: T, isActive: boolean, isEditing: boolean) => ReactNode;
  renderDetail: (item: T | undefined, isCreating: boolean) => ReactNode;
  renderCreateForm?: (
    onCreate: (data: any) => void,
    onCancel: () => void
  ) => ReactNode;
  onCreate?: (data: any) => void;
  searchPlaceholder?: string;
  filterItem?: (item: T, query: string) => boolean;
  createButtonLabel?: string;
  emptyState?: ReactNode;
}

export const GenericLibraryModal = <T extends LibraryItem>({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  items,
  activeItemId,
  onSelect,
  onDelete,
  renderItem,
  renderDetail,
  renderCreateForm,
  onCreate,
  searchPlaceholder = 'Search...',
  filterItem,
  createButtonLabel = 'Create New',
  emptyState,
}: GenericLibraryModalProps<T>) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredItems = items.filter((item) =>
    filterItem
      ? filterItem(item, searchQuery)
      : item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = (data: any) => {
    if (onCreate) {
      onCreate(data);
      setIsCreating(false);
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
              {icon}
              {title}
            </h2>
            {subtitle && <p className="text-sm text-slate-500 font-medium mt-1">{subtitle}</p>}
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
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
              {isCreating && renderCreateForm ? (
                renderCreateForm(handleCreate, () => setIsCreating(false))
              ) : (
                <button
                  onClick={() => setIsCreating(true)}
                  className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                >
                  <Plus className="w-4 h-4" />
                  {createButtonLabel}
                </button>
              )}

              {filteredItems.map((item) => {
                const isActive = activeItemId === item.id;
                const isEditing = editingId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setEditingId(item.id);
                      onSelect(item);
                    }}
                  >
                    {renderItem(item, isActive, isEditing)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Editor Area */}
          <div className="flex-1 bg-white overflow-y-auto p-12 custom-scrollbar">
            {isCreating || editingId || activeItemId ? (
              <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {renderDetail(
                  isCreating ? undefined : items.find(i => i.id === (editingId || activeItemId)),
                  isCreating
                )}
              </div>
            ) : (
              emptyState || (
                <div className="h-full flex flex-col items-center justify-center text-slate-200 text-center space-y-6">
                  <div className="w-32 h-32 rounded-[3rem] bg-slate-50 flex items-center justify-center mb-4">
                    {icon}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-400">Select an Item</h3>
                    <p className="text-slate-300 font-medium max-w-sm mx-auto mt-2">
                      Select an item from the list to view details or edit.
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
