
import React, { useEffect, useRef, useState } from 'react';
import { 
  Bold, Italic, Underline, Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Link as LinkIcon, Undo, Redo, 
  AlignLeft, AlignCenter, AlignRight, Type, Sparkles, X, ArrowRight, Image as ImageIcon, ListTodo, CheckSquare, Square,
  GalleryHorizontalEnd, Loader2, Plus, RefreshCw, Map, PlayCircle, Wand2, Eraser, FileCode, ExternalLink, Palette, MousePointerClick, Gem, Eye, Download
} from 'lucide-react';
import { marked } from 'marked';
import { generateSnippet, smartInjectPoint, rebrandContent } from '../services/geminiService';
import { generateImagePromptFromContext, generateImage, planImagesForArticle } from '../services/imageService';
import { TargetAudience, CostBreakdown, TokenUsage, ScrapedImage, ImageAssetPlan, ProductBrief } from '../types';

// Reusable Checklist Item Component (Extracted for Performance)
const ChecklistItem: React.FC<{ 
    point: string; 
    type: 'general' | 'brand'; 
    isChecked: boolean; 
    isProcessing: boolean;
    onToggle: (point: string) => void;
    onRefine: (point: string) => void; 
}> = React.memo(({ point, type, isChecked, isProcessing, onToggle, onRefine }) => {
    return (
        <div className={`p-2 rounded-lg text-xs transition-all border group relative ${isChecked ? 'bg-orange-100/50 border-orange-200 text-gray-500' : 'bg-white border-orange-100 text-gray-800 hover:border-orange-300 hover:shadow-sm'}`}>
            <div className="flex items-start gap-2 pr-6 cursor-pointer" onClick={() => onToggle(point)}>
                {isChecked ? <CheckSquare className="w-4 h-4 text-orange-500 flex-shrink-0" /> : <Square className="w-4 h-4 text-orange-300 flex-shrink-0" />}
                <div className="flex-1">
                    {type === 'brand' && <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1 rounded mr-1">USP</span>}
                    <span className={isChecked ? 'line-through opacity-75' : ''}>{point}</span>
                </div>
            </div>
            
            {!isChecked && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onRefine(point); }}
                    disabled={isProcessing}
                    className="absolute right-1 top-1 p-1.5 bg-white border border-purple-200 text-purple-600 rounded-md hover:bg-purple-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Auto-insert this point into best paragraph"
                >
                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                </button>
            )}
        </div>
    );
});

