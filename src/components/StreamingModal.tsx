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

  // Pre-process content to style "Writing Section:" and "Active Blueprint:" in a more natural way
  const processedContent = (content || '')
    .replace(
      /Writing Section:\s*(.*)/g,
      `
            <div class="elegant-section-header">
                <span class="elegant-section-dot"></span>
                <span class="elegant-section-title">$1</span>
            </div>
        `
    )
    .replace(
      /Active Blueprint:\s*(.*)/g,
      '' // Hide blueprint info from user for a cleaner look
    );

  const isRefining = step === 'refining_headings';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 sm:p-6">
      <style
        dangerouslySetInnerHTML={{
          __html: `
                .elegant-section-header {
                    margin-top: 3.5rem;
                    margin-bottom: 2rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    opacity: 0.9;
                    animation: elegantFadeIn 0.8s ease-out forwards;
                }
                @keyframes elegantFadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 0.9; transform: translateY(0); }
                }
                .elegant-section-dot {
                    width: 6px;
                    height: 6px;
                    background: #3b82f6;
                    border-radius: 50%;
                    box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
                }
                .elegant-section-title {
                    font-size: 13px;
                    font-weight: 600;
                    letter-spacing: 0.05em;
                    color: #64748b;
                    text-transform: uppercase;
                }
                .streaming-content {
                    animation: contentFlow 0.5s ease-out forwards;
                }
                @keyframes contentFlow {
                    from { opacity: 0.8; filter: blur(2px); }
                    to { opacity: 1; filter: blur(0); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `,
        }}
      />
      <div className="bg-white/95 w-full max-w-5xl h-[85vh] rounded-[2rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden border border-white/20 animate-in fade-in zoom-in-98 duration-500">
        {/* Header - Minimalist */}
        <div className="px-10 py-8 flex items-center justify-between bg-gradient-to-b from-white to-transparent">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20 animate-pulse"></div>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative z-10 transition-colors duration-500 ${isRefining ? 'bg-indigo-50' : 'bg-blue-50'}`}>
                {isRefining ? (
                  <Sparkles className="w-6 h-6 text-indigo-500" />
                ) : (
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin-slow" />
                )}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight leading-none mb-1">
                {getStepLabel(step)}
              </h3>
              <div className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">Generating Masterpiece</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
             <div className="flex flex-col items-end mr-4">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Current Progress</span>
                <div className="h-1 w-24 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div 
                        className="h-full bg-blue-500 transition-all duration-1000 ease-out" 
                        style={{ width: step === 'writing_content' ? '40%' : step === 'refining_headings' ? '75%' : '100%' }}
                    ></div>
                </div>
             </div>
          </div>
        </div>

        {/* Content Area - Immersive */}
        <div className="flex-1 overflow-hidden relative">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="absolute inset-0 overflow-y-auto px-10 sm:px-20 pb-20 custom-scrollbar scroll-smooth"
          >
            <div className="max-w-3xl mx-auto">
                <div className="prose prose-slate prose-xl max-w-none 
                    prose-headings:text-slate-900 prose-headings:font-bold prose-headings:tracking-tight
                    prose-p:text-slate-600 prose-p:leading-[1.8] prose-p:mb-8
                    prose-li:text-slate-600 prose-strong:text-slate-900
                    streaming-content">
                <div dangerouslySetInnerHTML={{ __html: marked.parse(processedContent) as string }} />

                {/* Intelligent Cursor */}
                {step !== 'finalizing' && (
                    <div className="mt-4 flex items-center gap-2 text-blue-500 font-medium italic animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        <span className="text-sm tracking-wide">AI 正在斟酌遣詞用句...</span>
                    </div>
                )}
                </div>
            </div>
          </div>
          
          {/* Bottom Gradient overlay for smoother read */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
        </div>

        {/* Footer - Minimalist */}
        <div className="px-10 py-6 flex items-center justify-between bg-white border-t border-slate-50">
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-3 h-3" /> Powered by Gemini 3 Flash
          </span>
          <p className="text-[10px] font-medium text-slate-300">
            Professional Content Generation Pipeline
          </p>
        </div>
      </div>
    </div>
  );
};
