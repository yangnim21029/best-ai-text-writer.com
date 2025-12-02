import React, { useMemo } from 'react';
import { ArticleConfig, CostBreakdown, GenerationStep, SavedProfile, ScrapedImage, TargetAudience, TokenUsage } from '../types';
import { ArticleFormValues } from '../schemas/formSchema';
import { summarizeBrandContent } from '../services/productService';
import { WebsiteProfileSection } from './form/WebsiteProfileSection';
import { ServiceProductSection } from './form/ServiceProductSection';
import { SourceMaterialSection } from './form/SourceMaterialSection';
import { LayoutTemplate, Trash2, Sparkles, Settings2, Zap, BookOpen, Loader2, Image as ImageIcon } from 'lucide-react';
import { useArticleForm } from '../hooks/useArticleForm';
import { useSemanticFilter } from '../hooks/useSemanticFilter';

interface InputFormProps {
    onGenerate: (config: ArticleConfig) => void;
    onGenerateSections?: () => void;
    isGenerating: boolean;
    isWriting?: boolean;
    canGenerateSections?: boolean;
    currentStep: GenerationStep;
    onAddCost?: (cost: CostBreakdown, usage: TokenUsage) => void;
    savedProfiles?: SavedProfile[];
    setSavedProfiles?: (profiles: SavedProfile[]) => void;
    activeProfile?: SavedProfile | null;
    onSetActiveProfile?: (profile: SavedProfile | null) => void;
    inputType: 'text' | 'url';
    setInputType: (type: 'text' | 'url') => void;
    brandKnowledge?: string;
}

const STORAGE_KEY = 'pro_content_writer_inputs_simple_v4';

