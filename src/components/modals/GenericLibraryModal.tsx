import React, { useState, ReactNode, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
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
  renderHeaderActions?: () => ReactNode;
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
  renderHeaderActions,
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

  const isDetailView = isCreating || editingId !== null;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={onClose}>
        {/* Backdrop */}
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 md:p-10 text-center">
            {/* Modal Content */}
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="relative w-full max-w-6xl h-[85vh] max-h-[850px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 text-left align-middle transform transition-all">

                {/* Header */}
                <div className="px-10 py-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                  <div className="flex items-center gap-4">
                    {isDetailView && (
                      <button
                        onClick={() => {
                          setIsCreating(false);
                          setEditingId(null);
                        }}
                        className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                      >
                        <div className="flex items-center gap-1 text-sm font-bold">
                          <span className="text-xl">←</span>
                          <span>Back</span>
                        </div>
                      </button>
                    )}
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        {icon}
                        {title}
                      </h2>
                      {subtitle && !isDetailView && <p className="text-sm text-slate-500 font-medium mt-1">{subtitle}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {renderHeaderActions && renderHeaderActions()}

                    {!isDetailView && (
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                          type="text"
                          placeholder={searchPlaceholder}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-64 pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 focus:bg-white rounded-xl text-sm font-bold text-slate-700 outline-none transition-all"
                        />
                      </div>
                    )}

                    <button
                      onClick={onClose}
                      className="p-3 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Main Body */}
                <div className="flex-1 overflow-hidden bg-white relative">

                  {/* List View */}
                  {!isDetailView && (
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-8">
                      <div className="max-w-5xl mx-auto space-y-4">
                        {/* Create New Button Row */}
                        <button
                          onClick={() => setIsCreating(true)}
                          className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/10 transition-all flex items-center justify-center gap-2 text-sm font-bold group"
                        >
                          <div className="p-2 bg-slate-50 rounded-full group-hover:bg-indigo-100 transition-colors">
                            <Plus className="w-5 h-5" />
                          </div>
                          {createButtonLabel}
                        </button>

                        {/* Items List */}
                        <div className="space-y-2">
                          {filteredItems.map((item) => {
                            const isActive = activeItemId === item.id;
                            return (
                              <div
                                key={item.id}
                                onClick={() => {
                                  setEditingId(item.id);
                                }}
                                className="w-full"
                              >
                                {renderItem(item, isActive, false)}
                              </div>
                            );
                          })}

                          {filteredItems.length === 0 && (
                            <div className="text-center py-20">
                              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-slate-300" />
                              </div>
                              <p className="text-slate-400 font-medium">No items found matching your search.</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detail View */}
                  {isDetailView && (
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar bg-white">
                      <div className="max-w-4xl mx-auto p-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {isCreating && renderCreateForm ? (
                          renderCreateForm(handleCreate, () => setIsCreating(false))
                        ) : (
                          renderDetail(items.find(i => i.id === editingId), isCreating)
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
