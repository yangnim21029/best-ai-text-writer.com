import { useCallback, useState } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { fetchUrlContent } from '../services/webScraper';
import { extractWebsiteTypeAndTerm } from '../services/extractionService';
import { ArticleFormValues } from '../schemas/formSchema';
import { CostBreakdown, ScrapedImage, TokenUsage } from '../types';

interface UseUrlScraperParams {
    setValue: UseFormSetValue<ArticleFormValues>;
    onAddCost?: (cost: CostBreakdown, usage: TokenUsage) => void;
    setInputType: (type: 'text' | 'url') => void;
}

export const useUrlScraper = ({
    setValue,
    onAddCost,
    setInputType,
}: UseUrlScraperParams) => {
    const [scrapedImages, setScrapedImages] = useState<ScrapedImage[]>([]);
    const mutation = useMutation({
        mutationFn: async (url: string) => {
            if (!url) throw new Error('URL is required');
            const { title, content, images } = await fetchUrlContent(url);
            return { title, content, images };
        },
        onSuccess: async ({ title, content, images }) => {
            setValue('referenceContent', content);
            setScrapedImages(images);
            if (title) setValue('title', title);

            try {
                const brandRes = await extractWebsiteTypeAndTerm(content);
                if (brandRes.data.websiteType) setValue('websiteType', brandRes.data.websiteType);
                if (brandRes.data.authorityTerms) setValue('authorityTerms', brandRes.data.authorityTerms);
                if (onAddCost) onAddCost(brandRes.cost, brandRes.usage);
            } catch (aiError) {
                console.warn('Failed to auto-extract brand info', aiError);
            }
            setInputType('text');
        },
        onError: () => {
            alert('Failed to fetch content from URL. The site might block bots.');
        }
    });

    const fetchAndPopulate = useCallback(async (url: string) => {
        await mutation.mutateAsync(url);
    }, [mutation]);

    return {
        scrapedImages,
        setScrapedImages,
        isFetchingUrl: mutation.isPending,
        fetchAndPopulate,
    };
};
