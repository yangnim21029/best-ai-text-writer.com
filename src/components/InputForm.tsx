'use client';

import React, { useMemo } from 'react';
import { SubmitHandler } from 'react-hook-form';
import { ArticleConfig, CostBreakdown, GenerationStep, SavedProfile, ScrapedImage, TargetAudience, TokenUsage } from '@/types';
import { ArticleFormValues } from '@/schemas/formSchema';
import { summarizeBrandContent } from '@/services/research/productFeatureToPainPointMapper';
import { WebsiteProfileSection } from './form/WebsiteProfileSection';
import { ServiceProductSection } from './form/ServiceProductSection';
import { SourceMaterialSection } from './form/SourceMaterialSection';
import { LayoutTemplate, Trash2, Sparkles, Settings2, Zap, BookOpen, Loader2, Image as ImageIcon, ChevronDown, Database, FileText } from 'lucide-react';
import { useArticleForm } from '@/hooks/useArticleForm';
import { useSemanticFilter } from '@/hooks/useSemanticFilter';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { useAppStore } from '@/store/useAppStore';
import { useGenerationStore } from '@/store/useGenerationStore';
import { EMBED_MODEL_ID } from '@/config/constants';

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
    onShowPlan?: () => void;
    hasPlan?: boolean;
}

const STORAGE_KEY = 'pro_content_writer_inputs_simple_v4';

