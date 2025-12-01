

import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { Copy, Check, AlertCircle, Code, Eye, Square, Terminal, FileDown, Sparkles, Loader2, BrainCircuit } from 'lucide-react';
import { GenerationStatus, TargetAudience, CostBreakdown, TokenUsage, SavedProfile, ScrapedImage, GenerationStep, ProductBrief } from '../types';
import { RichTextEditor } from './RichTextEditor';
import { EditorProvider } from './editor/EditorContext';

interface PreviewProps {
  content: string;
  status: GenerationStatus;
  error: string | null;
  generationStep?: GenerationStep; // Added prop
  onStop: () => void;
  keyInformationPoints?: string[];
  brandExclusivePoints?: string[]; // NEW
  coveredPoints?: string[];
  targetAudience?: TargetAudience;
  scrapedImages?: ScrapedImage[];
  visualStyle?: string; // NEW
  onTogglePoint?: (point: string) => void;
  onRemoveScrapedImage?: (image: ScrapedImage) => void;
  onAddCost?: (cost: CostBreakdown, usage: TokenUsage) => void;
  savedProfiles?: SavedProfile[];
  onLoadProfile?: (profile: SavedProfile) => void;
  onRequestUrlMode?: () => void;
  productBrief?: ProductBrief; // NEW
  displayScale?: number;
  articleTitle?: string;
  onTitleChange?: (title: string) => void;
  outlineSections?: string[];
}

type ViewMode = 'visual' | 'code';

