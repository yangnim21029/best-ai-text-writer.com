import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArticleFormValues, articleFormSchema } from '../schemas/formSchema';
import { SavedProfile, ScrapedImage, PageProfile, CostBreakdown, TokenUsage } from '../types';
import { useUrlScraper } from './useUrlScraper';
import { useProfileManager } from './useProfileManager';
import { useStorageReset } from './useStorageReset';
import { dedupeScrapedImages } from '../utils/imageUtils';

const STORAGE_KEY = 'pro_content_writer_inputs_simple_v4';

interface UseArticleFormParams {
  brandKnowledge?: string;
  savedProfiles?: SavedProfile[];
  setSavedProfiles?: (profiles: SavedProfile[]) => void;
  activeProfile?: SavedProfile | null;
  onSetActiveProfile?: (profile: SavedProfile | null) => void;
  // Page Profiles
  savedPages?: PageProfile[];
  setSavedPages?: (pages: PageProfile[]) => void;
  activePageId?: string;
  onSetActivePageId?: (id: string | undefined) => void;
  setBrandRagUrl?: (url: string) => void;
  onAddCost?: (cost: CostBreakdown, usage: TokenUsage) => void;

  setInputType: (type: 'text' | 'url') => void;
}

export const useArticleForm = ({
  brandKnowledge = '',
  savedProfiles = [],
  setSavedProfiles,
  activeProfile,
  onSetActiveProfile,
  savedPages = [],
  setSavedPages,
  activePageId,
  onSetActivePageId,
  setBrandRagUrl,
  onAddCost,
  setInputType,
}: UseArticleFormParams) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: '',
      referenceContent: '',
      sampleOutline: '',
      authorityTerms: '',
      websiteType: '',
      targetAudience: 'zh-TW',
      productRawText: '',
      urlInput: '',
      productUrlList: '',
    },
  });

  const watchedValues = watch();

  const [scrapedImages, setScrapedImages] = useState<ScrapedImage[]>([]);
  const [productMode, setProductMode] = useState<'text' | 'url'>('text');
  const [isSummarizingProduct, setIsSummarizingProduct] = useState(false);
  const [refCharCount, setRefCharCount] = useState(0);
  const [refWordCount, setRefWordCount] = useState(0);
  const { clearAll } = useStorageReset();

  const {
    createProfile,
    updateProfile,
    deleteProfile,
    applyProfileToForm,
    loadProductFromProfile,
    createPage,
    updatePage,
    deletePage,
    applyPageToForm,
  } = useProfileManager({
    savedProfiles,
    setSavedProfiles,
    activeProfile,
    onSetActiveProfile,
    savedPages,
    setSavedPages,
    activePageId,
    onSetActivePageId,
    brandKnowledge,
    setValue,
    setScrapedImages,
    setBrandRagUrl,
  });

  const { isFetchingUrl, fetchAndPopulate } = useUrlScraper({
    setValue,
    onAddCost,
    setInputType,
    onCreatePage: createPage,
    targetAudience: watchedValues.targetAudience,
    scrapedImages,
    setScrapedImages,
  });

  // Restore persisted form
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        Object.keys(parsed).forEach((key) => {
          // @ts-ignore
          setValue(key, parsed[key]);
        });
        if (parsed.scrapedImages) setScrapedImages(dedupeScrapedImages(parsed.scrapedImages));
      } catch (e) {
        console.warn('Failed to restore persisted form', e);
      }
    }
  }, [setScrapedImages, setValue]);

  // Persist + counts
  useEffect(() => {
    const subscription = watch((values) => {
      const dataToSave = { ...values, scrapedImages };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));

      const content = values.referenceContent || '';
      setRefCharCount(content.length);
      const cjkCount = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
      const nonCjkText = content.replace(/[\u4e00-\u9fa5]/g, ' ');
      const englishWords = nonCjkText
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0);
      setRefWordCount(cjkCount + englishWords.length);
    });
    return () => subscription.unsubscribe();
  }, [scrapedImages, watch]);

  // Apply active profile
  useEffect(() => {
    // Only apply website profile if we don't have an active page.
    // If we HAVE an active page, we want to keep its content (title/reference).
    if (activeProfile && !activePageId) {
      applyProfileToForm(activeProfile);
    }
  }, [activeProfile, activePageId, applyProfileToForm]);

  const usableImages = useMemo(() => scrapedImages.filter((img) => !img.ignored), [scrapedImages]);

  const handleClear = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!confirm('確定要清空所有輸入與紀錄嗎？\n這會重置表單、分析與草稿，並重新整理頁面。'))
      return;
    reset();
    setScrapedImages([]);
    setValue('targetAudience', 'zh-TW');
    clearAll({ reload: true, includeForm: true });
  }, [clearAll, reset, setScrapedImages, setValue]);

  return {
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
    createPage,
    updatePage,
    deletePage,
    applyPageToForm,
    usableImages,
    handleClear,
  };
};
