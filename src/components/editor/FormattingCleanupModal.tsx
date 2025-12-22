import React from 'react';
import { X } from 'lucide-react';

interface CleanupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => void;
  onRefresh: () => void;
  cleanupSummary: {
    boldMarks: number;
    blockquotes: number;
    quoteChars: number;
  };
  cleanupBlocks: Array<{
    from: number;
    to: number;
    text: string;
    boldMarks: number;
    blockquotes: number;
    quoteChars: number;
    type: string;
  }>;
  selectedBlocks: Set<string>;
  setSelectedBlocks: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const FormattingCleanupModal: React.FC<CleanupModalProps> = ({
  isOpen,
  onClose,
  onApply,
  onRefresh,
  cleanupSummary,
  cleanupBlocks,
  selectedBlocks,
  setSelectedBlocks,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800">清理粗體與引號</h3>
            <p className="text-sm text-gray-500">勾選需要清理的段落，會移除粗體、引用區塊與引號。</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close cleanup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-md p-3 leading-relaxed">
            勾選要清理的段落即可，系統會同時清除粗體、引用區塊與引號字元。掃描結果：粗體{' '}
            {cleanupSummary.boldMarks}、引用 {cleanupSummary.blockquotes}、引號{' '}
            {cleanupSummary.quoteChars}。
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-700">選擇要清理的段落</div>
            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
              {cleanupBlocks.map((block, idx) => {
                const id = `${block.from}-${block.to}-${idx}`;
                const checked = selectedBlocks.has(id);
                return (
                  <label
                    key={id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedBlocks((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(id);
                          else next.delete(id);
                          return next;
                        });
                      }}
                      className="mt-1 accent-blue-600"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                          {block.type}
                        </span>
                        <span className="text-xs text-gray-500">
                          粗體 {block.boldMarks} · 引用 {block.blockquotes} · 引號 {block.quoteChars}
                        </span>
                      </div>
                      <div className="text-xs text-gray-700 whitespace-pre-wrap break-words leading-relaxed">
                        {block.text || '（空白段落）'}
                      </div>
                    </div>
                  </label>
                );
              })}
              {cleanupBlocks.length === 0 && (
                <div className="text-xs text-gray-400 p-2 bg-gray-50 border border-dashed border-gray-200 rounded">
                  沒有找到包含粗體或引號的段落。
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <button
            type="button"
            onClick={onRefresh}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            重新掃描
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={onApply}
              className="px-3 py-2 rounded-md text-white font-semibold transition-colors bg-blue-600 hover:bg-blue-700"
            >
              套用清理
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