export const Preview: React.FC<PreviewProps> = ({ 
    content, 
    status, 
    error, 
    generationStep,
    onStop,
    keyInformationPoints = [],
    brandExclusivePoints = [], // NEW
    coveredPoints = [],
    targetAudience = 'zh-TW',
    scrapedImages = [],
    visualStyle = '',
    onTogglePoint,
    onRemoveScrapedImage,
    onAddCost,
    savedProfiles = [],
    onLoadProfile,
    onRequestUrlMode,
    productBrief, // NEW
    displayScale = 1,
    articleTitle = '',
    onTitleChange,
    outlineSections = [],
}) => {
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [editorHtml, setEditorHtml] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const isStreaming = status === 'streaming';
  const isAnalyzing = status === 'analyzing';
  const showModal = isStreaming || isAnalyzing; // Show modal for both
  const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

  useEffect(() => {
    if (status === 'completed' && content) {
      const parsed = marked.parse(content, { async: false }) as string;
      setEditorHtml(parsed);
    }
  }, [status, content]);

  useEffect(() => {
    if (scrollRef.current && isStreaming) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content, isStreaming]);

  const handleCopy = () => {
    const textToCopy = editorHtml;
    navigator.clipboard.writeText(textToCopy || content);
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Simple HTML to Markdown Converter for the Copy function
  const htmlToMarkdown = (html: string): string => {
      let md = html;
      
      // Block elements to newlines
      md = md.replace(/<p[^>]*>/gi, "").replace(/<\/p>/gi, "\n\n");
      md = md.replace(/<br\s*\/?>/gi, "\n");
      md = md.replace(/<div[^>]*>/gi, "").replace(/<\/div>/gi, "\n");
      md = md.replace(/<hr[^>]*>/gi, "\n---\n");
      
      // Headings
      md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
      md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
      md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
      md = md.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n");
      
      // Bold/Italic
      md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
      md = md.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
      md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
      md = md.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
      
      // Lists (Simple implementation)
      md = md.replace(/<ul[^>]*>/gi, "").replace(/<\/ul>/gi, "\n");
      md = md.replace(/<ol[^>]*>/gi, "").replace(/<\/ol>/gi, "\n");
      md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
      
      // Images
      md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, "![$2]($1)");
      md = md.replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, "![]($1)");

      // Links
      md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");
      
      // Blockquotes
      md = md.replace(/<blockquote[^>]*>/gi, "> ").replace(/<\/blockquote>/gi, "\n\n");

      // Cleanup HTML entities (basic)
      md = md.replace(/&nbsp;/g, " ");
      md = md.replace(/&amp;/g, "&");
      md = md.replace(/&lt;/g, "<");
      md = md.replace(/&gt;/g, ">");
      md = md.replace(/&quot;/g, '"');

      // Cleanup multiple newlines
      md = md.replace(/\n\s*\n\s*\n/g, "\n\n");
      
      return md.trim();
  };

  const handleCopyMarkdown = () => {
      const md = htmlToMarkdown(editorHtml);
      navigator.clipboard.writeText(md);
      alert("Markdown copied to clipboard!");
  };

  const getStepLabel = (step?: GenerationStep) => {
    switch(step) {
        case 'parsing_product': return 'Analyzing Product Context...';
        case 'nlp_analysis': return 'Running NLP Tokenization...';
        case 'extracting_structure': return 'Extracting Deep Structure & Authority...';
        case 'analyzing_visuals': return 'Extracting Visual Identity (Color/Style)...';
        case 'planning_keywords': return 'Planning Keyword Strategy (streaming)...';
        case 'mapping_product': return 'Mapping Pain Points to Features...';
        default: return 'Initializing AI Agents...';
    }
  };

  if (status === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center p-10 bg-gray-50">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-lg flex items-start space-x-4 text-red-700">
          <AlertCircle className="w-6 h-6 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-lg">Generation Failed</h3>
            <p className="mt-1 text-sm text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const StreamingModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/12 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300 ring-1 ring-black/5">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-white relative z-10">
           <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${isAnalyzing ? 'bg-indigo-50 border-indigo-100' : 'bg-blue-50 border-blue-100'}`}>
                  {isAnalyzing ? (
                      <BrainCircuit className="w-5 h-5 text-indigo-600 animate-pulse" />
                  ) : (
                      <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
                  )}
              </div>
              <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight">
                      {isAnalyzing ? 'Analyzing Content' : 'Generating Article'}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                      {isAnalyzing ? (
                          <span className="text-indigo-500">Optimizing Context Window...</span>
                      ) : (
                          <>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Streaming from Gemini 2.5...
                          </>
                      )}
                  </p>
              </div>
           </div>
           <div className="hidden sm:block">
              <div className="px-3 py-1 bg-gray-50 rounded-full border border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Preview Mode
              </div>
           </div>
        </div>
        
        {/* Content Stream / Analysis Area */}
        <div className="flex-1 bg-gray-50/30 p-8 relative overflow-hidden group min-h-[400px]">
           {isAnalyzing ? (
               <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                   <div className="relative">
                       <div className="w-24 h-24 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                       <div className="absolute inset-0 flex items-center justify-center">
                           <BrainCircuit className="w-8 h-8 text-indigo-600" />
                       </div>
                   </div>
                   <div className="space-y-2">
                       <h4 className="text-xl font-bold text-gray-800">{getStepLabel(generationStep)}</h4>
                       <p className="text-sm text-gray-500 max-w-md mx-auto">
                           We are analyzing structure, extracting keywords, and mapping authority signals in parallel.
                       </p>
                   </div>
                   <div className="flex gap-2 mt-4">
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                        <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                   </div>
                   {content && (
                     <div className="mt-6 w-full max-w-2xl bg-white border border-gray-200 rounded-xl shadow-sm text-left">
                        <div className="px-4 py-2 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                            Analysis stream
                        </div>
                        <div className="p-4 max-h-52 overflow-y-auto custom-scrollbar text-sm text-gray-700 whitespace-pre-wrap">
                            {content}
                        </div>
                     </div>
                   )}
               </div>
           ) : (
               <>
                <div 
                    ref={scrollRef}
                    className="h-full overflow-y-auto custom-scrollbar text-lg text-gray-700 leading-relaxed whitespace-pre-wrap pr-2 font-sans"
                >
                    {content ? (
                        <>
                            {stripHtml(content)}
                            <span className="inline-block w-2 h-5 bg-blue-600 ml-1 animate-pulse align-middle rounded-full"></span>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 opacity-60">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p className="text-sm font-medium">Initializing creative context...</p>
                        </div>
                    )}
                </div>
                <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>
               </>
           )}
        </div>
  
        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
              {content.length > 0 && (
                <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
                    {content.length.toLocaleString()} chars
                </div>
              )}
          </div>
          
          <button 
            onClick={onStop}
            className="group flex items-center gap-2 px-5 py-2.5 bg-white text-red-600 text-sm font-bold rounded-xl border border-red-100 hover:bg-red-50 hover:border-red-200 transition-all shadow-sm active:scale-95"
          >
            <Square className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            <span>Stop Generation</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-shrink-0 px-6 py-3 border-b border-gray-200 bg-white flex justify-between items-center z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center space-x-4">
             <div className="flex bg-gray-100 p-1 rounded-lg">
                <button
                    onClick={() => setViewMode('visual')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center space-x-2 transition-all ${
                        viewMode === 'visual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visual Editor</span>
                </button>
                <button
                    onClick={() => setViewMode('code')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center space-x-2 transition-all ${
                        viewMode === 'code' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                    <Code className="w-3.5 h-3.5" />
                    <span>HTML Source</span>
                </button>
             </div>
        </div>

        <div className="flex items-center space-x-2">
            <button
            onClick={handleCopyMarkdown}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100"
            title="Copy as Markdown"
            >
                <FileDown className="w-4 h-4" />
                <span>Copy Markdown</span>
            </button>
            
            <button
            onClick={handleCopy}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors active:bg-gray-100"
            title="Copy HTML Source"
            >
            {copied ? (
                <>
                <Check className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Copied</span>
                </>
            ) : (
                <>
                <Copy className="w-4 h-4" />
                <span>Copy Code</span>
                </>
            )}
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-white relative w-full h-full min-h-0">
        <div className="w-full h-full min-h-0 transition-opacity duration-300">
            {viewMode === 'visual' ? (
                <EditorProvider>
                    <RichTextEditor 
                        initialHtml={editorHtml} 
                        onChange={setEditorHtml} 
                        displayScale={displayScale}
                        articleTitle={articleTitle}
                        onTitleChange={onTitleChange}
                    />
                </EditorProvider>
            ) : (
                <div className="h-full w-full bg-gray-900 flex flex-col">
                    <div className="bg-gray-800 text-gray-400 px-4 py-2 text-xs font-mono flex items-center justify-between border-b border-gray-700">
                        <div className="flex items-center space-x-2">
                             <Terminal className="w-3 h-3" />
                             <span>source.html</span>
                        </div>
                        <span>{editorHtml.length} chars</span>
                    </div>
                    <textarea 
                        className="flex-1 w-full p-6 font-mono text-sm bg-gray-900 text-gray-100 focus:outline-none resize-none custom-scrollbar leading-relaxed"
                        value={editorHtml}
                        onChange={(e) => setEditorHtml(e.target.value)}
                        spellCheck={false}
                        placeholder="<!-- HTML content will appear here -->"
                    />
                </div>
            )}
        </div>

        {showModal && <StreamingModal />}
      </div>
    </div>
  );
};