export const InputForm: React.FC<InputFormProps> = ({
    onGenerate,
    onGenerateSections,
    isGenerating,
    isWriting = false,
    canGenerateSections = false,
    currentStep,
    onAddCost,
    savedProfiles = [],
    setSavedProfiles,
    activeProfile,
    onSetActiveProfile,
    inputType,
    setInputType,
    brandKnowledge = ''
}) => {
    const {
        register,
        handleSubmit,
        setValue,
        watchedValues,
        errors,
        productMode,
        setProductMode,
        isSummarizingProduct,
        setIsSummarizingProduct,
        refCharCount,
        refWordCount,
        scrapedImages,
        setScrapedImages,
        isFetchingUrl,
        fetchAndPopulate,
        createProfile,
        updateProfile,
        deleteProfile,
        applyProfileToForm,
        loadProductFromProfile,
        usableImages,
        handleClear,
    } = useArticleForm({
        brandKnowledge,
        savedProfiles,
        setSavedProfiles,
        activeProfile,
        onSetActiveProfile,
        setInputType,
    });

    const {
        isChunkModalOpen,
        setIsChunkModalOpen,
        chunkPreview,
        chunkScores,
        isScoringChunks,
        isFilteringChunks,
        filterError,
        manualKeep,
        setManualKeep,
        openFilterModal,
        applyFilter,
        SEMANTIC_THRESHOLD
    } = useSemanticFilter();

    const onSubmit = (data: ArticleFormValues) => {
        const usableImages = scrapedImages.filter(img => !img.ignored);
        onGenerate({
            title: data.title,
            referenceContent: data.referenceContent,
        sampleOutline: data.sampleOutline,
        authorityTerms: data.authorityTerms,
        websiteType: data.websiteType,
        targetAudience: data.targetAudience,
        useRag: data.useRag,
        autoImagePlan: data.autoImagePlan,
        productRawText: data.productRawText,
        brandKnowledge: undefined,
        scrapedImages: usableImages
    });
};

    const handleFetchUrl = async () => {
        await fetchAndPopulate(watchedValues.urlInput || '');
    };

    const handleImportProductUrls = async () => {
        const urlsInput = watchedValues.productUrlList;
        if (!urlsInput?.trim()) return;
        setIsSummarizingProduct(true);
        try {
            const urls = urlsInput.split('\n').map(u => u.trim()).filter(u => u.length > 0);
            const res = await summarizeBrandContent(urls, watchedValues.targetAudience as TargetAudience);

            setValue('productRawText', res.data);
            setProductMode('text');

            if (onAddCost) onAddCost(res.cost, res.usage);

            updateProfile({ ...watchedValues, productRawText: res.data });
        } catch (e) {
            alert('Failed to summarize brand content.');
        } finally {
            setIsSummarizingProduct(false);
        }
    };

    const handleToggleScrapedImage = (image: ScrapedImage) => {
        const keyToMatch = image.id || image.url || image.altText;
        setScrapedImages(prev =>
            prev.map((img, idx) => {
                const key = img.id || img.url || img.altText || `${idx}`;
                if (key !== keyToMatch) return img;
                return { ...img, ignored: !img.ignored };
            })
        );
    };

    const isReadyToGenerate = useMemo(() => {
        const hasTitle = (watchedValues.title || '').trim().length > 0;
        const hasRef = (watchedValues.referenceContent || '').trim().length > 0;
        return hasTitle && hasRef && !isFetchingUrl && !isSummarizingProduct;
    }, [watchedValues.title, watchedValues.referenceContent, isFetchingUrl, isSummarizingProduct]);

    const handlePreviewSemanticFilter = () => {
        const content = (watchedValues.referenceContent || '').trim();
        const title = (watchedValues.title || '').trim();

        if (!content) {
            alert('先貼上內容再做語意過濾。');
            return;
        }

        openFilterModal(content, title);
    };

    const handleRunSemanticFilter = async () => {
        const content = (watchedValues.referenceContent || '').trim();
        const title = (watchedValues.title || '').trim();

        const filteredContent = await applyFilter(content, title);
        if (filteredContent !== null && filteredContent !== undefined) {
            setValue('referenceContent', filteredContent);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50/80 overflow-hidden font-sans">
            {/* Header Area */}
            <div className="p-4 pb-2 flex-shrink-0 border-b border-gray-100 bg-white/80 backdrop-blur-sm z-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-800">
                        <LayoutTemplate className="w-4 h-4 text-blue-600" />
                        <h2 className="text-sm font-bold tracking-tight">Writer Config</h2>
                    </div>
                    <button onClick={handleClear} className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 hover:bg-red-50 rounded">
                        <Trash2 className="w-3 h-3" /> Clear
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 relative">

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-24">

                    <WebsiteProfileSection
                        register={register}
                        targetAudience={watchedValues.targetAudience}
                        websiteType={watchedValues.websiteType}
                        authorityTerms={watchedValues.authorityTerms}
                        savedProfiles={savedProfiles}
                        activeProfile={activeProfile}
                        brandKnowledge={brandKnowledge}
                        onCreateProfile={(name) => createProfile(name, watchedValues)}
                        onUpdateProfile={() => updateProfile(watchedValues)}
                        onDeleteProfile={deleteProfile}
                        onLoadProfile={(profile) => {
                            applyProfileToForm(profile);
                            setProductMode('text');
                        }}
                    />

                    <ServiceProductSection
                        register={register}
                        productMode={productMode}
                        setProductMode={setProductMode}
                        productRawText={watchedValues.productRawText}
                        isSummarizingProduct={isSummarizingProduct}
                        canAnalyzeFromUrls={Boolean(watchedValues.productUrlList)}
                        savedProfiles={savedProfiles}
                        activeProfile={activeProfile}
                        onCreateProfile={(name) => createProfile(name, watchedValues)}
                        onUpdateProfile={() => updateProfile(watchedValues)}
                        onLoadProductFromProfile={(profile) => {
                            loadProductFromProfile(profile);
                            setProductMode('text');
                        }}
                        onAnalyzeFromUrls={handleImportProductUrls}
                    />

                    <SourceMaterialSection
                        register={register}
                        errors={errors}
                        inputType={inputType}
                        setInputType={setInputType}
                        urlValue={watchedValues.urlInput}
                        refWordCount={refWordCount}
                        refCharCount={refCharCount}
                        scrapedImages={scrapedImages}
                        onToggleScrapedImage={handleToggleScrapedImage}
                        onFetchUrl={handleFetchUrl}
                        isFetchingUrl={isFetchingUrl}
                        onRequestSemanticFilter={handlePreviewSemanticFilter}
                        canSemanticFilter={(watchedValues.referenceContent || '').trim().length > 0}
                    />

                    <div className="space-y-2">
                        <h3 className="text-[10px] font-bold uppercase text-gray-400 tracking-wider px-1 flex items-center gap-1">
                            <Settings2 className="w-3 h-3" /> Advanced Settings
                        </h3>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] p-3 space-y-3">
                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${watchedValues.useRag ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <BookOpen className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">Knowledge Base (RAG)</p>
                                        <p className="text-[10px] text-gray-500">Use uploaded brand docs for accuracy</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setValue('useRag', !watchedValues.useRag)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${watchedValues.useRag ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${watchedValues.useRag ? 'translate-x-4.5' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${watchedValues.autoImagePlan ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <ImageIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">Auto Visual Plan</p>
                                        <p className="text-[10px] text-gray-500">寫完後自動規劃並生成圖片</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setValue('autoImagePlan', !watchedValues.autoImagePlan)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${watchedValues.autoImagePlan ? 'bg-emerald-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${watchedValues.autoImagePlan ? 'translate-x-4.5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-500 px-1">
                                關閉可避免尚未按下圖片生成按鈕時就提前觸發。
                            </p>

                        </div>
                    </div>

                </div>

                <div className="p-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm z-10">
                    <div className="space-y-2">
                        <button
                            type="submit"
                            disabled={isGenerating || isWriting || !isReadyToGenerate}
                            className={`w-full py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${isGenerating || isWriting || !isReadyToGenerate
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-500/30 hover:brightness-110'
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{currentStep.replace(/_/g, ' ').toUpperCase()}...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    <span>Step 1：分析 (供審閱)</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => onGenerateSections && onGenerateSections()}
                            disabled={!canGenerateSections || isGenerating || isWriting}
                            className={`w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] border ${!canGenerateSections || isGenerating || isWriting
                                ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                                }`}
                        >
                            {isWriting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Writing Sections...</span>
                                </>
                            ) : (
                                <>
                                    <Zap className="w-4 h-4" />
                                    <span>Step 2：生成 Sections</span>
                                </>
                            )}
                        </button>

                        <p className="text-[11px] text-gray-500 text-center">
                            先完成分析並檢視結果 (側欄) ，確認後再生成內文段落。
                        </p>
                    </div>
                </div>
            </form>

            {isChunkModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-900">語意過濾分段確認</p>
                                <p className="text-[11px] text-gray-500 mt-0.5">以空白行分段，顯示與標題的語意相似度 (閾值 {SEMANTIC_THRESHOLD}).</p>
                            </div>
                            <button
                                type="button"
                                className="text-xs text-gray-400 hover:text-gray-600"
                                onClick={() => setIsChunkModalOpen(false)}
                                disabled={isFilteringChunks}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-5 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                            {chunkPreview.map((chunk, idx) => (
                                <div key={`${idx}-${chunk.slice(0, 10)}`} className="border border-gray-100 rounded-lg p-3 bg-gray-50/60">
                                    <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                                        <span className="font-semibold text-gray-700">Chunk {idx + 1}</span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setManualKeep(prev => ({ ...prev, [idx]: !prev[idx] }))}
                                                className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold transition-colors ${manualKeep[idx]
                                                        ? 'border-blue-200 bg-blue-50 text-blue-700'
                                                        : 'border-gray-200 bg-white text-gray-500 hover:border-blue-200 hover:text-blue-600'
                                                    }`}
                                            >
                                                {manualKeep[idx] ? '手動通過' : '手動通過？'}
                                            </button>
                                            {typeof chunkScores[idx] === 'number' && !Number.isNaN(chunkScores[idx]) ? (
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${chunkScores[idx] >= SEMANTIC_THRESHOLD
                                                    ? 'border-green-200 text-green-700 bg-green-50'
                                                    : 'border-amber-200 text-amber-700 bg-amber-50'
                                                    }`}>
                                                    相似度 {chunkScores[idx].toFixed(3)}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-200 text-[10px] text-gray-500 bg-white">
                                                    {isScoringChunks ? '計算中…' : '等待計算'}
                                                </span>
                                            )}
                                            <span>{chunk.length} chars</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">{chunk}</p>
                                </div>
                            ))}
                            {chunkPreview.length === 0 && (
                                <div className="text-xs text-gray-500">尚無可預覽的段落。</div>
                            )}
                        </div>

                        {filterError && (
                            <div className="px-5 py-2 text-[11px] text-red-600 border-t border-amber-100 bg-amber-50">
                                {filterError}
                            </div>
                        )}

                        <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-2">
                            <div className="text-[11px] text-gray-500">
                                使用標題向量比對每個段落，低於 {SEMANTIC_THRESHOLD} 的會被移除；手動通過的段落會強制保留。{isScoringChunks ? ' (計算中...)' : ''}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsChunkModalOpen(false)}
                                    disabled={isFilteringChunks || isScoringChunks}
                                    className="px-3 py-2 text-[12px] font-semibold text-gray-600 bg-gray-100 rounded-lg border border-gray-200 hover:bg-gray-200 transition-colors disabled:opacity-50"
                                >
                                    取消
                                </button>
                                <button
                                    type="button"
                                    onClick={handleRunSemanticFilter}
                                    disabled={isFilteringChunks || isScoringChunks}
                                    className="px-3 py-2 text-[12px] font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md hover:brightness-110 transition-all disabled:opacity-60 flex items-center gap-2"
                                >
                                    {isFilteringChunks ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                    同意並過濾
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
