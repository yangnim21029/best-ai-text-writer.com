import React, { useMemo } from 'react';
import { ArticleConfig, CostBreakdown, GenerationStep, SavedProfile, ScrapedImage, TargetAudience, TokenUsage } from '../types';
import { summarizeBrandContent } from '../services/productService';
import { WebsiteProfileSection } from './form/WebsiteProfileSection';
import { ServiceProductSection } from './form/ServiceProductSection';
import { SourceMaterialSection } from './form/SourceMaterialSection';
import { LayoutTemplate, Trash2, Sparkles, Settings2, Zap, BookOpen, Loader2 } from 'lucide-react';
import { useArticleForm } from '../hooks/useArticleForm';

interface InputFormProps {
    onGenerate: (config: ArticleConfig) => void;
    isGenerating: boolean;
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
    isGenerating,
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
            turboMode: data.turboMode,
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
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${watchedValues.turboMode ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <Zap className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">Turbo Mode</p>
                                        <p className="text-[10px] text-gray-500">Parallel generation (Faster, less context)</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setValue('turboMode', !watchedValues.turboMode)}
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${watchedValues.turboMode ? 'bg-blue-600' : 'bg-gray-200'}`}
                                >
                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${watchedValues.turboMode ? 'translate-x-4.5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>

                </div>

                <div className="p-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm z-10">
                    <button
                        type="submit"
                        disabled={isGenerating || !isReadyToGenerate}
                        className={`w-full py-3 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] ${isGenerating
                                || !isReadyToGenerate
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
                                <span>Generate Article</span>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
