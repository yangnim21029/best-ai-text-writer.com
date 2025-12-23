import React, { useMemo, useState } from 'react';
import { SubmitHandler } from 'react-hook-form';
import {
  ArticleConfig,
  CostBreakdown,
  GenerationStep,
  SavedProfile,
  ScrapedImage,
  TargetAudience,
  TokenUsage,
  PageProfile,
} from '@/types';
import { ArticleFormValues } from '@/schemas/formSchema';
import { summarizeBrandContent } from '@/services/research/productFeatureToPainPointMapper';
import { WebsiteProfileSection } from './form/WebsiteProfileSection';
import { ServiceProductSection } from './form/ServiceProductSection';
import { SourceMaterialSection } from './form/SourceMaterialSection';
import { AnalysisDocumentList } from './form/AnalysisDocumentList';
import { SemanticFilterModal } from './form/SemanticFilterModal';
import {
  LayoutTemplate,
  Trash2,
  Sparkles,
  Zap,
  BookOpen,
  Loader2,
  ChevronDown,
  FileText,
  Link2,
  FileUp,
  Slack,
  FolderOpen,
} from 'lucide-react';
import { useArticleForm } from '@/hooks/useArticleForm';
import { useSemanticFilter } from '@/hooks/useSemanticFilter';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { useAppStore } from '@/store/useAppStore';
import { LoadingButton } from './LoadingButton';
import { WebsiteLibraryModal } from './modals/WebsiteLibraryModal';
import { ServiceLibraryModal } from './modals/ServiceLibraryModal';
import { fetchUrlContent } from '@/services/research/webScraper';
import { extractWebsiteTypeAndTerm } from '@/services/research/referenceAnalysisService';
import { PageLibraryModal } from './modals/PageLibraryModal';

interface InputFormProps {
  onGenerate: (config: ArticleConfig) => void;
  onGenerateSections?: () => void;
  isGenerating: boolean;
  isWriting?: boolean;
  canGenerateSections?: boolean;
  currentStep: GenerationStep;
  onAddCost?: (cost: CostBreakdown, usage: TokenUsage) => void;
  // Website Profiles
  savedProfiles?: SavedProfile[];
  setSavedProfiles?: (profiles: SavedProfile[]) => void;
  activeProfile?: SavedProfile | null;
  onSetActiveProfile?: (profile: SavedProfile | null) => void;
  // Page Profiles
  savedPages?: PageProfile[];
  setSavedPages?: (pages: PageProfile[]) => void;
  activePageId?: string;
  onSetActivePageId?: (id: string | undefined) => void;

