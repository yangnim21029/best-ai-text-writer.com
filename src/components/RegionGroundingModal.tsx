import React, { useMemo } from 'react';
import { X, Globe, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useAnalysisStore } from '../store/useAnalysisStore';
import { useGenerationStore } from '../store/useGenerationStore';

interface RegionGroundingModalProps {
  onApply: (selectedIssues: { original: string; regionEquivalent: string }[]) => void;
  onSkip: () => void;
}

export const RegionGroundingModal: React.FC<RegionGroundingModalProps> = ({ onApply, onSkip }) => {
  const {
    pendingGroundingResult,
    showGroundingModal,
    setShowGroundingModal,
    toggleGroundingIssueSelection,
  } = useAnalysisStore();

  const issues = pendingGroundingResult?.issues || [];
  const regionLabel = pendingGroundingResult?.regionLabel || '目標地區';

  const selectedCount = useMemo(() => issues.filter((i) => i.selected).length, [issues]);

  const handleApply = () => {
    const selected = issues
      .filter((i) => i.selected)
      .map((i) => ({ original: i.original, regionEquivalent: i.regionEquivalent }));
    onApply(selected);
    setShowGroundingModal(false);
  };

  const handleSkip = () => {
    onSkip();
    setShowGroundingModal(false);
  };

  const handleSelectAll = () => {
    issues.forEach((_, idx) => {
      if (!issues[idx].selected) {
        toggleGroundingIssueSelection(idx);
      }
    });
  };

  const handleDeselectAll = () => {
    issues.forEach((_, idx) => {
      if (issues[idx].selected) {
        toggleGroundingIssueSelection(idx);
      }
    });
  };

  if (!showGroundingModal || !pendingGroundingResult || issues.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleSkip} />
      <div className="relative bg-white w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/80 to-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-200">
              <Globe className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-gray-900 leading-tight">
                {regionLabel}市場本地化確認
              </h3>
              <p className="text-xs text-gray-500">
                偵測到 {issues.length} 個非{regionLabel}實體，請選擇要替換的項目
              </p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">
              已選擇 {selectedCount} / {issues.length} 項
            </span>
            <div className="flex gap-2">
              <button onClick={handleSelectAll} className="text-xs text-blue-600 hover:underline">
                全選
              </button>
              <button onClick={handleDeselectAll} className="text-xs text-gray-500 hover:underline">
                取消全選
              </button>
            </div>
          </div>

          {issues.map((issue, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                issue.selected
                  ? 'border-amber-200 bg-amber-50/60 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              }`}
              onClick={() => toggleGroundingIssueSelection(idx)}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={issue.selected}
                  onChange={() => toggleGroundingIssueSelection(idx)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">
                      {issue.type}
                    </span>
                    <span className="text-xs text-gray-400">
                      信心度: {Math.round(issue.confidence * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-rose-700 line-through">
                      {issue.original}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-semibold text-emerald-700">
                      {issue.regionEquivalent}
                    </span>
                  </div>
                  {issue.context && (
                    <p className="mt-1 text-xs text-gray-500 leading-relaxed">{issue.context}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            未選擇的項目將保留原文
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              跳過 (保留原文)
            </button>
            <button
              onClick={handleApply}
              disabled={selectedCount === 0}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg shadow-sm hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              套用 {selectedCount} 項替換
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
