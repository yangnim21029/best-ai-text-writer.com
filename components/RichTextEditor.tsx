

import React, { useEffect, useRef, useState } from 'react';
import { 
  Bold, Italic, Underline, Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Link as LinkIcon, Undo, Redo, 
  AlignLeft, AlignCenter, AlignRight, Type, Sparkles, X, ArrowRight, Image as ImageIcon, ListTodo, CheckSquare, Square,
  GalleryHorizontalEnd, Loader2, Plus, RefreshCw, Map, PlayCircle, Wand2, Eraser, FileCode, ExternalLink, Palette
} from 'lucide-react';
import { marked } from 'marked';
import { generateSnippet } from '../services/geminiService';
import { generateImagePromptFromContext, generateImage, planImagesForArticle } from '../services/imageService';
import { TargetAudience, CostBreakdown, TokenUsage, ScrapedImage, ImageAssetPlan } from '../types';

interface RichTextEditorProps {
  initialHtml: string;
  onChange?: (html: string) => void;
  keyPoints?: string[];
  checkedPoints?: string[];
  scrapedImages?: ScrapedImage[];
  visualStyle?: string; // NEW
  onTogglePoint?: (point: string) => void;
  targetAudience?: TargetAudience;
  onAddCost?: (cost: CostBreakdown, usage: TokenUsage) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
    initialHtml, 
    onChange,
    keyPoints = [],
    checkedPoints = [],
    scrapedImages = [],
    visualStyle = '',
    onTogglePoint,
    targetAudience = 'zh-TW',
    onAddCost
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedContext, setSelectedContext] = useState(''); // Text selected by user
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isFormatMode, setIsFormatMode] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  const [showImageModal, setShowImageModal] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(false);

  const [showKeyPoints, setShowKeyPoints] = useState(false);
  const [showVisualAssets, setShowVisualAssets] = useState(false);
  
  // Stats
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  
  // Auto-Plan State
  const [imagePlans, setImagePlans] = useState<ImageAssetPlan[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  useEffect(() => {
    if (editorRef.current && initialHtml) {
      // Only update if significantly different to avoid cursor jumping
      if (Math.abs(editorRef.current.innerHTML.length - initialHtml.length) > 5) {
          editorRef.current.innerHTML = initialHtml;
          updateStats();
      }
    }
  }, [initialHtml]);

  const updateStats = () => {
      if (editorRef.current) {
          const text = editorRef.current.innerText || "";
          setCharCount(text.length);
          
          // Hybrid Word Count Logic:
          // 1. Count CJK characters individually
          const cjkCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
          
          // 2. Count English/Latin words (split by whitespace after removing CJK)
          const nonCjkText = text.replace(/[\u4e00-\u9fa5]/g, ' ');
          const englishWords = nonCjkText.trim().split(/\s+/).filter(w => w.length > 0);
          
          setWordCount(cjkCount + englishWords.length);
      }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      updateStats();
      onChange?.(e.currentTarget.innerHTML);
  };

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
    }
  };

  const handleRemoveBold = () => {
      if (!editorRef.current) return;
      
      // Strategy: Regex replacement on innerHTML to strip strong/b tags and ** markdown
      // Note: this is a heavy operation, might reset cursor, but effective for "cleaning"
      let html = editorRef.current.innerHTML;
      
      // Remove standard HTML bold tags, preserving content
      html = html.replace(/<\/?strong[^>]*>/gi, "");
      html = html.replace(/<\/?b[^>]*>/gi, "");
      
      // Remove specific span styling if generated (basic)
      html = html.replace(/<span style="font-weight: ?bold;?">/gi, "<span>");
      
      // Remove markdown double asterisks if visible in text
      // We need to be careful not to break text content
      html = html.replace(/\*\*/g, "");

      // Remove Chinese quotation marks as requested
      html = html.replace(/[「」]/g, "");

      editorRef.current.innerHTML = html;
      handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
  };

  const saveSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
              setSavedRange(range.cloneRange());
              return range;
          }
      }
      return null;
  };

  const restoreSelection = () => {
      if (savedRange) {
          const selection = window.getSelection();
          if (selection) {
              selection.removeAllRanges();
              selection.addRange(savedRange);
          }
      }
  };

  const openAiModal = () => {
    const range = saveSelection();
    
    // Set context if selection exists
    if (range && !range.collapsed) {
        setSelectedContext(range.toString());
    } else {
         setSelectedContext('');
    }

    setShowAiModal(true);
  };

  const closeAiModal = () => {
    setShowAiModal(false);
    setAiPrompt('');
    setSelectedContext('');
    setIsFormatMode(false);
    if (editorRef.current) {
        editorRef.current.focus();
    }
  };

  const handleOpenImageModal = async () => {
      saveSelection();
      setShowImageModal(true);
      setIsImageLoading(true);
      setImagePrompt("Analyzing context...");

      let contextText = "";
      if (editorRef.current) {
          const fullText = editorRef.current.innerText;
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const preCaretRange = range.cloneRange();
              preCaretRange.selectNodeContents(editorRef.current);
              preCaretRange.setEnd(range.startContainer, range.startOffset);
              const startOffset = preCaretRange.toString().length;
              
              const start = Math.max(0, startOffset - 100);
              const end = Math.min(fullText.length, startOffset + 100);
              contextText = fullText.substring(start, end);
          } else {
              contextText = fullText.substring(0, 200);
          }
      }

      try {
          // PASS VISUAL STYLE
          const res = await generateImagePromptFromContext(contextText, targetAudience as TargetAudience, visualStyle);
          setImagePrompt(res.data);
          if (onAddCost) onAddCost(res.cost, res.usage);
      } catch (e) {
          setImagePrompt("Create a realistic image relevant to this article.");
      } finally {
          setIsImageLoading(false);
      }
  };

  const handleGenerateImage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!imagePrompt) return;
      
      setIsImageLoading(true);
      try {
          const res = await generateImage(imagePrompt);
          
          if (res.data) {
              restoreSelection();
              const imgHtml = `<img src="${res.data}" alt="${imagePrompt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" /><br/>`;
              document.execCommand('insertHTML', false, imgHtml);
              if (editorRef.current) handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
              
              if (onAddCost) onAddCost(res.cost, res.usage);
              setShowImageModal(false);
          } else {
              alert("Image generation returned no data.");
          }
      } catch (e) {
          console.error("Image generation error", e);
          alert("Failed to generate image.");
      } finally {
          setIsImageLoading(false);
      }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsAiLoading(true);
    try {
        let promptToSend = aiPrompt;
        
        if (isFormatMode && selectedContext) {
            promptToSend = `
            TARGET CONTENT: """${selectedContext}"""
            
            FORMATTING INSTRUCTION: ${aiPrompt}
            
            TASK: Reformat the TARGET CONTENT exactly according to the instruction. 
            - If asked for a table, output a Markdown/HTML table.
            - If asked for a list, output a list.
            - Do NOT change the core meaning, only the format.
            - Return ONLY the formatted result in Markdown/HTML.
            `;
        } else if (selectedContext && selectedContext.trim().length > 0) {
             promptToSend = `TARGET TEXT TO MODIFY: """${selectedContext}"""\n\nINSTRUCTION: ${aiPrompt}\n\nTASK: Rewrite or replace the target text based on the instruction. Return ONLY the result in Markdown/HTML.`;
        }

        const res = await generateSnippet(promptToSend, targetAudience as TargetAudience);
        // Parse the result in case AI returns Markdown
        const htmlSnippet = marked.parse(res.data, { async: false }) as string;
        
        restoreSelection();
        // insertHTML replaces the selection
        document.execCommand('insertHTML', false, htmlSnippet);
        
        if (editorRef.current) handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
        if (onAddCost) onAddCost(res.cost, res.usage);
        
        closeAiModal();
    } catch (error) {
        console.error("AI Edit failed", error);
        alert("Failed to generate content. Please try again.");
    } finally {
        setIsAiLoading(false);
    }
  };

  // --- Auto-Plan & Batch Insertion Logic ---

  const handleAutoPlan = async () => {
      if (isPlanning || !editorRef.current) return;
      setIsPlanning(true);
      
      try {
          const content = editorRef.current.innerText;
          // We pass the targetAudience AND visualStyle here
          const res = await planImagesForArticle(content, scrapedImages, targetAudience as TargetAudience, visualStyle);
          setImagePlans(res.data);
          if (onAddCost) onAddCost(res.cost, res.usage);
      } catch (e) {
          console.error("Auto-plan failed", e);
          alert("Failed to plan images.");
      } finally {
          setIsPlanning(false);
      }
  };

  const injectImageIntoEditor = (plan: ImageAssetPlan) => {
      if (!editorRef.current || !plan.url) return;

      const anchorText = plan.insertAfter.trim();
      const currentHtml = editorRef.current.innerHTML;
      
      // Check if already inserted
      if (currentHtml.includes(plan.url)) return;

      const imgHtml = `<img src="${plan.url}" alt="${plan.generatedPrompt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 24px 0; display: block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />`;
      
      // --- Improved Insertion Strategy with Chunk Fallbacks ---
      
      // 1. Exact Match
      if (currentHtml.includes(anchorText)) {
          const newHtml = currentHtml.replace(anchorText, `${anchorText}<br/>${imgHtml}`);
          editorRef.current.innerHTML = newHtml;
          handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
          return;
      }

      // 2. Chunk Match Strategy (Fix for punctuation/spacing issues)
      // Split by common CJK and English punctuation
      const chunks = anchorText.split(/[，,。.\n\t\s、：:]+/).filter(c => c.length >= 4); // Min 4 chars to avoid false positives
      
      // Sort by length desc to try longest match first
      chunks.sort((a, b) => b.length - a.length);
      
      for (const chunk of chunks) {
          if (currentHtml.includes(chunk)) {
               const newHtml = currentHtml.replace(chunk, `${chunk}<br/>${imgHtml}`);
               editorRef.current.innerHTML = newHtml;
               handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
               console.log(`Image inserted using partial chunk match: "${chunk}"`);
               return;
          }
      }

      // 3. Fallback to start/end substring if chunks failed (unlikely but safe)
      const shortStart = anchorText.substring(0, 10);
      if (shortStart.length > 5 && currentHtml.includes(shortStart)) {
          const newHtml = currentHtml.replace(shortStart, `${shortStart}<br/>${imgHtml}`);
          editorRef.current.innerHTML = newHtml;
          handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
          return;
      }

      console.warn("Anchor text not found (Exact or Partial):", anchorText);
      alert(`Could not find insertion point for: "...${anchorText.substring(0, 20)}...". Try placing cursor and inserting manually.`);
  };

  const updatePlanPrompt = (id: string, newPrompt: string) => {
      setImagePlans(prev => prev.map(p => p.id === id ? { ...p, generatedPrompt: newPrompt } : p));
  };

  const generateSinglePlan = async (plan: ImageAssetPlan) => {
      if (plan.status === 'generating') return;
      
      setImagePlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: 'generating' } : p));
      try {
          const imgRes = await generateImage(plan.generatedPrompt);
          if (imgRes.data) {
              const updatedPlan = { ...plan, status: 'done' as const, url: imgRes.data || undefined };
              setImagePlans(prev => prev.map(p => p.id === plan.id ? updatedPlan : p));
              if (onAddCost) onAddCost(imgRes.cost, imgRes.usage);
          } else {
              setImagePlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: 'error' } : p));
              alert("Failed to generate image data.");
          }
      } catch (e) {
          console.error("Single generation failed", e);
          setImagePlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: 'error' } : p));
      }
  };

  const handleBatchProcess = async () => {
      if (isBatchProcessing) return;
      setIsBatchProcessing(true);

      const plansToProcess = imagePlans.filter(p => p.status !== 'done');

      for (let i = 0; i < plansToProcess.length; i++) {
          const plan = plansToProcess[i];
          setImagePlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: 'generating' } : p));
          
          try {
              const imgRes = await generateImage(plan.generatedPrompt);
              if (imgRes.data) {
                  const updatedPlan = { ...plan, status: 'done' as const, url: imgRes.data || undefined };
                  setImagePlans(prev => prev.map(p => p.id === plan.id ? updatedPlan : p));
                  injectImageIntoEditor(updatedPlan);
                  if (onAddCost) onAddCost(imgRes.cost, imgRes.usage);
              } else {
                  setImagePlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: 'error' } : p));
              }
          } catch (e) {
              console.error("Generation failed for plan", plan.id, e);
              setImagePlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: 'error' } : p));
          }
      }
      setIsBatchProcessing(false);
  };

  const ToolbarButton = ({ 
    icon: Icon, command, value, label, onClick, active 
  }: { icon: React.ElementType, command?: string, value?: string, label?: string, onClick?: () => void, active?: boolean }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        if (onClick) onClick();
        else if (command) execCommand(command, value);
      }}
      className={`p-2 rounded transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-100 hover:text-blue-600'}`}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="flex flex-col h-full w-full bg-white overflow-hidden relative">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 flex-shrink-0 z-20">
        <div className="flex items-center space-x-1 pr-2 border-r border-gray-300">
          <ToolbarButton icon={Heading2} command="formatBlock" value="<h2>" label="Heading 2" />
          <ToolbarButton icon={Heading3} command="formatBlock" value="<h3>" label="Heading 3" />
          <ToolbarButton icon={Type} command="formatBlock" value="<p>" label="Paragraph" />
        </div>
        
        <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
          <ToolbarButton icon={Bold} command="bold" label="Bold" />
          <ToolbarButton icon={Italic} command="italic" label="Italic" />
          <ToolbarButton icon={Underline} command="underline" label="Underline" />
          <ToolbarButton 
            icon={Eraser} 
            onClick={handleRemoveBold} 
            label="Remove All Bold Formatting & Quotes" 
          />
        </div>

        <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
          <ToolbarButton icon={List} command="insertUnorderedList" label="Bullet List" />
          <ToolbarButton icon={ListOrdered} command="insertOrderedList" label="Numbered List" />
          <ToolbarButton icon={Quote} command="formatBlock" value="<blockquote>" label="Quote" />
        </div>

        <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
          <ToolbarButton icon={AlignLeft} command="justifyLeft" label="Align Left" />
          <ToolbarButton icon={AlignCenter} command="justifyCenter" label="Align Center" />
          <ToolbarButton icon={AlignRight} command="justifyRight" label="Align Right" />
        </div>

        <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
            <ToolbarButton icon={ImageIcon} onClick={handleOpenImageModal} label="Insert AI Image" />
        </div>

         <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
            <button
                type="button"
                onClick={() => execCommand('undo')}
                className="p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded transition-colors"
                title="Undo (Ctrl+Z)"
            >
                <Undo className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => execCommand('redo')}
                className="p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded transition-colors"
                title="Redo (Ctrl+Y)"
            >
                <Redo className="w-4 h-4" />
            </button>
        </div>
        
        <div className="flex items-center space-x-1 px-2">
            {keyPoints.length > 0 && (
                <ToolbarButton 
                    icon={ListTodo} 
                    onClick={() => { setShowKeyPoints(!showKeyPoints); setShowVisualAssets(false); }} 
                    label="Toggle Key Points Checklist"
                    active={showKeyPoints}
                />
            )}
            <ToolbarButton 
                icon={GalleryHorizontalEnd} 
                onClick={() => { setShowVisualAssets(!showVisualAssets); setShowKeyPoints(false); }} 
                label="Toggle Visual Assets Manager"
                active={showVisualAssets}
            />
        </div>

        <div className="ml-auto">
            <button
                type="button"
                onClick={openAiModal}
                className="flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:shadow-md transition-all text-xs font-medium"
            >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask AI</span>
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative w-full h-full">
          <div className="flex-1 overflow-hidden bg-white relative group min-h-0 flex flex-col">
            <div
              ref={editorRef}
              contentEditable
              className="editor-content prose prose-lg max-w-none p-8 md:p-12 focus:outline-none flex-1 overflow-y-auto custom-scrollbar pb-32"
              onInput={handleInput}
              spellCheck={false}
              onMouseUp={saveSelection}
              onKeyUp={saveSelection}
            />
            
            {/* Stats Footer */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-500 font-mono flex items-center justify-end gap-4 select-none">
                <span>{wordCount} words</span>
                <span>{charCount} chars</span>
            </div>

            {/* Ask AI Modal - Fixed Position Top Right */}
            {showAiModal && (
                <div 
                    className="absolute z-50 bg-white rounded-lg shadow-2xl border border-gray-200 w-96 p-4 animate-in fade-in zoom-in-95 duration-200"
                    style={{ 
                        top: 10, 
                        right: 10
                    }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 text-purple-600">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wide">
                                {isFormatMode ? 'AI Formatter' : (selectedContext ? 'AI Edit / Rewrite' : 'AI Writer')}
                            </span>
                        </div>
                        <button onClick={closeAiModal} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <form onSubmit={handleAiSubmit}>
                        {selectedContext && (
                            <div className="mb-2 p-2 bg-indigo-50 rounded border border-indigo-100 text-xs text-indigo-700 truncate relative">
                                <span className="font-bold mr-1">Selection:</span> 
                                "{selectedContext}"
                            </div>
                        )}

                        {/* Tool Toggle */}
                         <div className="flex gap-2 mb-2">
                            <button
                                type="button"
                                onClick={() => setIsFormatMode(false)}
                                className={`flex-1 py-1 text-[10px] font-bold rounded border transition-colors ${!isFormatMode ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-500'}`}
                            >
                                Write/Edit
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsFormatMode(true)}
                                className={`flex-1 py-1 text-[10px] font-bold rounded border transition-colors ${isFormatMode ? 'bg-purple-100 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-500'}`}
                            >
                                <FileCode className="w-3 h-3 inline mr-1" />
                                Format
                            </button>
                        </div>

                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            placeholder={
                                isFormatMode ? "e.g. Convert to a table with columns Name, Age..." :
                                (selectedContext ? "How should AI rewrite this text?" : "Tell AI what to write next...")
                            }
                            className="w-full text-sm p-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none mb-3 bg-gray-50"
                            rows={3}
                            autoFocus
                        />
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isAiLoading || !aiPrompt.trim()}
                                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900 text-white rounded-md text-xs font-medium hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {isAiLoading ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>{isFormatMode ? 'Format Selection' : (selectedContext ? 'Rewrite & Replace' : 'Insert Content')}</span>
                                        <ArrowRight className="w-3 h-3" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
          </div>

          {/* RIGHT SIDEBARS */}
          {showKeyPoints && (
              <div className="w-80 bg-orange-50 border-l border-orange-100 flex flex-col shadow-inner z-10">
                  <div className="p-3 border-b border-orange-200 flex items-center justify-between bg-orange-100/50">
                      <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider flex items-center gap-2">
                          <ListTodo className="w-3.5 h-3.5" />
                          Key Points Checklist
                      </h4>
                      <div className="text-[10px] font-medium text-orange-700 bg-orange-200/50 px-1.5 py-0.5 rounded-full">
                          {checkedPoints.length}/{keyPoints.length}
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                      {keyPoints.map((point, idx) => {
                          const isChecked = checkedPoints.includes(point);
                          return (
                              <div 
                                key={idx} 
                                onClick={() => onTogglePoint?.(point)}
                                className={`p-2 rounded-lg text-xs cursor-pointer transition-all border ${
                                    isChecked 
                                    ? 'bg-orange-100/50 border-orange-200 text-gray-500' 
                                    : 'bg-white border-orange-100 text-gray-800 hover:border-orange-300 hover:shadow-sm'
                                }`}
                              >
                                  <div className="flex items-start gap-2">
                                      {isChecked ? (
                                          <CheckSquare className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                      ) : (
                                          <Square className="w-4 h-4 text-orange-300 flex-shrink-0" />
                                      )}
                                      <span className={isChecked ? 'line-through opacity-75' : ''}>
                                          {point}
                                      </span>
                                  </div>
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {showVisualAssets && (
             <div className="w-[340px] bg-blue-50 border-l border-blue-100 flex flex-col shadow-inner z-10">
                 <div className="p-3 border-b border-blue-200 bg-blue-100/50">
                     <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider flex items-center gap-2">
                            <GalleryHorizontalEnd className="w-3.5 h-3.5" />
                            Visual Assets
                        </h4>
                        {imagePlans.length > 0 && (
                            <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 rounded-full font-bold">
                                {imagePlans.filter(p => p.status === 'done').length}/{imagePlans.length}
                            </span>
                        )}
                     </div>
                     
                     {imagePlans.length === 0 ? (
                        <button
                            onClick={handleAutoPlan}
                            disabled={isPlanning}
                            className="w-full py-2.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-all"
                        >
                            {isPlanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Map className="w-3.5 h-3.5" />}
                            Plan Images for Article
                        </button>
                     ) : (
                        <div className="flex gap-2">
                             <button
                                onClick={handleBatchProcess}
                                disabled={isBatchProcessing || imagePlans.every(p => p.status === 'done')}
                                className="flex-1 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm disabled:bg-gray-400 transition-all"
                            >
                                {isBatchProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                                {imagePlans.every(p => p.status === 'done') ? 'All Done' : 'Run Batch'}
                            </button>
                            <button 
                                onClick={handleAutoPlan}
                                className="px-3 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                title="Re-plan Images"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                        </div>
                     )}
                 </div>
                 
                 <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {/* Visual Style Info */}
                    {visualStyle && (
                        <div className="px-3 py-2 bg-indigo-50 border-b border-indigo-100">
                             <h5 className="text-[9px] font-bold text-indigo-400 uppercase mb-1 flex items-center gap-1">
                                <Palette className="w-2.5 h-2.5" /> Global Visual Identity
                             </h5>
                             <p className="text-[10px] text-indigo-800 leading-snug italic">
                                "{visualStyle}"
                             </p>
                        </div>
                    )}
                    
                    {/* Source Images Reference */}
                    {scrapedImages.length > 0 && (
                        <div className="px-3 py-2 bg-slate-50/80 border-b border-blue-100">
                             <h5 className="text-[9px] font-bold text-slate-400 uppercase mb-2 flex items-center justify-between">
                                <span className="flex items-center gap-1"><ExternalLink className="w-2.5 h-2.5" /> Source Context</span>
                                <span className="text-[8px] bg-slate-200 px-1.5 rounded text-slate-600 font-semibold">{scrapedImages.filter(i => i.aiDescription).length} Analyzed</span>
                             </h5>
                             <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                                 {scrapedImages.map((img, idx) => (
                                     <div key={idx} className="min-w-[48px] max-w-[48px] relative group cursor-help">
                                         <div className="h-8 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden shadow-sm">
                                             {img.url ? (
                                                 <img src={img.url} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" />
                                             ) : (
                                                 <span className="text-[9px] text-slate-400 font-mono">#{idx+1}</span>
                                             )}
                                         </div>
                                         <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full border border-white ${img.aiDescription ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                         
                                         {/* Tooltip */}
                                         <div className="absolute top-full left-0 mt-1 w-32 bg-gray-900 text-white text-[9px] p-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity">
                                             <div className="font-bold mb-0.5">Alt: {img.altText.substring(0, 15)}...</div>
                                             {img.aiDescription && <div className="text-green-300">AI: {img.aiDescription.substring(0, 20)}...</div>}
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    )}
                     
                    <div className="p-3 space-y-4">
                        {imagePlans.map((plan, idx) => {
                            const isDone = plan.status === 'done';
                            const isGenerating = plan.status === 'generating';
                            const isError = plan.status === 'error';
                            
                            return (
                                <div key={plan.id} className={`bg-white border rounded-xl p-3 shadow-sm space-y-3 transition-all ${isDone ? 'border-green-200 shadow-green-500/5' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'}`}>
                                    
                                    {/* Header */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                                            <ImageIcon className="w-3 h-3" /> Asset #{idx + 1}
                                        </span>
                                        <div className="flex gap-1">
                                            {isDone && <span className="text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 font-bold flex items-center gap-1"><CheckSquare className="w-2.5 h-2.5" /> Ready</span>}
                                            {isGenerating && <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1"><Loader2 className="w-2.5 h-2.5 animate-spin" /> Generating</span>}
                                            {isError && <span className="text-[9px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Error</span>}
                                        </div>
                                    </div>
                                    
                                    {/* Prompt Input */}
                                    <div className="space-y-1">
                                        <label className="text-[9px] text-gray-400 uppercase font-bold">Prompt (Editable)</label>
                                        <textarea 
                                            className="w-full text-[11px] p-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none resize-y min-h-[60px] leading-relaxed"
                                            value={plan.generatedPrompt}
                                            onChange={(e) => updatePlanPrompt(plan.id, e.target.value)}
                                            disabled={isGenerating}
                                        />
                                    </div>
                                    
                                    {/* Anchor Text */}
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex items-start gap-2">
                                        <Map className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[9px] text-gray-400 uppercase font-bold mb-0.5">Insert After:</p>
                                            <p className="text-[10px] text-gray-600 leading-tight line-clamp-2 italic truncate">
                                                "...{plan.insertAfter}..."
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 pt-1">
                                        {isDone ? (
                                            <>
                                                <button 
                                                    onClick={() => injectImageIntoEditor(plan)}
                                                    className="flex-1 py-1.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <ArrowRight className="w-3 h-3" /> Insert
                                                </button>
                                                <button 
                                                    onClick={() => generateSinglePlan(plan)}
                                                    className="px-2 py-1.5 bg-white border border-gray-200 text-gray-500 text-[10px] font-bold rounded hover:border-blue-300 hover:text-blue-600 transition-all"
                                                    title="Regenerate Image"
                                                >
                                                    <RefreshCw className="w-3 h-3" />
                                                </button>
                                            </>
                                        ) : (
                                            <button 
                                                onClick={() => generateSinglePlan(plan)}
                                                disabled={isGenerating}
                                                className="flex-1 py-1.5 bg-white border border-blue-200 text-blue-600 text-[10px] font-bold rounded hover:bg-blue-50 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                                            >
                                                <Wand2 className="w-3 h-3" /> Generate This
                                            </button>
                                        )}
                                    </div>

                                    {isDone && plan.url && (
                                        <div className="relative group rounded-lg overflow-hidden bg-gray-100 border border-gray-200 aspect-video">
                                            <img src={plan.url} alt="Generated result" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        
                        {imagePlans.length === 0 && !isPlanning && (
                            <div className="text-center p-8 space-y-3">
                                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                                    <Map className="w-6 h-6 text-blue-300" />
                                </div>
                                <p className="text-gray-400 text-xs italic leading-relaxed">
                                    Click "Plan Images" above to analyze your article structure and suggest optimal image locations.
                                </p>
                            </div>
                        )}
                    </div>
                 </div>
             </div>
          )}

      </div>

      {showImageModal && (
            <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-2xl w-[500px] max-w-[90%] p-6 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-blue-600">
                            <ImageIcon className="w-5 h-5" />
                            <h3 className="font-bold text-lg">Insert AI Image</h3>
                        </div>
                        <button onClick={() => setShowImageModal(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Image Prompt (Alt Text)</label>
                            <textarea
                                value={imagePrompt}
                                onChange={(e) => setImagePrompt(e.target.value)}
                                disabled={isImageLoading}
                                className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            />
                            <p className="text-xs text-gray-500">We extracted context from your cursor position to suggest this prompt.</p>
                        </div>
                        
                        <div className="flex justify-end gap-3">
                            <button 
                            onClick={() => setShowImageModal(false)}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg text-sm"
                            >
                            Cancel
                            </button>
                            <button
                            onClick={handleGenerateImage}
                            disabled={isImageLoading}
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2 disabled:opacity-70"
                            >
                            {isImageLoading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Generating (Nano Banana)...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generate & Insert
                                </>
                            )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
      )}
    </div>
  );
};