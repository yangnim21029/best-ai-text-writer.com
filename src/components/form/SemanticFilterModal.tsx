import React, { useMemo } from 'react';
import { Loader2 } from 'lucide-react';

interface SemanticFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: () => Promise<void>;
  chunkPreview: string[];
  chunkScores: Record<number, number>;
  isFilteringChunks: boolean;
  isScoringChunks: boolean;
  filterError: string | null;
  manualKeep: Record<number, boolean>;
  setManualKeep: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  semanticThreshold: number;
  semanticThresholdInput: string;
  setSemanticThresholdInput: (val: string) => void;
  commitSemanticThreshold: () => void;
}

const ThresholdInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
  onCommit: (val?: string) => void;
}> = ({ value, onChange, onCommit }) => {
  const [localValue, setLocalValue] = React.useState(value);

  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleCommit = () => {
    onCommit(localValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    }
  };

  return (
    <input
      type="number"
      min="0"
      max="1"
      step="0.01"
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        onChange(e.target.value);
      }}
      onBlur={handleCommit}
      onKeyDown={handleKeyDown}
      className="w-24 px-2 py-1 text-[11px] border border-gray-200 rounded-lg text-gray-800 shadow-inner"
    />
  );
};

export const SemanticFilterModal: React.FC<SemanticFilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  chunkPreview,
  chunkScores,
  isFilteringChunks,
  isScoringChunks,
  filterError,
  manualKeep,
  setManualKeep,
  semanticThreshold,
  semanticThresholdInput,
  setSemanticThresholdInput,
  commitSemanticThreshold,
}) => {
  const semanticThresholdLabel = useMemo(() => {
    const parsed = parseFloat(semanticThresholdInput);
    const val = !Number.isNaN(parsed) ? Math.min(1, Math.max(0, parsed)) : semanticThreshold;
    return val.toFixed(2);
  }, [semanticThresholdInput, semanticThreshold]);

  const semanticThresholdValue = useMemo(() => {
    const parsed = parseFloat(semanticThresholdInput);
    if (!Number.isNaN(parsed)) {
      return Math.min(1, Math.max(0, parsed));
    }
    return semanticThreshold;
  }, [semanticThresholdInput, semanticThreshold]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">語意過濾分段確認</p>
            <p className="text-[11px] text-gray-500 mt-0.5">
              以空白行分段，顯示與標題的語意相似度 (閾值 {semanticThresholdLabel}).
            </p>
          </div>
          <button
            type="button"
            className="text-xs text-gray-400 hover:text-gray-600"
            onClick={onClose}
            disabled={isFilteringChunks}
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
          {chunkPreview.map((chunk, idx) => (
            <div
              key={`${idx}-${chunk.slice(0, 10)}`}
              className="border border-gray-100 rounded-lg p-3 bg-gray-50/60"
            >
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                <span className="font-semibold text-gray-700">Chunk {idx + 1}</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setManualKeep((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                    className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold transition-colors ${
                      manualKeep[idx]
                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-blue-200 hover:text-blue-600'
                    }`}
                  >
                    {manualKeep[idx] ? '手動通過' : '手動通過？'}
                  </button>
                  {typeof chunkScores[idx] === 'number' && !Number.isNaN(chunkScores[idx]) ? (
                    <span
                      className={`font-mono font-bold ${
                        chunkScores[idx] >= semanticThresholdValue ? 'text-green-500' : 'text-amber-500'
                      }`}
                    >
                      {(chunkScores[idx] * 100).toFixed(0)}% Match
                    </span>
                  ) : (
                    <span className="text-gray-300">Scoring...</span>
                  )}
                </div>
              </div>
              <pre className="text-[10px] text-gray-600 font-sans whitespace-pre-wrap leading-relaxed">
                {chunk}
              </pre>
            </div>
          ))}

          {!chunkPreview.length && !filterError && (
            <div className="text-center py-10 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-gray-200 mx-auto" />
              <p className="text-xs text-gray-400 italic">正在分析內容分段語意...</p>
            </div>
          )}

          {filterError && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-center">
              <p className="text-xs text-red-600 font-semibold">{filterError}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase">語意閾值調整 (0-1)</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded ring-1 ring-indigo-100">
                {semanticThresholdLabel} {isScoringChunks ? '...' : ''}
              </span>
              <ThresholdInput
                value={semanticThresholdInput}
                onChange={setSemanticThresholdInput}
                onCommit={commitSemanticThreshold}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 py-2 text-[12px] font-bold text-gray-500 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
              onClick={onClose}
              disabled={isFilteringChunks || isScoringChunks}
            >
              取消
            </button>
            <button
              type="button"
              onClick={onApply}
              disabled={isFilteringChunks || isScoringChunks}
              className="px-3 py-2 text-[12px] font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md hover:brightness-110 transition-all disabled:opacity-60 flex items-center gap-2"
            >
              {isFilteringChunks ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              同意並過濾
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
