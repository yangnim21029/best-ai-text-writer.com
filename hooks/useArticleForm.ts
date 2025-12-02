import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { articleFormSchema, ArticleFormValues } from '../schemas/formSchema';
import { SavedProfile, ScrapedImage } from '../types';
import { useUrlScraper } from './useUrlScraper';
import { useProfileManager } from './useProfileManager';
import { useStorageReset } from './useStorageReset';

const STORAGE_KEY = 'pro_content_writer_inputs_simple_v4';

interface UseArticleFormParams {
    brandKnowledge?: string;
    savedProfiles?: SavedProfile[];
    setSavedProfiles?: (profiles: SavedProfile[]) => void;
    activeProfile?: SavedProfile | null;
    onSetActiveProfile?: (profile: SavedProfile | null) => void;
    setInputType: (type: 'text' | 'url') => void;
}

export const useArticleForm = ({
    brandKnowledge = '',
    savedProfiles = [],
    setSavedProfiles,
    activeProfile,
    onSetActiveProfile,
    setInputType,
}: UseArticleFormParams) => {
    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm<ArticleFormValues>({
        resolver: zodResolver(articleFormSchema),
        defaultValues: {
            title: '',
            referenceContent: '',
            sampleOutline: '',
            authorityTerms: '',
            websiteType: '',
            targetAudience: 'zh-TW',
            useRag: false,
            autoImagePlan: false,
            productRawText: '',
            urlInput: '',
            productUrlList: ''
        }
    });

    const watchedValues = watch();

    const [productMode, setProductMode] = useState<'text' | 'url'>('text');
    const [isSummarizingProduct, setIsSummarizingProduct] = useState(false);
    const [refCharCount, setRefCharCount] = useState(0);
    const [refWordCount, setRefWordCount] = useState(0);
    const { clearAll } = useStorageReset();

    const {
        scrapedImages,
        setScrapedImages,
        isFetchingUrl,
        fetchAndPopulate
    } = useUrlScraper({
        setValue,
        setInputType,
    });

    const {
        createProfile,
        updateProfile,
        deleteProfile,
        applyProfileToForm,
        loadProductFromProfile,
    } = useProfileManager({
        savedProfiles,
        setSavedProfiles,
        activeProfile,
        onSetActiveProfile,
        brandKnowledge,
        setValue,
    });

    // Restore persisted form
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                Object.keys(parsed).forEach(key => {
                    // @ts-ignore
                    setValue(key, parsed[key]);
                });
                if (parsed.scrapedImages) setScrapedImages(parsed.scrapedImages);
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
            const englishWords = nonCjkText.trim().split(/\s+/).filter(w => w.length > 0);
            setRefWordCount(cjkCount + englishWords.length);
        });
        return () => subscription.unsubscribe();
    }, [scrapedImages, watch]);

    // Apply active profile
    useEffect(() => {
        if (activeProfile) {
            applyProfileToForm(activeProfile);
        }
    }, [activeProfile, applyProfileToForm]);

    const usableImages = useMemo(() => scrapedImages.filter(img => !img.ignored), [scrapedImages]);

    const handleClear = useCallback(() => {
        if (typeof window === 'undefined') return;
        if (!confirm('確定要清空所有輸入與紀錄嗎？\n這會重置表單、分析與草稿，並重新整理頁面。')) return;
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
        usableImages,
        handleClear,
    };
};
