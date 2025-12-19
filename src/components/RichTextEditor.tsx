import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, FileText, Loader2, Type, Copy, X } from 'lucide-react';
import { TargetAudience, CostBreakdown, TokenUsage, ScrapedImage, ImageAssetPlan, ProductBrief } from '../types';
import { TiptapAdapter } from './TiptapAdapter';
import { EditorToolbar } from './editor/EditorToolbar';
import { KeyPointsPanel } from './editor/KeyPointsPanel';
import { MetaPanel } from './editor/MetaPanel';
import { VisualAssetPlanningModal } from './editor/VisualAssetPlanningModal';
import { QuickInsertPanel } from './editor/QuickInsertPanel';
import { AskAiSelection, AskAiSelectionHandle } from './AskAiSelection';
import { useImageEditor } from '../hooks/useImageEditor';
import { useMetaGenerator } from '../hooks/useMetaGenerator';
import { useOptionalEditorContext } from './editor/EditorContext';
import { useAskAi } from '../hooks/useAskAi';
import { useEditorAutosave } from '../hooks/useEditorAutosave';
import { smartInjectPoint } from '../services/generation/contentGenerationService';
import { useAnalysisStore } from '../store/useAnalysisStore';

type AskAiMode = 'edit' | 'format';

interface RichTextEditorProps {
    initialHtml: string;
    onChange?: (html: string) => void;
    keyPoints?: string[];
    brandExclusivePoints?: string[];
    checkedPoints?: string[];
    scrapedImages?: ScrapedImage[];
    visualStyle?: string;
    onTogglePoint?: (point: string) => void;
    targetAudience?: TargetAudience;
    onAddCost?: (cost: CostBreakdown, usage: TokenUsage) => void;
    productBrief?: ProductBrief | null;
    displayScale?: number;
    articleTitle?: string;
    onTitleChange?: (value: string) => void;
    outlineSections?: string[];
    onRemoveScrapedImage?: (img: ScrapedImage) => void;
    toolbarExtras?: React.ReactNode;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    initialHtml,
    onChange,
    keyPoints: keyPointsProp = [],
    brandExclusivePoints: brandPointsProp = [],
    checkedPoints: checkedPointsProp = [],
    scrapedImages: scrapedImagesProp = [],
    visualStyle = '',
    onTogglePoint,
    targetAudience = 'zh-TW',
    onAddCost,
    productBrief = null,
    displayScale,
    articleTitle,
    onTitleChange,
    outlineSections = [],
    onRemoveScrapedImage,
    toolbarExtras,
}) => {
    const ctx = useOptionalEditorContext();
    const [html, setHtml] = useState(initialHtml);
    const [selectionData, setSelectionData] = useState<{
        text: string;
        html: string;
        rect: DOMRect | null;
        range: { from: number; to: number } | null;
    }>({ text: '', html: '', rect: null, range: null });
    const [charCount, setCharCount] = useState(0);
    const [wordCount, setWordCount] = useState(0);
    const [showKeyPoints, setShowKeyPoints] = useState(false);
    const [showMetaPanel, setShowMetaPanel] = useState(false);
    const [isAiRunning, setIsAiRunning] = useState(false);
    const effectiveScale = displayScale ?? ctx?.displayScale ?? 1;

    const editorContainerRef = useRef<HTMLDivElement>(null);
    const hasRestoredDraftRef = useRef(false);
    const [showCleanupModal, setShowCleanupModal] = useState(false);
    const [cleanupSummary, setCleanupSummary] = useState({ boldMarks: 0, blockquotes: 0, quoteChars: 0 });
    const [cleanupBlocks, setCleanupBlocks] = useState<Array<{ from: number; to: number; text: string; boldMarks: number; blockquotes: number; quoteChars: number; type: string }>>([]);
    const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());
    const [refiningPoint, setRefiningPoint] = useState<string | null>(null);
    const [hasAutoCheckedPoints, setHasAutoCheckedPoints] = useState(false);
    const [tiptapApi, setTiptapApi] = useState<{
        getSelectedText: () => string;
        insertHtml: (html: string) => void;
        insertImage: (src: string, alt?: string) => void;
        getPlainText: () => string;
        getHtml: () => string;
        setHtml: (html: string) => void;
        toggleUnderline: () => void;
        toggleBold: () => void;
        toggleItalic: () => void;
        toggleHeading: (level: 1 | 2 | 3) => void;
        toggleBlockquote: () => void;
        toggleBulletList: () => void;
        toggleOrderedList: () => void;
        setTextAlign: (align: 'left' | 'center' | 'right' | 'justify') => void;
        setLink: (href: string) => void;
        unsetLink: () => void;
        undo: () => void;
        redo: () => void;
        clearBold: (options?: { removeBold?: boolean; removeBlockquotes?: boolean; removeQuotes?: boolean; target?: 'selection' | 'document'; scope?: { from: number; to: number } }) => boolean;
        summarizeFormatting: () => { boldMarks: number; blockquotes: number; quoteChars: number; blocks: Array<{ from: number; to: number; text: string; boldMarks: number; blockquotes: number; quoteChars: number; type: string }> };
        listCleanupTargets: () => Array<{ from: number; to: number; text: string; boldMarks: number; blockquotes: number; quoteChars: number; type: string }>;
        getSelectionRange: () => { from: number; to: number };
        replaceRange: (range: { from: number; to: number }, html: string) => void;
        markAskAiRange: (range: { from: number; to: number }, taskId: string) => void;
        clearAskAiMarks: (taskId?: string) => void;
        findAskAiRange: (taskId: string) => { from: number; to: number } | null;
        focus: () => void;
        editor?: any;
    } | null>(null);
    const askAiRef = useRef<AskAiSelectionHandle>(null);

    useEffect(() => {
        setHtml(initialHtml);
    }, [initialHtml]);

    const effectiveKeyPoints = keyPointsProp.length ? keyPointsProp : (ctx?.keyPoints || []);
    const effectiveBrandPoints = brandPointsProp.length ? brandPointsProp : (ctx?.brandExclusivePoints || []);
    const effectiveCheckedPoints = checkedPointsProp.length ? checkedPointsProp : (ctx?.checkedPoints || []);
    const effectiveScrapedImages = scrapedImagesProp.length ? scrapedImagesProp : (ctx?.scrapedImages || []);
    const effectiveTargetAudience = targetAudience || (ctx?.targetAudience as TargetAudience) || 'zh-TW';
    const effectiveVisualStyle = visualStyle || ctx?.visualStyle || '';
    const effectiveProductBrief = productBrief || ctx?.productBrief || null;
    const effectiveOutline = outlineSections.length ? outlineSections : (ctx?.outlineSections || []);
    const { recordHtml, recordMeta, consumeDraft } = useEditorAutosave({ storageKey: 'ai_writer_editor_autosave_v1' });
    const setCoveredPoints = useAnalysisStore(s => s.setCoveredPoints);

    const {
        metaTitle,
        metaDescription,
        urlSlug,
        setMetaTitle,
        setMetaDescription,
        setUrlSlug,
        isMetaLoading,
        generateMeta,
    } = useMetaGenerator({
        editorRef: editorContainerRef,
        tiptapApi,
        targetAudience: effectiveTargetAudience,
        context: {
            keyPoints: effectiveKeyPoints,
            brandExclusivePoints: effectiveBrandPoints,
            productBrief: effectiveProductBrief || undefined,
            visualStyle: effectiveVisualStyle,
            outlineSections: effectiveOutline,
        },
        onAddCost,
    });

    const updateCounts = useCallback((plainText: string) => {
        const cjkCount = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length;
        const nonCjkText = plainText.replace(/[\u4e00-\u9fa5]/g, ' ');
        const englishWords = nonCjkText.trim().split(/\s+/).filter(Boolean);
        setCharCount(plainText.length);
        setWordCount(cjkCount + englishWords.length);
    }, []);

    const handleInput = (nextHtml: string, plainText: string) => {
        setHtml(nextHtml);
        onChange?.(nextHtml);
        ctx?.setContent?.(nextHtml);
        updateCounts(plainText);
        recordHtml(nextHtml);
    };

    const refreshCleanupSummary = useCallback(() => {
        if (!tiptapApi) return;
        const summary = tiptapApi.summarizeFormatting
            ? tiptapApi.summarizeFormatting()
            : { boldMarks: 0, blockquotes: 0, quoteChars: 0, blocks: [] };
        setCleanupSummary(summary);
        const blocks = tiptapApi.listCleanupTargets ? tiptapApi.listCleanupTargets() : [];
        setCleanupBlocks(blocks);
        setSelectedBlocks(new Set(blocks.map((b, idx) => `${b.from}-${b.to}-${idx}`)));
    }, [tiptapApi]);

    const handleOpenCleanupModal = useCallback(() => {
        if (!tiptapApi) return;
        refreshCleanupSummary();
        setShowCleanupModal(true);
    }, [refreshCleanupSummary, tiptapApi]);

    const handleApplyCleanup = useCallback(() => {
        if (!tiptapApi) return;
        // Apply in reverse order to keep ranges stable.
        const blocksToClean = cleanupBlocks
            .map((b, idx) => ({ ...b, id: `${b.from}-${b.to}-${idx}` }))
            .filter(b => selectedBlocks.has(b.id))
            .sort((a, b) => b.from - a.from);

        if (blocksToClean.length === 0) {
            setShowCleanupModal(false);
            return;
        }

        blocksToClean.forEach(block => {
            tiptapApi.clearBold?.({
                removeBold: true,
                removeBlockquotes: true,
                removeQuotes: true,
                scope: { from: block.from, to: block.to },
            });
        });
        const plain = tiptapApi.getPlainText();
        const htmlValue = tiptapApi.getHtml();
        setHtml(htmlValue);
        onChange?.(htmlValue);
        ctx?.setContent?.(htmlValue);
        updateCounts(plain);
        recordHtml(htmlValue);
        setShowCleanupModal(false);
    }, [cleanupBlocks, ctx, onChange, recordHtml, selectedBlocks, tiptapApi, updateCounts]);

    const autoCheckKeyPoints = useCallback(() => {
        if (hasAutoCheckedPoints) return;
        if (!tiptapApi) return;

        const plain = (tiptapApi.getPlainText ? tiptapApi.getPlainText() : '') || '';
        if (!plain.trim()) return;

        const normalized = plain.toLowerCase();
        const candidates = [...effectiveBrandPoints, ...effectiveKeyPoints].filter(Boolean);
        const matched = candidates.filter(pt => normalized.includes(pt.toLowerCase()));
        if (matched.length === 0) return;

        setCoveredPoints(prev => {
            const next = new Set(prev);
            matched.forEach(m => next.add(m));
            return Array.from(next);
        });
        setHasAutoCheckedPoints(true);
    }, [effectiveBrandPoints, effectiveKeyPoints, hasAutoCheckedPoints, setCoveredPoints, tiptapApi]);

    const handleRefinePoint = useCallback(async (point: string) => {
        if (!tiptapApi) {
            alert('Editor not ready.');
            return;
        }
        setRefiningPoint(point);
        setIsAiRunning(true);
        try {
            const fullHtml = tiptapApi.getHtml();
            const res = await smartInjectPoint(fullHtml, point, effectiveTargetAudience as TargetAudience);
            const { originalSnippet, newSnippet } = res.data || {};

            if (originalSnippet && newSnippet) {
                let nextHtml = fullHtml;
                if (fullHtml.includes(originalSnippet)) {
                    nextHtml = fullHtml.replace(originalSnippet, newSnippet);
                } else {
                    const suggestionHtml = `
                        <div style="border-left: 4px solid #8b5cf6; padding-left: 12px; margin: 16px 0; background: #f5f3ff; padding: 12px; border-radius: 4px;">
                            <p style="font-size: 10px; color: #8b5cf6; font-weight: bold; margin: 0 0 4px 0;">✨ REFINED WITH: ${point}</p>
                            ${newSnippet}
                        </div>
                    `;
                    nextHtml = fullHtml + suggestionHtml;
                }
                tiptapApi.setHtml(nextHtml);
                const plain = tiptapApi.getPlainText();
                setHtml(nextHtml);
                onChange?.(nextHtml);
                ctx?.setContent?.(nextHtml);
                updateCounts(plain);
                recordHtml(nextHtml);
                if (onAddCost) onAddCost(res.cost, res.usage);
                (onTogglePoint || ctx?.onTogglePoint)?.(point);
            } else {
                alert('AI 無法找到適合的段落插入此重點。');
            }
        } catch (e) {
            console.error('Refine failed', e);
            alert('Refinement failed.');
        } finally {
            setRefiningPoint(null);
            setIsAiRunning(false);
        }
    }, [ctx, effectiveTargetAudience, onAddCost, onChange, onTogglePoint, recordHtml, tiptapApi, updateCounts]);

    const handleToolbarCommand = (command: string, value?: string) => {
        if (!tiptapApi) return;
        switch (command) {
            case 'bold': return tiptapApi.toggleBold();
            case 'italic': return tiptapApi.toggleItalic();
            case 'underline': return tiptapApi.toggleUnderline?.();
            case 'blockquote': return tiptapApi.toggleBlockquote();
            case 'insertUnorderedList': return tiptapApi.toggleBulletList();
            case 'insertOrderedList': return tiptapApi.toggleOrderedList();
            case 'alignLeft': return tiptapApi.setTextAlign?.('left');
            case 'alignCenter': return tiptapApi.setTextAlign?.('center');
            case 'alignRight': return tiptapApi.setTextAlign?.('right');
            case 'formatBlock':
                if (value === '<h2>') return tiptapApi.toggleHeading(2);
                if (value === '<h3>') return tiptapApi.toggleHeading(3);
                if (value === 'blockquote') return tiptapApi.toggleBlockquote();
                return tiptapApi.toggleHeading(1);
            case 'undo': return tiptapApi.undo();
            case 'redo': return tiptapApi.redo();
            case 'link': {
                const href = window.prompt('Enter URL');
                if (href) tiptapApi.setLink(href);
                return;
            }
            case 'unlink': return tiptapApi.unsetLink();
            default:
                return;
        }
    };

    const {
        isDownloadingImages,
        imagePlans,
        isPlanning,
        isBatchProcessing,
        openImageModal,
        downloadImages,
        updatePlanPrompt,
        deletePlan,
        injectImageIntoEditor,
        autoPlanImages,
        generateSinglePlan,
        handleBatchProcess,
        showBatchModal,
        setShowBatchModal,
        localModelAppearance: imageEditorModelAppearance,
        setLocalModelAppearance: setImageEditorModelAppearance,
        localDesignStyle,
        setLocalDesignStyle,
    } = useImageEditor({
        editorRef: editorContainerRef,
        tiptapApi,
        imageContainerRef: editorContainerRef,
        targetAudience: effectiveTargetAudience,
        visualStyle: effectiveVisualStyle,
        scrapedImages: effectiveScrapedImages,
        onAddCost,
        handleInput: () => {
            const plain = tiptapApi?.getPlainText ? tiptapApi.getPlainText() : editorContainerRef.current?.innerText || '';
            const htmlValue = tiptapApi?.getHtml ? tiptapApi.getHtml() : editorContainerRef.current?.innerHTML || '';
            onChange?.(htmlValue);
            ctx?.setContent?.(htmlValue);
            updateCounts(plain);
            recordHtml(htmlValue);
        },
        saveSelection: () => null,
        restoreSelection: () => { },
    });

    const { runAskAiAction, handleAskAiInsert, clearAskAiState, lockAskAiRange, highlightAskAiTarget } = useAskAi({
        tiptapApi,
        targetAudience: effectiveTargetAudience as TargetAudience,
        onAddCost,
        setIsAiLoading: setIsAiRunning,
        updateCountsFromText: (text) => updateCounts(text),
        onChange: (nextHtml) => {
            setHtml(nextHtml);
            onChange?.(nextHtml);
            ctx?.setContent?.(nextHtml);
            recordHtml(nextHtml);
        },
    });

    const uniqueCoveredCount = useMemo(() => {
        return Array.from(new Set(effectiveCheckedPoints)).length;
    }, [effectiveCheckedPoints]);
    const totalPoints = effectiveKeyPoints.length + effectiveBrandPoints.length;

    const autoCheckResetKey = useMemo(
        () => `${initialHtml}||${effectiveKeyPoints.join('||')}||${effectiveBrandPoints.join('||')}`,
        [initialHtml, effectiveBrandPoints, effectiveKeyPoints]
    );

    useEffect(() => {
        if (!tiptapApi || hasRestoredDraftRef.current) return;
        const draft = consumeDraft();
        if (draft && draft.html) {
            setHtml(draft.html);
            tiptapApi.setHtml(draft.html);
            updateCounts(tiptapApi.getPlainText());
            if (draft.metaTitle) setMetaTitle(draft.metaTitle);
            if (draft.metaDescription) setMetaDescription(draft.metaDescription);
            if (draft.urlSlug) setUrlSlug(draft.urlSlug);
            if (draft.articleTitle) {
                onTitleChange?.(draft.articleTitle);
                ctx?.setArticleTitle?.(draft.articleTitle);
            }
        }
        hasRestoredDraftRef.current = true;
    }, [consumeDraft, ctx, onTitleChange, tiptapApi, updateCounts, setMetaTitle, setMetaDescription, setUrlSlug]);

    useEffect(() => {
        recordMeta({
            metaTitle,
            metaDescription,
            urlSlug,
            articleTitle: articleTitle || ctx?.articleTitle || '',
        });
    }, [articleTitle, ctx?.articleTitle, metaDescription, metaTitle, recordMeta, urlSlug]);

    useEffect(() => {
        setHasAutoCheckedPoints(false);
    }, [autoCheckResetKey]);

    return (
        <div className="rte-container flex flex-col h-full w-full min-h-0 bg-white overflow-hidden relative">
            <div className="rte-header flex flex-col gap-3 px-4 py-3 border-b border-gray-200 bg-white">
                <div className="mb-1">
                    <input
                        value={articleTitle || ctx?.articleTitle || ''}
                        onChange={(e) => {
                            onTitleChange?.(e.target.value);
                            ctx?.setArticleTitle?.(e.target.value);
                        }}
                        className="w-full text-2xl font-bold text-gray-800 placeholder-gray-300 border-none focus:ring-0 focus:outline-none bg-transparent px-0 py-1"
                        placeholder="Article Title..."
                    />
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-[240px] flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5 border border-transparent focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <span className="text-gray-400 flex items-center gap-1 select-none">
                            <span className="text-xs">🔗</span>
                            <span className="text-xs font-medium">/</span>
                        </span>
                        <input
                            value={urlSlug}
                            onChange={(e) => setUrlSlug(e.target.value)}
                            className="flex-1 bg-transparent border-none focus:outline-none text-xs font-mono text-gray-600 placeholder-gray-400"
                            placeholder="url-slug-goes-here"
                        />
                    </div>
                    {toolbarExtras && (
                        <div className="flex items-center gap-2 ml-auto">
                            {toolbarExtras}
                        </div>
                    )}
                </div>
            </div>

            <div className="rte-toolbar-wrapper">
                <EditorToolbar
                    onCommand={handleToolbarCommand}
                    onRemoveBold={handleOpenCleanupModal}
                    onOpenBatchVisuals={() => setShowBatchModal(true)}
                    onDownloadAllImages={downloadImages}
                    isDownloadingImages={isDownloadingImages}
                    onToggleKeyPoints={() => {
                        if (!showKeyPoints) autoCheckKeyPoints();
                        setShowKeyPoints(!showKeyPoints);
                    }}
                    showKeyPoints={showKeyPoints}
                    hasKeyPoints={totalPoints > 0}
                    onRebrand={() => { }}
                    isRebranding={false}
                    productName={effectiveProductBrief?.productName}
                    onToggleMetaPanel={() => setShowMetaPanel((v) => !v)}
                    showMetaPanel={showMetaPanel}
                    onUndo={() => tiptapApi?.undo()}
                    onRedo={() => tiptapApi?.redo()}
                />
            </div>

            <div className="rte-workspace flex-1 flex flex-row min-h-0 overflow-hidden relative">
                <div className="rte-editor-column flex-1 flex flex-col min-h-0 relative group">
                    <div className="rte-scroll-area flex-1 min-h-0 overflow-y-auto">
                        <div
                            className="rte-content-wrapper px-6 pb-6 pt-8 min-h-full flex flex-col cursor-text"
                            onClick={(e) => {
                                if (tiptapApi) {
                                    tiptapApi.focus();
                                }
                            }}
                        >
                            <TiptapAdapter
                                initialHtml={html}
                                onChange={(nextHtml, plain) => handleInput(nextHtml, plain)}
                                onReady={(api) => {
                                    setTiptapApi(api);
                                    const plain = api.getPlainText ? api.getPlainText() : '';
                                    updateCounts(plain);
                                    recordHtml(api.getHtml());
                                }}
                                onSelectionChange={(data) => {
                                    setSelectionData({
                                        text: data.text,
                                        html: data.html,
                                        rect: data.rect,
                                        range: data.range
                                    });
                                }}
                                onAskAiClick={(taskId) => {
                                    askAiRef.current?.openTask(taskId);
                                }}
                                containerRef={editorContainerRef}
                                className="min-h-[420px]"
                                placeholder=""
                                contentClassName="prose-lg max-w-none px-0 pb-6 [&>*:first-child]:mt-0" contentStyle={useMemo(() => ({ fontSize: `${effectiveScale * 100}%`, lineHeight: '1.6' }), [effectiveScale])}
                            />
                        </div>
                    </div>

                    {/* Editor Overlays */}
                    <AskAiSelection
                        ref={askAiRef}
                        onRunAction={runAskAiAction}
                        onInsert={(html, taskId) => {
                            handleAskAiInsert(html, taskId);
                        }}
                        onLockSelectionRange={(taskId) => lockAskAiRange(taskId)}
                        onHighlightTask={(taskId) => {
                            // Ensure the saved task gets a persistent highlight in the editor.
                            highlightAskAiTarget(taskId);
                        }}
                        selectionText={selectionData.text}
                        selectionHtml={selectionData.html}
                        selectionRect={selectionData.rect}
                        selectionRange={selectionData.range}
                    />

                    {showCleanupModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
                            <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 p-5 space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-800">清理粗體與引號</h3>
                                        <p className="text-sm text-gray-500">勾選需要清理的段落，會移除粗體、引用區塊與引號。</p>
                                    </div>
                                    <button
                                        onClick={() => setShowCleanupModal(false)}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                        aria-label="Close cleanup modal"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    <div className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-md p-3 leading-relaxed">
                                        勾選要清理的段落即可，系統會同時清除粗體、引用區塊與引號字元。掃描結果：粗體 {cleanupSummary.boldMarks}、引用 {cleanupSummary.blockquotes}、引號 {cleanupSummary.quoteChars}。
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-xs font-semibold text-gray-700">選擇要清理的段落</div>
                                        <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1">
                                            {cleanupBlocks.map((block, idx) => {
                                                const id = `${block.from}-${block.to}-${idx}`;
                                                const checked = selectedBlocks.has(id);
                                                return (
                                                    <label key={id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            checked={checked}
                                                            onChange={(e) => {
                                                                setSelectedBlocks(prev => {
                                                                    const next = new Set(prev);
                                                                    if (e.target.checked) next.add(id); else next.delete(id);
                                                                    return next;
                                                                });
                                                            }}
                                                            className="mt-1 accent-blue-600"
                                                        />
                                                        <div className="flex-1 min-w-0 space-y-1">
                                                            <div className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                                                <span className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                                                    {block.type}
                                                                </span>
                                                                <span className="text-xs text-gray-500">
                                                                    粗體 {block.boldMarks} · 引用 {block.blockquotes} · 引號 {block.quoteChars}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-700 whitespace-pre-wrap break-words leading-relaxed">{block.text || '（空白段落）'}</div>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                            {cleanupBlocks.length === 0 && (
                                                <div className="text-xs text-gray-400 p-2 bg-gray-50 border border-dashed border-gray-200 rounded">
                                                    沒有找到包含粗體或引號的段落。
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-gray-500">
                                    <button
                                        type="button"
                                        onClick={refreshCleanupSummary}
                                        className="text-blue-600 hover:text-blue-700 font-semibold"
                                    >
                                        重新掃描
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowCleanupModal(false)}
                                            className="px-3 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            取消
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleApplyCleanup}
                                            className="px-3 py-2 rounded-md text-white font-semibold transition-colors bg-blue-600 hover:bg-blue-700"
                                        >
                                            套用清理
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {showMetaPanel && (
                        <MetaPanel
                            metaTitle={metaTitle}
                            metaDescription={metaDescription}
                            urlSlug={urlSlug}
                            isMetaLoading={isMetaLoading}
                            onGenerateMeta={generateMeta}
                            onClose={() => setShowMetaPanel(false)}
                            onMetaTitleChange={setMetaTitle}
                            onMetaDescriptionChange={setMetaDescription}
                            onUrlSlugChange={setUrlSlug}
                        />
                    )}

                    <VisualAssetPlanningModal
                        open={showBatchModal}
                        onClose={() => setShowBatchModal(false)}
                        imagePlans={imagePlans}
                        isPlanning={isPlanning}
                        isBatchProcessing={isBatchProcessing}
                        onAutoPlan={autoPlanImages}
                        onBatchProcess={handleBatchProcess}
                        onGenerateSingle={generateSinglePlan}
                        onUpdatePlan={updatePlanPrompt}
                        onDeletePlan={deletePlan}
                        onInject={injectImageIntoEditor}
                        modelAppearance={imageEditorModelAppearance}
                        setModelAppearance={setImageEditorModelAppearance}
                        designStyle={localDesignStyle}
                        setDesignStyle={setLocalDesignStyle}
                    />
                </div>

                {/* Sidebars */}
                {showKeyPoints && (
                    <KeyPointsPanel
                        brandExclusivePoints={effectiveBrandPoints}
                        keyPoints={effectiveKeyPoints}
                        checkedPoints={effectiveCheckedPoints}
                        refiningPoint={refiningPoint}
                        onTogglePoint={onTogglePoint || ctx?.onTogglePoint}
                        onRefinePoint={handleRefinePoint}
                        useTiptap
                        isTiptapReady={Boolean(tiptapApi)}
                        uniqueCoveredCount={uniqueCoveredCount}
                        totalPoints={totalPoints}
                        targetAudience={effectiveTargetAudience}
                    />
                )}

                <QuickInsertPanel
                    imagePlans={imagePlans}
                    onInject={injectImageIntoEditor}
                    onOpenPlanning={() => setShowBatchModal(true)}
                />
            </div>

            {isAiRunning && (
                <div className="pointer-events-none fixed bottom-4 right-4 z-40">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/90 border border-gray-200 rounded-lg shadow-sm text-sm text-gray-700">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>AI is working...</span>
                    </div>
                </div>
            )}

            <div className="rte-footer px-4 py-2 bg-gray-50/95 backdrop-blur border-t border-gray-200 text-[10px] text-gray-500 font-mono flex items-center justify-end gap-4 select-none sticky bottom-0 z-10">
                <span>{wordCount} words</span>
                <span>{charCount} chars</span>
            </div>
        </div>
    );
};