  inputType: 'text' | 'url';
  setInputType: (type: 'text' | 'url') => void;
  brandKnowledge?: string;
  onShowPlan?: () => void;
  hasPlan?: boolean;
}

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
  savedPages = [],
  setSavedPages,
  activePageId,
  onSetActivePageId,
  inputType,
  setInputType,
  brandKnowledge = '',
  onShowPlan,
  hasPlan = false,
}) => {
  const [isWebsiteModalOpen, setIsWebsiteModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);

  const analysisStore = useAnalysisStore();
  const { useRag, autoImagePlan } = useAppStore();

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
    createPage,
    updatePage,
    deletePage,
    applyPageToForm,
    usableImages,
    handleClear,
  } = useArticleForm({
    brandKnowledge,
    savedProfiles,
    setSavedProfiles,
    activeProfile,
    onSetActiveProfile,
    savedPages,
    setSavedPages,
    activePageId,
    onSetActivePageId,
    setBrandRagUrl: analysisStore.setBrandRagUrl,
    onAddCost,
    setInputType,
  });

  const handleAnalyzeSite = async (url: string) => {
    const { content } = await fetchUrlContent(url, { includeNav: true });
    const res = await extractWebsiteTypeAndTerm(content);
    if (onAddCost) onAddCost(res.cost, res.usage);
    return { websiteType: res.data.websiteType, authorityTerms: res.data.authorityTerms };
  };

  React.useEffect(() => {
    const handleUpdateEvent = () => {
      if (activeProfile) {
        const updated = updateProfile(activeProfile.id, watchedValues);
        if (updated) alert('Website Profile synced with current form changes!');
      } else {
        alert('No active website profile to sync.');
      }
    };

    const handleUpdatePageEvent = () => {
      if (activePageId) {
        const refreshedImages = usableImages;
        const updated = updatePage(activePageId, {
          title: watchedValues.title,
          referenceContent: watchedValues.referenceContent,
          scrapedImages: refreshedImages,
          websiteType: watchedValues.websiteType,
          authorityTerms: watchedValues.authorityTerms,
          targetAudience: watchedValues.targetAudience,
        });
        if (updated) alert('Page Profile synced with current form changes!');
      } else {
        alert('No active page profile to sync.');
      }
    };

    window.addEventListener('updateActiveProfile', handleUpdateEvent);
    window.addEventListener('updateActivePage', handleUpdatePageEvent);
    return () => {
      window.removeEventListener('updateActiveProfile', handleUpdateEvent);
      window.removeEventListener('updateActivePage', handleUpdatePageEvent);
    };
  }, [activeProfile, updateProfile, watchedValues, activePageId, updatePage, usableImages]);

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
    commitSemanticThreshold,
  } = useSemanticFilter();

  const onSubmit: SubmitHandler<ArticleFormValues> = (data) => {
    const usableImages = scrapedImages.filter((img) => !img.ignored);
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

  const handleFetchUrl = async (urlOverride?: string) => {
    await fetchAndPopulate(urlOverride || watchedValues.urlInput || '');
  };

  const handleImportProductUrls = async () => {
    const urlsInput = watchedValues.productUrlList;
    if (!urlsInput?.trim()) return;
    setIsSummarizingProduct(true);
    try {
      const urls = urlsInput
        .split('\n')
        .map((u) => u.trim())
        .filter((u) => u.length > 0);
      const res = await summarizeBrandContent(urls, watchedValues.targetAudience as TargetAudience);

      setValue('productRawText', res.data);
      setProductMode('text');

      if (onAddCost) onAddCost(res.cost, res.usage);

      if (activeProfile) {
        updateProfile(activeProfile.id, { productRawText: res.data });
      }
    } catch (e) {
      alert('Failed to summarize brand content.');
    } finally {
      setIsSummarizingProduct(false);
    }
  };

  const handleToggleScrapedImage = (image: ScrapedImage) => {
    const keyToMatch = image.id || image.url || image.altText;
    setScrapedImages((prev) =>
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
    // If we have an active page config, it should imply we have the content ready 
    // (even if watchedValues hasn't synced yet or we trust the activePageId state).
    const hasActivePage = !!activePageId;

    return (hasTitle || hasActivePage) && (hasRef || hasActivePage) && !isFetchingUrl && !isSummarizingProduct;
  }, [watchedValues.title, watchedValues.referenceContent, activePageId, isFetchingUrl, isSummarizingProduct]);

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

  const handleLoadProfile = (profile: SavedProfile) => {
    applyProfileToForm(profile);
    setProductMode('text');
    setIsWebsiteModalOpen(false);
    setIsServiceModalOpen(false);
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
          <button
            onClick={handleClear}
            className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors px-2 py-1 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6 pb-24">
          {/* 1. Source Material (Top Priority) */}
          <SourceMaterialSection
            register={register}
            setValue={setValue}
            content={watchedValues.referenceContent}
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
            websiteType={watchedValues.websiteType}
            activePageId={activePageId}
            onOpenLibrary={() => setIsPageModalOpen(true)}
            onCreatePage={(name) => createPage({ name, ...watchedValues, scrapedImages })}
            activePageTitle={
              savedPages.find((p) => p.id === activePageId)?.name || watchedValues.title
            }
          />

          {/* 2. Analysis Documents (Separate Card) */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-3 bg-blue-50/30">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 uppercase mb-2">
                <FileText className="w-3 h-3" /> Analysis Documents
              </label>
              <AnalysisDocumentList onShowPlan={onShowPlan} />
            </div>
          </div>

          {/* 3. Global Library Explorer */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <div className="px-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">
                  Website Profile
                </h4>
              </div>
            </div>

            {/* Flat Sections No Nesting inside one card */}
            <div className="space-y-3">
              <WebsiteProfileSection
                savedProfiles={savedProfiles}
                activeProfile={activeProfile}
                onOpenLibrary={() => setIsWebsiteModalOpen(true)}
              />

              <ServiceProductSection
                register={register}
                productMode={productMode}
                setProductMode={setProductMode}
                productRawText={watchedValues.productRawText}
                isSummarizingProduct={isSummarizingProduct}
                canAnalyzeFromUrls={Boolean(watchedValues.productUrlList)}
                activeProfile={activeProfile}
                onOpenLibrary={() => setIsServiceModalOpen(true)}
                onAnalyzeFromUrls={handleImportProductUrls}
              />

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <label className="flex items-center gap-1.5 text-[11px] font-black text-slate-800 uppercase tracking-wider mb-3">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Brand Knowledge (RAG)
                </label>

                <div className="space-y-3">
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors">
                      <Link2 className="w-4 h-4" />
                    </div>
                    <input
                      type="url"
                      {...register('brandRagUrl')}
                      value={analysisStore.brandRagUrl}
                      onChange={(e) => {
                        analysisStore.setBrandRagUrl(e.target.value);
                        setValue('brandRagUrl', e.target.value);
                      }}
                      placeholder="https://rag.external-brand.com/kb"
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50/50 border border-gray-100 rounded-xl text-xs font-medium text-gray-700 placeholder-gray-300 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    />
                  </div>

                  {/* Disabled Connection Options */}
                  <div className="flex items-center gap-3 px-1 pt-1 opacity-40 grayscale pointer-events-none select-none">
                    <div className="flex items-center gap-1 text-[9px] font-black text-gray-400 uppercase tracking-tighter">
                      Connect
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        title="Upload PDF (Coming Soon)"
                        className="p-1.5 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        <FileUp className="w-3.5 h-3.5" />
                      </div>
                      <div
                        title="Connect Notion (Coming Soon)"
                        className="p-1.5 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div
                        title="Connect Slack (Coming Soon)"
                        className="p-1.5 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        <Slack className="w-3.5 h-3.5" />
                      </div>
                      <div
                        title="Connect Google Drive (Coming Soon)"
                        className="p-1.5 rounded-lg bg-gray-50 border border-gray-100"
                      >
                        <FolderOpen className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${analysisStore.brandRagUrl ? 'bg-green-500 animate-pulse' : 'bg-gray-200'}`}
                      />
                      <span className="text-[10px] font-bold text-gray-500">
                        {analysisStore.brandRagUrl ? 'LINKED TO EXTERNAL RAG' : 'NO RAG LINKED'}
                      </span>
                    </div>
                    {analysisStore.brandRagUrl && (
                      <a
                        href={analysisStore.brandRagUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-indigo-600 font-bold hover:underline"
                      >
                        OPEN SOURCE
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white/80 backdrop-blur-sm z-10">
          <div className="space-y-2">
            <LoadingButton
              type="submit"
              disabled={isGenerating || isWriting || !isReadyToGenerate}
              isLoading={isGenerating}
              loadingText={`${currentStep.replace(/_/g, ' ').toUpperCase()}...`}
              icon={<Sparkles className="w-4 h-4" />}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30 hover:brightness-110"
            >
              語氣與大綱分析
            </LoadingButton>

            <LoadingButton
              type="button"
              onClick={onShowPlan}
              disabled={!hasPlan}
              variant="outline"
              icon={<LayoutTemplate className="w-4 h-4" />}
              className={`w-full ${hasPlan ? 'text-blue-700 bg-blue-50 border-blue-100 hover:bg-blue-100' : 'text-gray-400 bg-gray-50 border-gray-100'}`}
            >
              檢視文章大綱
            </LoadingButton>

            <p className="text-[11px] text-gray-500 text-center">
              先完成分析並檢視結果 (側欄) ，確認後再生成內文段落。
            </p>
          </div>
        </div>
      </form>

      {/* Library Modals */}
      <WebsiteLibraryModal
        isOpen={isWebsiteModalOpen}
        onClose={() => setIsWebsiteModalOpen(false)}
        profiles={savedProfiles}
        activeProfileId={activeProfile?.id}
        onSelect={handleLoadProfile}
        onDelete={deleteProfile}
        onUpdate={updateProfile}
        onAnalyzeSite={handleAnalyzeSite}
        onCreate={(name, siteUrl) => {
          const created = createProfile(name, { ...watchedValues, siteUrl });
          if (created) setIsWebsiteModalOpen(false);
        }}
      />

      <ServiceLibraryModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        profiles={savedProfiles}
        activeProfileId={activeProfile?.id}
        onSelect={handleLoadProfile}
        onDelete={deleteProfile}
        onCreate={(name, content) => {
          const created = createProfile(name, { ...watchedValues, productRawText: content });
          if (created) setIsServiceModalOpen(false);
        }}
        onUpdate={(id, updates) => {
          updateProfile(id, updates);
        }}
      />

      <PageLibraryModal
        isOpen={isPageModalOpen}
        onClose={() => setIsPageModalOpen(false)}
        pages={savedPages}
        activePageId={activePageId}
        onSelect={(page) => {
          applyPageToForm(page);
          setIsPageModalOpen(false);
        }}
        onDelete={deletePage}
        onUpdate={updatePage}
        onCreate={(name) => {
          createPage({ name, ...watchedValues, scrapedImages });
        }}
      />

      <SemanticFilterModal
        isOpen={isChunkModalOpen}
        onClose={() => setIsChunkModalOpen(false)}
        onApply={handleRunSemanticFilter}
        chunkPreview={chunkPreview}
        chunkScores={chunkScores}
        isFilteringChunks={isFilteringChunks}
        isScoringChunks={isScoringChunks}
        filterError={filterError}
        manualKeep={manualKeep}
        setManualKeep={setManualKeep}
        semanticThreshold={semanticThreshold}
        semanticThresholdInput={semanticThresholdInput}
        setSemanticThresholdInput={setSemanticThresholdInput}
        commitSemanticThreshold={commitSemanticThreshold}
      />
    </div>
  );
};