const ThresholdInput: React.FC<{
    value: string;
    onChange: (val: string) => void;
    onCommit: (val?: string) => void;
}> = ({ value, onChange, onCommit }) => {
    const [localValue, setLocalValue] = React.useState(value);

    React.useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleCommit = () => {
        onCommit(localValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCommit();
        }
    };

    return (
        <input
            type="number"
            min="0"
            max="1"
            step="0.01"
            value={localValue}
            onChange={(e) => {
                setLocalValue(e.target.value);
                onChange(e.target.value);
            }}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            className="w-24 px-2 py-1 text-[11px] border border-gray-200 rounded-lg text-gray-800 shadow-inner"
        />
    );
};

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
    brandKnowledge = '',
    onShowPlan,
    hasPlan = false
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
        semanticThreshold,
        semanticThresholdInput,
        setSemanticThresholdInput,
        commitSemanticThreshold
    } = useSemanticFilter();

    const analysisStore = useAnalysisStore();
    const { useRag, autoImagePlan } = useAppStore();

    const semanticThresholdValue = useMemo(() => {
        const parsed = parseFloat(semanticThresholdInput);
        if (!Number.isNaN(parsed)) {
            return Math.min(1, Math.max(0, parsed));
        }
        return semanticThreshold;
    }, [semanticThresholdInput, semanticThreshold]);

    const semanticThresholdLabel = useMemo(
        () => semanticThresholdValue.toFixed(2),
        [semanticThresholdValue]
    );

    const onSubmit: SubmitHandler<ArticleFormValues> = (data) => {
        const usableImages = scrapedImages.filter(img => !img.ignored);
        onGenerate({
            title: data.title,
            referenceContent: data.referenceContent,
            sampleOutline: data.sampleOutline,
            authorityTerms: data.authorityTerms,
            websiteType: data.websiteType,
            targetAudience: data.targetAudience,
            useRag: useRag,
            autoImagePlan: autoImagePlan,
            productRawText: data.productRawText,
            brandKnowledge: undefined,
            scrapedImages: usableImages,
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

        commitSemanticThreshold();

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
                    <div className="flex items-center gap-4 text-gray-800">
                        <div className="flex items-center gap-2">
                            <LayoutTemplate className="w-4 h-4 text-blue-600" />
                            <h2 className="text-sm font-bold tracking-tight">Writer Config</h2>
                        </div>

                        {/* Compact Language Selector */}
                        <div className="relative group/lang">
                            <select
                                {...register('targetAudience')}
                                className="pl-2 pr-6 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 appearance-none cursor-pointer hover:bg-white hover:border-indigo-300 transition-all outline-none"
                            >
                                <option value="zh-TW">🇹🇼 TW</option>
                                <option value="zh-HK">🇭🇰 HK</option>
                                <option value="zh-MY">🇲🇾 MY</option>
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1.5 w-3 h-3 text-gray-400 pointer-events-none group-hover/lang:text-indigo-500 transition-colors" />
                        </div>
                    </div>
                    <button onClick={handleClear} className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 hover:bg-red-50 rounded">
                        <Trash2 className="w-3 h-3" /> Clear
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 relative">

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-24">

                    {/* NEW: Knowledge Hub Section */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Database className="w-3.5 h-3.5 text-indigo-600" />
                            <h3 className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider">Knowledge Hub</h3>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* Analysis Documents / Knowledge Objects */}
                            <div className="p-3 border-b border-gray-50 bg-indigo-50/30">
                                <label className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-700 uppercase mb-2">
                                    <FileText className="w-3 h-3" /> Analysis Documents
                                </label>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                                    {analysisStore.analysisDocuments.length === 0 ? (
                                        <p className="text-[10px] text-gray-400 italic py-2 text-center">No knowledge objects yet. Run Step 1 to create one.</p>
                                    ) : (
                                        analysisStore.analysisDocuments.map(doc => {
                                            const isSelected = analysisStore.selectedDocumentIds.includes(doc.id);
                                            return (
                                                <div
                                                    key={doc.id}
                                                    role="button"
                                                    tabIndex={0}
                                                    onClick={() => analysisStore.toggleDocumentSelection(doc.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            analysisStore.toggleDocumentSelection(doc.id);
                                                        }
                                                    }}
                                                    className={`w-full text-left p-2 rounded-lg border transition-all flex items-center gap-2 group/doc cursor-pointer ${isSelected
                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                                                        : 'bg-white border-gray-100 text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/50'
                                                        }`}
                                                >
                                                    <div className={`w-3 h-3 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-white border-white' : 'border-gray-300'}`}>
                                                        {isSelected && <div className="w-1.5 h-1.5 bg-indigo-600 rounded-sm" />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-[11px] font-bold truncate">{doc.title}</div>
                                                        <div className={`text-[9px] ${isSelected ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                            {new Date(doc.timestamp).toLocaleString()}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (confirm('Delete this analysis document?')) {
                                                                analysisStore.deleteDocument(doc.id);
                                                            }
                                                        }}
                                                        className={`p-1 rounded hover:bg-white/20 transition-opacity ${isSelected ? 'opacity-80' : 'opacity-0 group-hover/doc:opacity-100 text-gray-300 hover:text-red-500'
                                                            }`}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Existing Sections moved here */}
                            <div className="divide-y divide-gray-50">
                                <div className="p-1">
                                    <WebsiteProfileSection
                                        register={register}
                                        targetAudience={watchedValues.targetAudience}
                                        websiteType={watchedValues.websiteType}
                                        authorityTerms={watchedValues.authorityTerms}
                                        savedProfiles={savedProfiles}
                                        activeProfile={activeProfile}
                                        brandKnowledge={brandKnowledge} // Still using the prop for now
                                        onCreateProfile={(name) => createProfile(name, watchedValues)}
                                        onUpdateProfile={() => updateProfile(watchedValues)}
                                        onDeleteProfile={deleteProfile}
                                        onLoadProfile={(profile) => {
                                            applyProfileToForm(profile);
                                            setProductMode('text');
                                        }}
                                    />
                                </div>
                                <div className="p-1">
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
                                </div>

                                {/* Brand Knowledge Area directly in Hub */}
                                <div className="p-4 bg-slate-50/50">
                                    <label className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase mb-2">
                                        <BookOpen className="w-3 h-3" /> Brand Knowledge (RAG)
                                    </label>
                                    <textarea
                                        value={analysisStore.brandKnowledge}
                                        onChange={(e) => analysisStore.setBrandKnowledge(e.target.value)}
                                        placeholder="Paste brand guidelines, whitepapers, or specific facts here..."
                                        className="w-full h-24 p-3 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:border-indigo-500 transition-all resize-none custom-scrollbar"
                                    />
                                    <div className="mt-1 flex justify-between items-center text-[9px] text-gray-400 font-mono">
                                        <span>{analysisStore.brandKnowledge.length} characters</span>
                                        {analysisStore.brandKnowledge.length > 0 && <span className="text-green-600 font-bold">RAG ACTIVE</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

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
                            onClick={onShowPlan}
                            disabled={!hasPlan}
                            className={`w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all border ${hasPlan
                                ? 'text-blue-700 bg-blue-50 border-blue-100 hover:bg-blue-100'
                                : 'text-gray-400 bg-gray-50 border-gray-100 cursor-not-allowed'
                                }`}
                        >
                            <LayoutTemplate className="w-4 h-4" />
                            <span>檢視段落計劃</span>
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
                                <p className="text-[11px] text-gray-500 mt-0.5">以空白行分段，顯示與標題的語意相似度 (閾值 {semanticThresholdLabel}).</p>
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
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] ${chunkScores[idx] >= semanticThresholdValue
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

                        <div className="px-5 py-4 border-t border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-col gap-2 text-[11px] text-gray-500">
                                <div>
                                    使用標題向量比對每個段落，低於 {semanticThresholdLabel} 的會被移除；手動通過的段落會強制保留。{isScoringChunks ? ' (計算中...)' : ''}
                                </div>
                                <label className="flex flex-wrap items-center gap-2 text-gray-700 font-semibold">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] uppercase tracking-wide">閾值</span>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full shadow-sm text-[10px] font-semibold">
                                            <Zap className="w-3 h-3" />
                                            <span>{EMBED_MODEL_ID}</span>
                                        </span>
                                    </div>
                                    <ThresholdInput
                                        value={semanticThresholdInput}
                                        onChange={setSemanticThresholdInput}
                                        onCommit={commitSemanticThreshold}
                                    />
                                </label>
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
