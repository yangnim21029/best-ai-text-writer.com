
import React from 'react';
import { X, GitCommit } from 'lucide-react';

interface ChangelogProps {
  isOpen: boolean;
  onClose: () => void;
}

const HISTORY = [
  {
    version: 'v1.5.0',
    date: '2025.12',
    description: '核心模型升級：全面採用 Google 最新 Gemini 3 Flash Preview 模型，大幅提升生成速度與內容準確度，並優化長文本處理能力。'
  },
  {
    version: 'v1.4.0',
    date: '2025.12',
    description: '功能重構與優化：將關鍵詞分析升級為「高頻詞彙 (Frequent Words)」並增加例句提取功能；新增「區域化與安全 (Localization & Safety)」檢查面板以強化內容合規。底層則透過並行化處理修復了同步問題，顯著提升分析速度。'
  },
  {
    version: 'v1.3.0',
    date: '2025.03',
    description: '體驗大幅升級：推出「全域視覺識別系統 (VIS)」，確保生成圖片風格的一致性。新增「游標處插入」功能，讓圖片素材能一鍵放入文章。同時優化了底層處理效能，提升整體回應速度。'
  },
  {
    version: 'v1.2.0',
    date: '2025.02',
    description: '整合 Gemini 3 Pro (Nano Banana) 生成高保真圖像，並支援來源圖片的 AI 視覺理解。'
  },
  {
    version: 'v1.1.0',
    date: '2025.01',
    description: '新增知識庫 RAG 檢索與競爭對手清洗 (Competitor Sanitization) 協議。'
  },
  {
    version: 'v1.0.0',
    date: '2024.12',
    description: '核心「分析-規劃-寫作」架構上線，具備深度結構提取功能。'
  }
];

export const Changelog: React.FC<ChangelogProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-over Panel */}
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-blue-600" />
            更新日誌
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">

          {/* Product Overview */}
          <div className="mb-10">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Ai Text Writer Pro</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              專為高轉換率編輯內容設計的專業級 AI 寫作工作區，利用深度結構分析與 RAG 技術，填補通用 LLM 輸出與專業內容之間的差距。
            </p>
          </div>

          {/* Version List */}
          <div className="space-y-8 relative">
            {/* Timeline Line */}
            <div className="absolute left-[3px] top-2 bottom-2 w-px bg-gray-100"></div>

            {HISTORY.map((item, idx) => (
              <div key={idx} className="relative pl-6">
                <div className={`absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full ring-4 ring-white ${idx === 0 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>

                <div className="flex flex-col gap-1 mb-2">
                  <span className={`text-sm font-bold ${idx === 0 ? 'text-blue-700' : 'text-gray-900'}`}>
                    {item.version}
                  </span>
                  <span className="text-xs text-gray-400 font-mono tracking-wide">
                    {item.date}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
