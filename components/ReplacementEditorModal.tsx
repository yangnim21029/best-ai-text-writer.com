import React, { useState, useEffect, useMemo } from 'react';
import { X, RefreshCw, Check, Trash2, Edit3, Undo2, ArrowRight } from 'lucide-react';

export interface ReplacementItem {
    original: string;
    replacement: string;
    reason?: string;
}

export interface EditedReplacementItem extends ReplacementItem {
    action: 'replace' | 'keep' | 'delete';
    customReplacement?: string;
}

interface ReplacementEditorModalProps {
    open: boolean;
    onClose: () => void;
    items: ReplacementItem[];
    onSave: (items: EditedReplacementItem[]) => void;
}

export const ReplacementEditorModal: React.FC<ReplacementEditorModalProps> = ({
    open,
    onClose,
    items,
    onSave,
}) => {
    const [editedItems, setEditedItems] = useState<EditedReplacementItem[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempValue, setTempValue] = useState('');

    useEffect(() => {
        if (open) {
            setEditedItems(
                items.map((item) => ({
                    ...item,
                    action: item.replacement ? 'replace' : 'delete',
                    customReplacement: item.replacement,
                }))
            );
            setEditingIndex(null);
            setTempValue('');
        }
    }, [open, items]);

    const handleAction = (index: number, action: 'replace' | 'keep' | 'delete') => {
        setEditedItems((prev) =>
            prev.map((item, i) =>
                i === index
                    ? {
                        ...item,
                        action,
                        customReplacement: action === 'keep' ? '' : item.customReplacement,
                    }
                    : item
            )
        );
    };

    const handleStartEdit = (index: number) => {
        setEditingIndex(index);
        setTempValue(editedItems[index]?.customReplacement || '');
    };

    const handleSaveEdit = (index: number) => {
        setEditedItems((prev) =>
            prev.map((item, i) =>
                i === index ? { ...item, customReplacement: tempValue, action: 'replace' } : item
            )
        );
        setEditingIndex(null);
        setTempValue('');
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        setTempValue('');
    };

    const handleSaveAll = () => {
        onSave(editedItems);
        onClose();
    };

    const summary = useMemo(() => {
        const replaceCount = editedItems.filter((item) => item.action === 'replace').length;
        const keepCount = editedItems.filter((item) => item.action === 'keep').length;
        const deleteCount = editedItems.filter((item) => item.action === 'delete').length;
        return { replaceCount, keepCount, deleteCount };
    }, [editedItems]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-200">
                            <RefreshCw className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">本地替換編輯器</h3>
                            <p className="text-xs text-gray-500">選擇替換、保留原文或刪除各項目</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-white/80 text-gray-500 transition"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {editedItems.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-8">沒有需要替換的項目。</p>
                    ) : (
                        editedItems.map((item, idx) => (
                            <div
                                key={idx}
                                className={`rounded-xl border p-4 transition-all ${item.action === 'replace'
                                        ? 'bg-amber-50/50 border-amber-200'
                                        : item.action === 'keep'
                                            ? 'bg-blue-50/50 border-blue-200'
                                            : 'bg-red-50/50 border-red-200'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            <span className="text-red-500 line-through font-medium">
                                                {item.original}
                                            </span>
                                            {item.action !== 'keep' && (
                                                <>
                                                    <ArrowRight className="w-4 h-4 text-gray-400" />
                                                    {editingIndex === idx ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={tempValue}
                                                                onChange={(e) => setTempValue(e.target.value)}
                                                                className="px-2 py-1 text-sm border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-200"
                                                                placeholder="輸入替換文字..."
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => handleSaveEdit(idx)}
                                                                className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {item.action === 'delete' ? (
                                                                <span className="text-red-500 font-semibold italic">
                                                                    (刪除)
                                                                </span>
                                                            ) : (
                                                                <span className="text-emerald-600 font-semibold">
                                                                    {item.customReplacement || item.replacement || '(未設定)'}
                                                                </span>
                                                            )}
                                                            {item.action === 'replace' && (
                                                                <button
                                                                    onClick={() => handleStartEdit(idx)}
                                                                    className="p-1 rounded-lg hover:bg-amber-100 text-amber-600 transition"
                                                                    title="編輯替換文字"
                                                                >
                                                                    <Edit3 className="w-3.5 h-3.5" />
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </>
                                            )}
                                            {item.action === 'keep' && (
                                                <span className="text-blue-600 font-semibold">(保留原文)</span>
                                            )}
                                        </div>
                                        {item.reason && (
                                            <p className="text-xs text-gray-500 leading-relaxed">{item.reason}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Action buttons */}
                                <div className="mt-3 flex items-center gap-2 flex-wrap">
                                    <button
                                        onClick={() => handleAction(idx, 'replace')}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 ${item.action === 'replace'
                                                ? 'bg-amber-600 text-white border-amber-600'
                                                : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                                            }`}
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        替換
                                    </button>
                                    <button
                                        onClick={() => handleAction(idx, 'keep')}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 ${item.action === 'keep'
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                                            }`}
                                    >
                                        <Undo2 className="w-3.5 h-3.5" />
                                        保留
                                    </button>
                                    <button
                                        onClick={() => handleAction(idx, 'delete')}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 ${item.action === 'delete'
                                                ? 'bg-red-600 text-white border-red-600'
                                                : 'bg-white text-red-700 border-red-200 hover:bg-red-50'
                                            }`}
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        刪除
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-semibold">
                            替換: {summary.replaceCount}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                            保留: {summary.keepCount}
                        </span>
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full font-semibold">
                            刪除: {summary.deleteCount}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                        >
                            取消
                        </button>
                        <button
                            onClick={handleSaveAll}
                            className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg shadow-sm hover:brightness-110 transition"
                        >
                            儲存變更
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
