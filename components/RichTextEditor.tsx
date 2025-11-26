import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, FileText, Loader2, Type, Copy } from 'lucide-react';
import { TargetAudience, CostBreakdown, TokenUsage, ScrapedImage, ImageAssetPlan, ProductBrief } from '../types';
import { TiptapAdapter } from './TiptapAdapter';
import { EditorToolbar } from './editor/EditorToolbar';
import { KeyPointsPanel } from './editor/KeyPointsPanel';
import { VisualAssetsPanel } from './editor/VisualAssetsPanel';
import { MetaPanel } from './editor/MetaPanel';
import { ImageGeneratorModal } from './editor/ImageGeneratorModal';
import { AskAiSelection } from './AskAiSelection';
import { useImageEditor } from '../hooks/useImageEditor';
import { useMetaGenerator } from '../hooks/useMetaGenerator';
import { useOptionalEditorContext } from './editor/EditorContext';
import { useAskAi } from '../hooks/useAskAi';
import { useEditorAutosave } from '../hooks/useEditorAutosave';

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
}) => {
    const ctx = useOptionalEditorContext();
    const [html, setHtml] = useState(initialHtml);
    const [charCount, setCharCount] = useState(0);
    const [wordCount, setWordCount] = useState(0);
    const [showKeyPoints, setShowKeyPoints] = useState(false);
    const [showVisualAssets, setShowVisualAssets] = useState(false);
    const [showMetaPanel, setShowMetaPanel] = useState(false);
    const [isAiRunning, setIsAiRunning] = useState(false);
    const effectiveScale = displayScale ?? ctx?.displayScale ?? 1;

    const editorContainerRef = useRef<HTMLDivElement>(null);
    const hasRestoredDraftRef = useRef(false);
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
        clearBold: () => void;
        getSelectionRange: () => { from: number; to: number };
        replaceRange: (range: { from: number; to: number }, html: string) => void;
        highlightRange: (range: { from: number; to: number }) => void;
        clearHighlight: () => void;
    } | null>(null);

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
        showImageModal,
        setShowImageModal,
        imagePrompt,
        setImagePrompt,
        isImageLoading,
        isDownloadingImages,
        imagePlans,
        isPlanning,
        isBatchProcessing,
        openImageModal,
        generateImageFromPrompt,
        downloadImages,
        autoPlanImages,
        updatePlanPrompt,
        injectImageIntoEditor,
        generateSinglePlan,
        handleBatchProcess,
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

    const { runAskAiAction, handleAskAiInsert, clearAskAiState } = useAskAi({
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

    return (
        <div
            className="flex flex-col h-full w-full min-h-0 bg-white overflow-hidden relative"
        >
            <div className="flex flex-col gap-3 px-4 py-3 border-b border-gray-200 bg-white">
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
                <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full px-4 py-1.5 border border-transparent focus-within:border-blue-300 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
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
                </div>
            </div>

            <EditorToolbar
                onCommand={handleToolbarCommand}
                onRemoveBold={() => tiptapApi?.clearBold?.()}
                onOpenImageModal={openImageModal}
                onDownloadAllImages={downloadImages}
                isDownloadingImages={isDownloadingImages}
                onToggleKeyPoints={() => { setShowKeyPoints(!showKeyPoints); setShowVisualAssets(false); }}
                showKeyPoints={showKeyPoints}
                hasKeyPoints={totalPoints > 0}
                onToggleVisualAssets={() => { setShowVisualAssets(!showVisualAssets); setShowKeyPoints(false); }}
                showVisualAssets={showVisualAssets}
                onRebrand={() => { }}
                isRebranding={false}
                productName={effectiveProductBrief?.productName}
                onToggleMetaPanel={() => setShowMetaPanel((v) => !v)}
                showMetaPanel={showMetaPanel}
                onUndo={() => tiptapApi?.undo()}
                onRedo={() => tiptapApi?.redo()}
            />


            <div className="flex-1 flex flex-row min-h-0 overflow-hidden relative">
                <div className="flex-1 flex flex-col min-h-0 relative group">
                    <div className="flex-1 min-h-0 overflow-y-auto">
                        <div className="px-6 pb-6 py-1">
                            <TiptapAdapter
                                initialHtml={html}
                                onChange={(nextHtml, plain) => handleInput(nextHtml, plain)}
                                onReady={(api) => {
                                    setTiptapApi(api);
                                    const plain = api.getPlainText ? api.getPlainText() : '';
                                    updateCounts(plain);
                                    recordHtml(api.getHtml());
                                }}
                                containerRef={editorContainerRef}
                                className="min-h-[420px]"
                                placeholder=""
                                contentClassName="prose-lg max-w-none px-0 pb-6 [&>*:first-child]:mt-0" contentStyle={useMemo(() => ({ fontSize: `${effectiveScale * 100}%`, lineHeight: '1.6' }), [effectiveScale])}
                            />
                        </div>
                    </div>

                    <AskAiSelection
                        onRunAction={runAskAiAction}
                        onInsert={(html) => {
                            handleAskAiInsert(html);
                        }}
                    />

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

                    <ImageGeneratorModal
                        show={showImageModal}
                        imagePrompt={imagePrompt}
                        onPromptChange={setImagePrompt}
                        onSubmit={() => generateImageFromPrompt(imagePrompt)}
                        isLoading={isImageLoading}
                        onClose={() => setShowImageModal(false)}
                    />
                </div>

                {showKeyPoints && (
                    <KeyPointsPanel
                        brandExclusivePoints={effectiveBrandPoints}
                        keyPoints={effectiveKeyPoints}
                        checkedPoints={effectiveCheckedPoints}
                        refiningPoint={null}
                        onTogglePoint={onTogglePoint || ctx?.onTogglePoint}
                        onRefinePoint={() => { }}
                        useTiptap
                        isTiptapReady={Boolean(tiptapApi)}
                        uniqueCoveredCount={uniqueCoveredCount}
                        totalPoints={totalPoints}
                        targetAudience={effectiveTargetAudience}
                    />
                )}

                {showVisualAssets && (
                    <VisualAssetsPanel
                        scrapedImages={effectiveScrapedImages}
                        onToggleImage={onRemoveScrapedImage || ctx?.onRemoveScrapedImage || (() => { })}
                        imagePlans={imagePlans as ImageAssetPlan[]}
                        isPlanning={isPlanning}
                        isBatchProcessing={isBatchProcessing}
                        onBatchProcess={handleBatchProcess}
                        onAutoPlan={autoPlanImages}
                        onGenerateSinglePlan={generateSinglePlan}
                        onUpdatePlanPrompt={updatePlanPrompt}
                        onInjectImage={injectImageIntoEditor}
                        useTiptap
                        isTiptapReady={Boolean(tiptapApi)}
                    />
                )}
            </div>

            {isAiRunning && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-40">
                    <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-sm text-gray-700">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                        <span>AI is working...</span>
                    </div>
                </div>
            )}

            <div className="px-4 py-2 bg-gray-50/95 backdrop-blur border-t border-gray-200 text-[10px] text-gray-500 font-mono flex items-center justify-end gap-4 select-none sticky bottom-0 z-10">
                <span>{wordCount} words</span>
                <span>{charCount} chars</span>
            </div>
        </div>
    );
};