interface RichTextEditorProps {
  initialHtml: string;
  onChange?: (html: string) => void;
  keyPoints?: string[];
  brandExclusivePoints?: string[]; // NEW
  checkedPoints?: string[];
  scrapedImages?: ScrapedImage[];
  visualStyle?: string; 
  onTogglePoint?: (point: string) => void;
  targetAudience?: TargetAudience;
  onAddCost?: (cost: CostBreakdown, usage: TokenUsage) => void;
  productBrief?: ProductBrief; // NEW
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
    initialHtml, 
    onChange,
    keyPoints = [],
    brandExclusivePoints = [],
    checkedPoints = [],
    scrapedImages = [],
    visualStyle = '',
    onTogglePoint,
    targetAudience = 'zh-TW',
    onAddCost,
    productBrief
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedContext, setSelectedContext] = useState(''); 
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isFormatMode, setIsFormatMode] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  const [showImageModal, setShowImageModal] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isDownloadingImages, setIsDownloadingImages] = useState(false);

  const [showKeyPoints, setShowKeyPoints] = useState(false);
  const [showVisualAssets, setShowVisualAssets] = useState(false);
  
  // Refine & Rebrand States
  const [refiningPoint, setRefiningPoint] = useState<string | null>(null);
  const [isRebranding, setIsRebranding] = useState(false);

  // Stats
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  
  // Auto-Plan State
  const [imagePlans, setImagePlans] = useState<ImageAssetPlan[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  useEffect(() => {
    if (editorRef.current && initialHtml) {
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
          const cjkCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
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
      let html = editorRef.current.innerHTML;
      html = html.replace(/<\/?strong[^>]*>/gi, "");
      html = html.replace(/<\/?b[^>]*>/gi, "");
      html = html.replace(/<span style="font-weight: ?bold;?">/gi, "<span>");
      html = html.replace(/\*\*/g, "");
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

  const handleDownloadImages = async () => {
    if (!editorRef.current) return;
    const images = editorRef.current.querySelectorAll('img');
    if (images.length === 0) {
        alert("No images found in the editor to download.");
        return;
    }

    if (!confirm(`Found ${images.length} images in the article. Download them now?`)) return;

    setIsDownloadingImages(true);

    const downloadLink = document.createElement('a');
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);

    try {
        for (let i = 0; i < images.length; i++) {
            const img = images[i] as HTMLImageElement;
            const src = img.src;
            const ext = src.includes('image/jpeg') ? 'jpg' : 'png';
            const filename = `article-image-${Date.now()}-${i + 1}.${ext}`;

            if (src.startsWith('data:')) {
                // Base64 Image (AI Generated)
                downloadLink.href = src;
                downloadLink.download = filename;
                downloadLink.click();
            } else {
                // Remote URL (Scraped)
                try {
                    const response = await fetch(src);
                    const blob = await response.blob();
                    const url = URL.createObjectURL(blob);
                    downloadLink.href = url;
                    downloadLink.download = filename;
                    downloadLink.click();
                    URL.revokeObjectURL(url);
                } catch (e) {
                    console.warn(`Failed to download ${src}, opening in new tab instead.`);
                    window.open(src, '_blank');
                }
            }
            // Small delay to prevent browser throttling downloads
            await new Promise(r => setTimeout(r, 200));
        }
    } catch (e) {
        console.error("Download failed", e);
        alert("Some images could not be downloaded.");
    } finally {
        document.body.removeChild(downloadLink);
        setIsDownloadingImages(false);
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
            TASK: Reformat the TARGET CONTENT exactly according to the instruction. Return ONLY the formatted result in Markdown/HTML.
            `;
        } else if (selectedContext && selectedContext.trim().length > 0) {
             promptToSend = `TARGET TEXT TO MODIFY: """${selectedContext}"""\n\nINSTRUCTION: ${aiPrompt}\n\nTASK: Rewrite or replace the target text based on the instruction. Return ONLY the result in Markdown/HTML.`;
        }

        const res = await generateSnippet(promptToSend, targetAudience as TargetAudience);
        const htmlSnippet = marked.parse(res.data, { async: false }) as string;
        restoreSelection();
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

  // --- UPDATED: Smart Refine Logic (Block Level) ---
  const handleRefinePoint = async (point: string) => {
      if (!editorRef.current) return;
      setRefiningPoint(point);
      
      try {
          const fullHtml = editorRef.current.innerHTML;
          
          // New Service Logic returns HTML Snippets (Old and New)
          const res = await smartInjectPoint(fullHtml, point, targetAudience as TargetAudience);
          
          if (res.data && res.data.originalSnippet && res.data.newSnippet) {
              const { originalSnippet, newSnippet } = res.data;
              
              // Precise Replacement Logic
              if (editorRef.current.innerHTML.includes(originalSnippet)) {
                  editorRef.current.innerHTML = editorRef.current.innerHTML.replace(originalSnippet, newSnippet);
              } else {
                  // Fallback if precise match fails (due to browser normalization of HTML)
                  // Append as a suggestion block
                  const suggestionHtml = `
                    <div style="border-left: 4px solid #8b5cf6; padding-left: 12px; margin: 16px 0; background: #f5f3ff; padding: 12px; border-radius: 4px;">
                        <p style="font-size: 10px; color: #8b5cf6; font-weight: bold; margin: 0 0 4px 0;">✨ REFINED WITH: ${point}</p>
                        ${newSnippet}
                    </div>
                   `;
                   editorRef.current.innerHTML += suggestionHtml;
              }
              
              onTogglePoint?.(point);
              if (onAddCost) onAddCost(res.cost, res.usage);
          } else {
              alert("AI couldn't identify a suitable paragraph to refine.");
          }
      } catch (e) {
          console.error("Refine failed", e);
          alert("Refinement failed.");
      } finally {
          setRefiningPoint(null);
          if (editorRef.current) handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
      }
  };

  // --- NEW: Rebrand Logic ---
  const handleRebrand = async () => {
      if (!productBrief || !productBrief.productName) {
          alert("No Product Profile active. Please select a profile in the sidebar first.");
          return;
      }
      if (!editorRef.current) return;
      if (!confirm(`Rewrite the article to feature "${productBrief.productName}"? This will replace generic terms with your brand.`)) return;

      setIsRebranding(true);
      try {
          // We process the *Markdown* version to save tokens and ensure clean structure
          const currentMarkdown = editorRef.current.innerText; // or simpler htmlToMarkdown
          
          const res = await rebrandContent(currentMarkdown, productBrief, targetAudience as TargetAudience);
          
          if (res.data) {
              const newHtml = marked.parse(res.data, { async: false }) as string;
              editorRef.current.innerHTML = newHtml;
              handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
              if (onAddCost) onAddCost(res.cost, res.usage);
          }
      } catch (e) {
          console.error("Rebrand failed", e);
          alert("Rebrand failed.");
      } finally {
          setIsRebranding(false);
      }
  };

  const handleAutoPlan = async () => {
      if (isPlanning || !editorRef.current) return;
      setIsPlanning(true);
      try {
          const content = editorRef.current.innerText;
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

  // --- FIXED: Block-Level Image Injection ---
  const injectImageIntoEditor = (plan: ImageAssetPlan, method: 'auto' | 'cursor' = 'auto') => {
      if (!editorRef.current || !plan.url) return;
      
      const imgHtml = `<img src="${plan.url}" alt="${plan.generatedPrompt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 24px 0; display: block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />`;

      if (method === 'cursor') {
          restoreSelection(); 
          document.execCommand('insertHTML', false, `${imgHtml}<br/>`);
          handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
          return;
      }

      const anchorText = plan.insertAfter.trim();
      const currentHtml = editorRef.current.innerHTML;
      if (currentHtml.includes(plan.url)) return;

      // Attempt to find the PARAGRAPH containing the anchor text
      // Regex looks for <p ...> ... anchor ... </p>
      // We escape the anchor text for regex safety
      const escapedAnchor = anchorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Match: <p (anything except >) > (anything) anchor (anything) </p>
      const paragraphRegex = new RegExp(`(<p[^>]*>)(?:(?!</p>).)*?${escapedAnchor}(?:(?!</p>).)*?</p>`, 'i');
      
      const match = currentHtml.match(paragraphRegex);

      if (match) {
          // Replace the entire paragraph match with: Paragraph + Image
          const matchedParagraph = match[0];
          const replacement = `${matchedParagraph}\n${imgHtml}`;
          editorRef.current.innerHTML = currentHtml.replace(matchedParagraph, replacement);
          handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
          return;
      }

      // Fallback 1: If paragraph regex fails (e.g. plain text or complex nesting), simple anchor append
      if (currentHtml.includes(anchorText)) {
          const newHtml = currentHtml.replace(anchorText, `${anchorText}<br/>${imgHtml}`);
          editorRef.current.innerHTML = newHtml;
          handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
          return;
      }
      
      // Fallback 2: Search for substring chunks
      const chunks = anchorText.split(/[，,。.\n\t\s、：:]+/).filter(c => c.length >= 4); 
      chunks.sort((a, b) => b.length - a.length);
      for (const chunk of chunks) {
          if (currentHtml.includes(chunk)) {
               const newHtml = currentHtml.replace(chunk, `${chunk}<br/>${imgHtml}`);
               editorRef.current.innerHTML = newHtml;
               handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
               return;
          }
      }

      alert(`Could not find anchor: "...${anchorText.substring(0, 15)}...". \n\nPlease place your cursor in the text and click the "Cursor" button to insert manually.`);
  };

  const updatePlanPrompt = (id: string, newPrompt: string) => {
      setImagePlans(prev => prev.map(p => p.id === id ? { ...p, generatedPrompt: newPrompt } : p));
  };

  const generateSinglePlan = async (plan: ImageAssetPlan): Promise<void> => {
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
      const promises = plansToProcess.map(plan => generateSinglePlan(plan));
      await Promise.all(promises);
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

  // Calculate unique covered count
  const uniqueCoveredCount = new Set(checkedPoints).size;
  const totalPoints = keyPoints.length + brandExclusivePoints.length;

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
          <ToolbarButton icon={Eraser} onClick={handleRemoveBold} label="Remove All Bold Formatting & Quotes" />
        </div>

        <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
          <ToolbarButton icon={List} command="insertUnorderedList" label="Bullet List" />
          <ToolbarButton icon={ListOrdered} command="insertOrderedList" label="Numbered List" />
          <ToolbarButton icon={Quote} command="formatBlock" value="<blockquote>" label="Quote" />
        </div>

        <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
            <ToolbarButton icon={ImageIcon} onClick={handleOpenImageModal} label="Insert AI Image" />
            <ToolbarButton 
              icon={isDownloadingImages ? Loader2 : Download} 
              onClick={handleDownloadImages} 
              label="Download all images in editor" 
            />
        </div>

         <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
            <button type="button" onClick={() => execCommand('undo')} className="p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded transition-colors"><Undo className="w-4 h-4" /></button>
            <button type="button" onClick={() => execCommand('redo')} className="p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded transition-colors"><Redo className="w-4 h-4" /></button>
        </div>
        
        <div className="flex items-center space-x-1 px-2 border-r border-gray-300">
            {(keyPoints.length > 0 || brandExclusivePoints.length > 0) && (
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

        <div className="flex items-center space-x-1 px-2">
            <button
                onClick={handleRebrand}
                disabled={isRebranding || !productBrief?.productName}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    isRebranding ? 'bg-purple-50 text-purple-400 cursor-not-allowed' : 'bg-white border border-purple-200 text-purple-600 hover:bg-purple-50 shadow-sm'
                }`}
                title={productBrief?.productName ? `Inject brand: ${productBrief.productName}` : "No Product Profile Active"}
            >
                {isRebranding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gem className="w-3.5 h-3.5" />}
                <span>Rebrand</span>
            </button>
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

      <div className="flex-1 flex overflow-hidden relative w-full h-full min-h-0">
          <div className="flex-1 overflow-hidden bg-white relative group min-h-0 flex flex-col">
            <div
              ref={editorRef}
              contentEditable
              className="editor-content prose prose-lg max-w-none p-8 md:p-12 focus:outline-none flex-1 overflow-y-auto custom-scrollbar pb-20 min-h-0"
              onInput={handleInput}
              spellCheck={false}
              onMouseUp={saveSelection}
              onKeyUp={saveSelection}
            />
            
            <div className="px-4 py-2 bg-gray-50/95 backdrop-blur border-t border-gray-200 text-[10px] text-gray-500 font-mono flex items-center justify-end gap-4 select-none sticky bottom-0 z-10">
                <span>{wordCount} words</span>
                <span>{charCount} chars</span>
            </div>

            {showAiModal && (
                <div 
                    className="absolute z-50 bg-white rounded-lg shadow-2xl border border-gray-200 w-96 p-4 animate-in fade-in zoom-in-95 duration-200"
                    style={{ top: 10, right: 10 }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 text-purple-600">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wide">
                                {isFormatMode ? 'AI Formatter' : 'Ask AI Writer'}
                            </span>
                        </div>
                        <button onClick={closeAiModal} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mb-3 p-2 bg-gray-50 rounded text-xs text-gray-600 italic border border-gray-100 max-h-24 overflow-y-auto">
                        {selectedContext ? `Context: "...${selectedContext.substring(0, 100)}..."` : "No text selected. AI will write new content."}
                    </div>
                    
                    <form onSubmit={handleAiSubmit} className="space-y-2">
                        <div className="flex gap-2 mb-2">
                            <button 
                                type="button" 
                                onClick={() => setIsFormatMode(false)}
                                className={`flex-1 text-[10px] font-bold py-1 rounded border ${!isFormatMode ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-gray-500 border-gray-200'}`}
                            >
                                Generate / Edit
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setIsFormatMode(true)}
                                className={`flex-1 text-[10px] font-bold py-1 rounded border ${isFormatMode ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-white text-gray-500 border-gray-200'}`}
                            >
                                Format Only
                            </button>
                        </div>
                        <textarea
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="w-full h-24 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none"
                            placeholder={isFormatMode ? "e.g. Convert to bullet list, Make it bold..." : "e.g. Rewrite to be more professional, Expand this point..."}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={isAiLoading || !aiPrompt}
                            className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Run AI
                        </button>
                    </form>
                </div>
            )}
            
            {showImageModal && (
                <div 
                    className="absolute z-50 bg-white rounded-lg shadow-2xl border border-gray-200 w-96 p-4 animate-in fade-in zoom-in-95 duration-200"
                    style={{ top: 50, right: 10 }}
                >
                     <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2 text-pink-600">
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wide">
                                AI Image Generator (Nano Banana)
                            </span>
                        </div>
                        <button onClick={() => setShowImageModal(false)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    
                    <form onSubmit={handleGenerateImage} className="space-y-3">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Image Prompt</label>
                            <textarea
                                value={imagePrompt}
                                onChange={(e) => setImagePrompt(e.target.value)}
                                className="w-full h-24 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none resize-none mt-1"
                                placeholder="Describe the image..."
                            />
                        </div>
                        
                        <button
                            type="submit"
                            disabled={isImageLoading || !imagePrompt}
                            className="w-full py-2 bg-pink-600 text-white rounded-lg text-sm font-semibold hover:bg-pink-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isImageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                            Generate Image
                        </button>
                    </form>
                </div>
            )}
          </div>
          
          {/* SIDE PANELS */}
          {showKeyPoints && (
              <div className="w-72 bg-orange-50/50 border-l border-orange-100 p-4 overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-bold uppercase text-orange-600 flex items-center gap-2">
                          <ListTodo className="w-4 h-4" />
                          Key Points
                      </h4>
                      <span className="text-[10px] font-bold text-gray-400">
                          {uniqueCoveredCount}/{totalPoints}
                      </span>
                  </div>
                  
                  <div className="space-y-4">
                      {brandExclusivePoints.length > 0 && (
                          <div className="space-y-2">
                              <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                                  <Gem className="w-3 h-3" /> Brand USP
                              </h5>
                              <div className="space-y-1">
                                  {brandExclusivePoints.map((point, i) => (
                                      <ChecklistItem 
                                        key={`brand-${i}`} 
                                        point={point} 
                                        type="brand" 
                                        isChecked={checkedPoints.includes(point)}
                                        isProcessing={refiningPoint === point}
                                        onToggle={onTogglePoint || (() => {})}
                                        onRefine={handleRefinePoint}
                                      />
                                  ))}
                              </div>
                          </div>
                      )}
                      
                      {keyPoints.length > 0 && (
                          <div className="space-y-2">
                              <h5 className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">General Knowledge</h5>
                              <div className="space-y-1">
                                  {keyPoints.map((point, i) => (
                                      <ChecklistItem 
                                        key={`gen-${i}`} 
                                        point={point} 
                                        type="general" 
                                        isChecked={checkedPoints.includes(point)}
                                        isProcessing={refiningPoint === point}
                                        onToggle={onTogglePoint || (() => {})}
                                        onRefine={handleRefinePoint}
                                      />
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {showVisualAssets && (
              <div className="w-80 bg-blue-50/50 border-l border-blue-100 p-4 overflow-y-auto custom-scrollbar animate-in slide-in-from-right duration-200 flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-bold uppercase text-blue-600 flex items-center gap-2">
                          <GalleryHorizontalEnd className="w-4 h-4" />
                          Visual Assets
                      </h4>
                      <button 
                          onClick={handleAutoPlan}
                          disabled={isPlanning}
                          className="text-[10px] bg-white border border-blue-200 text-blue-600 px-2 py-1 rounded hover:bg-blue-50 transition-colors flex items-center gap-1"
                      >
                          {isPlanning ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          Auto-Plan
                      </button>
                  </div>

                  {scrapedImages.length > 0 && (
                      <div className="mb-4 bg-white p-2 rounded-lg border border-gray-200">
                          <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-2">Source References</h5>
                          <div className="grid grid-cols-4 gap-2">
                              {scrapedImages.map((img, idx) => (
                                  <div key={idx} className="relative aspect-square bg-gray-100 rounded overflow-hidden group cursor-help" title={img.altText}>
                                      <img src={img.url} className="w-full h-full object-cover" />
                                      {img.aiDescription && <div className="absolute top-0 right-0 w-2 h-2 bg-green-500 rounded-full m-1 border border-white"></div>}
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
                  
                  {imagePlans.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center space-y-2 opacity-60">
                          <ImageIcon className="w-8 h-8" />
                          <p className="text-xs">No visual assets planned.</p>
                          <p className="text-[10px]">Click "Auto-Plan" to generate ideas based on your content.</p>
                      </div>
                  ) : (
                      <div className="space-y-3 pb-20">
                           <div className="flex justify-between items-center bg-blue-100/50 p-2 rounded-md">
                               <span className="text-[10px] font-bold text-blue-700">{imagePlans.filter(p => p.status === 'done').length}/{imagePlans.length} Ready</span>
                               <button 
                                  onClick={handleBatchProcess}
                                  disabled={isBatchProcessing}
                                  className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 flex items-center gap-1 disabled:opacity-50"
                               >
                                  {isBatchProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                                  Generate All
                               </button>
                           </div>

                           {imagePlans.map((plan) => (
                               <div key={plan.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm space-y-2 group">
                                   <div className="flex justify-between items-start gap-2">
                                       <div className="flex-1">
                                           <span className="text-[9px] font-bold text-gray-400 uppercase">Prompt</span>
                                           <p 
                                              className="text-[10px] text-gray-600 leading-snug line-clamp-3 hover:line-clamp-none cursor-text focus:outline-none focus:bg-gray-50 rounded"
                                              contentEditable
                                              onBlur={(e) => updatePlanPrompt(plan.id, e.currentTarget.innerText)}
                                              dangerouslySetInnerHTML={{ __html: plan.generatedPrompt }}
                                           />
                                       </div>
                                       <div className="flex flex-col gap-1">
                                            {plan.status === 'done' ? (
                                                <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden border border-gray-200 relative group/img">
                                                    <img src={plan.url} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                                        <Eye className="w-4 h-4 text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => generateSinglePlan(plan)}
                                                    disabled={plan.status === 'generating'}
                                                    className="p-1.5 bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded border border-gray-200 transition-colors"
                                                    title="Generate this image"
                                                >
                                                    {plan.status === 'generating' ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" /> : <RefreshCw className="w-4 h-4" />}
                                                </button>
                                            )}
                                       </div>
                                   </div>

                                   <div className="bg-gray-50 p-1.5 rounded text-[10px] text-gray-500 flex items-center gap-1.5">
                                       <Map className="w-3 h-3 text-gray-400" />
                                       <span className="truncate flex-1" title={plan.insertAfter}>
                                           After: "{plan.insertAfter.substring(0, 25)}..."
                                       </span>
                                   </div>

                                   {plan.status === 'done' && (
                                       <div className="flex gap-1 pt-1">
                                            <button 
                                                onClick={() => injectImageIntoEditor(plan, 'auto')}
                                                className="flex-1 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded text-[10px] font-bold hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <ArrowRight className="w-3 h-3" /> Insert Auto
                                            </button>
                                            <button 
                                                onClick={() => injectImageIntoEditor(plan, 'cursor')}
                                                className="flex-1 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                                                title="Insert at current cursor position"
                                            >
                                                <MousePointerClick className="w-3 h-3" /> Cursor
                                            </button>
                                       </div>
                                   )}
                               </div>
                           ))}
                      </div>
                  )}
              </div>
          )}
      </div>
    </div>
  );
};
