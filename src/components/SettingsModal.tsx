'use client';

import React from 'react';
import {
  X,
  Settings,
  Database,
  Cpu,
  Hash,
  RotateCcw,
  Save,
  Zap,
  Image as ImageIcon,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const {
    modelFlash,
    modelImage,
    keywordCharDivisor,
    minKeywords,
    maxKeywords,
    setModelFlash,
    setModelImage,
    setKeywordCharDivisor,
    setMinKeywords,
    setMaxKeywords,
    defaultModelAppearance,
    defaultDesignStyle,
    setDefaultModelAppearance,
    setDefaultDesignStyle,
    useRag,
    autoImagePlan,
    setUseRag,
    setAutoImagePlan,
    resetSettings: resetToDefaults,
  } = useAppStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-[520px] max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-gray-500" />
            <h3 className="text-base font-bold text-gray-800">系統設定</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[#fbfbfb]">
          {/* Model Config */}
          <section className="space-y-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5" />
              模型設定
            </h4>

            <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                  分析與寫作模型 (Text Model)
                </label>
                <input
                  type="text"
                  value={modelFlash}
                  onChange={(e) => setModelFlash(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. gemini-3-flash-preview"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                  視覺與圖像模型 (Vision Model)
                </label>
                <input
                  type="text"
                  value={modelImage}
                  onChange={(e) => setModelImage(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. google/gemini-2.5-flash-image"
                />
              </div>
            </div>
          </section>

          {/* Image Appearance */}
          <section className="space-y-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5" />
              圖片風格
            </h4>

            <div className="space-y-5 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                  人物外觀 (預設值)
                </label>
                <textarea
                  value={defaultModelAppearance}
                  onChange={(e) => setDefaultModelAppearance(e.target.value)}
                  className="w-full h-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none leading-relaxed"
                  placeholder="例如：亞洲女性，穿著正式商務裝，自然採光..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                  圖表/資訊圖風格 (預設值)
                </label>
                <textarea
                  value={defaultDesignStyle}
                  onChange={(e) => setDefaultDesignStyle(e.target.value)}
                  className="w-full h-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none leading-relaxed"
                  placeholder="例如：極簡扁平化設計，清爽線條..."
                />
              </div>
            </div>
          </section>

          {/* Generation Preferences */}
          <section className="space-y-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              生成偏好
            </h4>

            <div className="space-y-3 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gray-700">啟用知識庫 (RAG)</div>
                  <div className="text-[10px] text-gray-400">使用存儲的品牌指南或外部來源</div>
                </div>
                <button
                  type="button"
                  onClick={() => setUseRag(!useRag)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all ${useRag ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${useRag ? 'translate-x-4.5' : 'translate-x-1'}`}
                  />
                </button>
              </div>

              <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gray-700">自動規劃圖片</div>
                  <div className="text-[10px] text-gray-400">在本文寫作後自動產生圖片腳本</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoImagePlan(!autoImagePlan)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-all ${autoImagePlan ? 'bg-blue-600' : 'bg-gray-200'}`}
                >
                  <span
                    className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${autoImagePlan ? 'translate-x-4.5' : 'translate-x-1'}`}
                  />
                </button>
              </div>
            </div>
          </section>

          {/* Magic Numbers */}
          <section className="space-y-4">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Hash className="w-3.5 h-3.5" />
              關鍵詞邏輯
            </h4>

            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-5">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                    字符間隔 (每 X 字提取一個詞)
                  </label>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {keywordCharDivisor}
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="1000"
                  step="50"
                  value={keywordCharDivisor}
                  onChange={(e) => setKeywordCharDivisor(parseInt(e.target.value))}
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                    最小詞數
                  </label>
                  <input
                    type="number"
                    value={minKeywords}
                    onChange={(e) => setMinKeywords(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">
                    最大詞數
                  </label>
                  <input
                    type="number"
                    value={maxKeywords}
                    onChange={(e) => setMaxKeywords(parseInt(e.target.value))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={resetToDefaults}
            className="text-[11px] font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-tight"
          >
            重置回預設值 (Reset)
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            >
              儲存設定
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
