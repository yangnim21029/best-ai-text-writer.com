import React, { useEffect, useRef } from 'react';
import { Loader2, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { GenerationStep } from '../types';
import { marked } from 'marked';

interface StreamingModalProps {
  isOpen: boolean;
  content: string;
  step: GenerationStep;
  onClose?: () => void; // Optional, mostly for dev or forced close
}

export const StreamingModal: React.FC<StreamingModalProps> = ({ isOpen, content, step }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Track scroll position to determine if we should auto-scroll
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      // If we are within 100px of bottom, consider it "at bottom"
      isNearBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    }
  };

  // Auto-scroll to bottom ONLY if the user is already near the bottom
  useEffect(() => {
    if (scrollRef.current && isNearBottomRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content]);

  if (!isOpen) return null;

  const getStepLabel = (s: GenerationStep) => {
    switch (s) {
      case 'writing_content':
        return 'AI 正在撰寫文章...';
      case 'refining_headings':
        return '正在優化標題 (H2/H3 Swap)...';
      case 'localizing_hk':
        return '正在套用香港市場用語...';
      case 'finalizing':
        return '正在完成最後修飾...';
      default:
        return 'AI 正在思考...';
    }
  };

  // Pre-process content to style "Writing Section:" and "Active Blueprint:"
  const processedContent = (content || '')
    .replace(
      /Writing Section:\s*(.*)/g,
      `
            <div class="section-divider">
                <div class="section-icon-box">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="section-icon"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div class="flex-1">
                    <span class="section-badge">Writing Section</span>
                    <span class="section-title">$1</span>
                </div>
            </div>
        `
    )
    .replace(
      /Active Blueprint:\s*(.*)/g,
      `
            <div class="blueprint-info">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="blueprint-icon"><path d="m12 14 4-4 4 4-1.33 3.33a2 2 0 0 1-3.34 0L12 14Z"/><path d="m2 22 3-3"/><path d="m5 17 3 3"/><path d="m8.5 13.5 3 3"/></svg>
                <span>Active Blueprint: <strong>$1</strong></span>
            </div>
        `
    );

  const isRefining = step === 'refining_headings';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <style
        dangerouslySetInnerHTML={{
          __html: `
                .section-divider {
                    margin-top: 2.5rem;
                    margin-bottom: 1.5rem;
                    padding: 0.75rem 1rem;
                    background: #f8fafc;
                    border-left: 4px solid #3b82f6;
                    border-radius: 0 0.75rem 0.75rem 0;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    box-shadow: inset 0 1px 2px rgba(0,0,0,0.02);
                }
                .section-icon-box {
                    width: 1.75rem;
                    height: 1.75rem;
                    background: #eff6ff;
                    border-radius: 0.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #2563eb;
                    border: 1px solid #dbeafe;
                    flex-shrink: 0;
                }
                .section-badge {
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: #64748b;
                    background: #f1f5f9;
                    padding: 2px 8px;
                    border-radius: 4px;
                    border: 1px solid #e2e8f0;
                    display: inline-block;
                    margin-bottom: 2px;
                }
                .section-title {
                    font-size: 14px;
                    font-weight: 800;
                    color: #1e293b;
                    display: block;
                }
                .blueprint-info {
                    font-size: 11px;
                    color: #64748b;
                    background: #f0f9ff;
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: 1px solid #bae6fd;
                    margin-bottom: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .blueprint-icon {
                    color: #0ea5e9;
                    flex-shrink: 0;
                }
            `,
        }}
      />
      <div className="bg-white w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${isRefining ? 'bg-purple-100' : 'bg-blue-100'}`}
            >
              {isRefining ? (
                <Sparkles className="w-5 h-5 text-purple-600 animate-pulse" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {getStepLabel(step)}
              </h3>
              <p className="text-xs text-gray-500">請稍候，文章生成中...</p>
            </div>
          </div>

          {/* Progress Steps (Visual only) */}
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
            <span
              className={`flex items-center gap-1 ${step === 'writing_content' ? 'text-blue-600' : 'text-gray-600'}`}
            >
              <FileText className="w-3 h-3" /> 撰寫
            </span>
            <span className="w-4 h-px bg-gray-300" />
            <span
              className={`flex items-center gap-1 ${step === 'refining_headings' ? 'text-purple-600' : step === 'finalizing' ? 'text-green-600' : ''}`}
            >
              <Sparkles className="w-3 h-3" /> 優化
            </span>
            <span className="w-4 h-px bg-gray-300" />
            <span
              className={`flex items-center gap-1 ${step === 'finalizing' ? 'text-green-600' : ''}`}
            >
              <CheckCircle2 className="w-3 h-3" /> 完成
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative bg-white">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-auto p-10 custom-scrollbar scroll-smooth"
          >
            <div className="prose prose-slate prose-lg max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h1:text-3xl prose-h2:text-2xl prose-p:text-slate-600 prose-p:leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: marked.parse(processedContent) as string }} />

              {/* Cursor Effect */}
              {step !== 'finalizing' && (
                <span className="inline-block w-2 h-5 bg-blue-500 ml-1 animate-pulse align-middle" />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 text-center text-xs text-gray-400">
          AI 生成內容僅供參考，請務必人工審閱。
        </div>
      </div>
    </div>
  );
};
