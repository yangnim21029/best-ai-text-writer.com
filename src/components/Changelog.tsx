
import React from 'react';
import { X, GitCommit } from 'lucide-react';

interface ChangelogProps {
  isOpen: boolean;
  onClose: () => void;
}

const HISTORY = [
  {
    version: 'v1.6.0',
    date: '2025.12',
    description: '視覺風格庫上線與編輯器保存機制優化，並改善寫作彈窗的閱讀滚動體驗。'
  },
  {
    version: 'v1.5.0',
    date: '2025.12',
    description: '生成速度與準確度提升，優化超長文章素材處理，內容生成更貼合原文細節。'
  },
  {
    version: 'v1.4.0',
    date: '2025.12',
    description: '新增高頻詞與例句提取功能，並提供內容检查面板以強化用語地道度。'
  },
  {
    version: 'v1.3.0',
    date: '2025.03',
    description: '支援圖片風格統一設定，並提供文章游標處一鍵插入圖片素材功能。'
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
