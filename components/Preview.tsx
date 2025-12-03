

import React, { useState, useEffect } from 'react';
import { marked } from 'marked';
import { Copy, Check, AlertCircle, Code, Eye, Terminal, FileDown, Loader2, Sparkles } from 'lucide-react';
import { GenerationStatus, TargetAudience, CostBreakdown, TokenUsage, SavedProfile, ScrapedImage, GenerationStep, ProductBrief } from '../types';
import { RichTextEditor } from './RichTextEditor';
import { EditorProvider } from './editor/EditorContext';
import { StreamingModal } from './StreamingModal';

interface PreviewProps {
  content: string;
  status: GenerationStatus;
  error: string | null;
  generationStep?: GenerationStep; // Added prop
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

interface ToolbarActionsProps {
  viewMode: ViewMode;
  onChangeView: (mode: ViewMode) => void;
  onCopyHtml: () => void;
  onCopyMarkdown: () => void;
  copied: boolean;
  variant?: 'light' | 'dark';
}

const ToolbarActions: React.FC<ToolbarActionsProps> = ({
  viewMode,
  onChangeView,
  onCopyHtml,
  onCopyMarkdown,
  copied,
  variant = 'light',
}) => {
  const isDark = variant === 'dark';
  const toggleBase = isDark ? 'border-gray-700 bg-gray-800 text-gray-200' : 'border-gray-200 bg-white text-gray-700';
  const toggleActive = isDark ? 'bg-blue-900/40 text-blue-100 border border-blue-500/40' : 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm';
  const toggleInactive = isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-50';
  const copyButton = isDark
    ? 'bg-gray-800 border border-gray-700 text-gray-200 hover:bg-gray-700'
    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50';

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`flex items-center rounded-md overflow-hidden ${toggleBase}`}>
        <button
          onClick={() => onChangeView('visual')}
          className={`flex items-center gap-1 px-3 py-1.5 transition-colors ${viewMode === 'visual' ? toggleActive : toggleInactive}`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="font-semibold">Visual Editor</span>
        </button>
        <button
          onClick={() => onChangeView('code')}
          className={`flex items-center gap-1 px-3 py-1.5 transition-colors ${viewMode === 'code' ? toggleActive : toggleInactive}`}
        >
          <Code className="w-3.5 h-3.5" />
          <span className="font-semibold">HTML Source</span>
        </button>
      </div>

      <button
        onClick={onCopyMarkdown}
        className={`flex items-center gap-1 px-3 py-1.5 font-medium rounded-md transition-colors ${copyButton}`}
        title="Copy as Markdown"
      >
        <FileDown className="w-4 h-4" />
        <span>Markdown</span>
      </button>

      <button
        onClick={onCopyHtml}
        className={`flex items-center gap-1 px-3 py-1.5 font-semibold rounded-md transition-colors ${copyButton}`}
        title="Copy HTML Source"
      >
        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
        <span className={copied ? 'text-green-600' : ''}>{copied ? 'Copied' : 'HTML'}</span>
      </button>
    </div>
  );
};

export const Preview: React.FC<PreviewProps> = ({
  content,
  status,
  error,
  generationStep,
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

  const isAnalyzing = status === 'analyzing';

  // Start every new analysis with a clean editor to avoid showing stale drafts
  useEffect(() => {
    if (status === 'analyzing') {
      setEditorHtml('');
    }
  }, [status]);

  useEffect(() => {
    if (status === 'completed' && content) {
      const parsed = marked.parse(content, { async: false }) as string;
      setEditorHtml(parsed);
    }
  }, [status, content]);

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

  const renderToolbarActions = (variant: 'light' | 'dark' = 'light') => (
    <ToolbarActions
      viewMode={viewMode}
      onChangeView={setViewMode}
      onCopyHtml={handleCopy}
      onCopyMarkdown={handleCopyMarkdown}
      copied={copied}
      variant={variant}
    />
  );

  const getStepLabel = (step?: GenerationStep) => {
    switch (step) {
      case 'parsing_product': return '正在讀取產品資訊';
      case 'nlp_analysis': return '正在整理重點字詞';
      case 'extracting_structure': return '正在歸納段落架構';
      case 'analyzing_visuals': return '正在偵測圖片風格';
      case 'planning_keywords': return '正在規劃關鍵字';
      case 'mapping_product': return '正在配對痛點與賣點';
      default: return 'AI 正在準備';
    }
  };

  const InlineAnalysisIndicator = () => (
    <div className="absolute inset-0 z-40 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-blue-500 animate-pulse" />
          </div>
        </div>
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 tracking-tight">
            {getStepLabel(generationStep)}
          </h3>
          <p className="text-sm text-gray-500 font-medium mt-1">請查看右側面板以獲取即時分析結果...</p>
        </div>
      </div>
    </div>
  );

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

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-shrink-0 px-6 py-3 border-b border-gray-200 bg-white flex justify-between items-center z-30 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('visual')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center space-x-2 transition-all ${viewMode === 'visual' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visual Editor</span>
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center space-x-2 transition-all ${viewMode === 'code' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
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

        {isAnalyzing && <InlineAnalysisIndicator />}

        <StreamingModal
          isOpen={status === 'streaming'}
          content={content}
          step={generationStep || 'writing_content'}
        />
      </div>
    </div>
  );
};
