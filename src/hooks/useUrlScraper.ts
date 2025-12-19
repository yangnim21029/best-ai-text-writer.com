import { useCallback, useState } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { fetchUrlContent } from '../services/research/webScraper';
import { extractWebsiteTypeAndTerm } from '../services/research/referenceAnalysisService';
import { ArticleFormValues } from '../schemas/formSchema';
import { CostBreakdown, ScrapedImage, TokenUsage, PageProfile } from '../types';
import { dedupeScrapedImages } from '../utils/imageUtils';

interface UseUrlScraperParams {
    setValue: UseFormSetValue<ArticleFormValues>;
    onAddCost?: (cost: CostBreakdown, usage: TokenUsage) => void;
    setInputType: (type: 'text' | 'url') => void;
    onCreatePage?: (data: Partial<PageProfile> & { name: string }) => void;
    targetAudience?: string;
    scrapedImages: ScrapedImage[];
    setScrapedImages: (images: ScrapedImage[]) => void;
}

export const useUrlScraper = ({
    setValue,
    onAddCost,
    setInputType,
    onCreatePage,
    targetAudience,
    scrapedImages,
    setScrapedImages,
}: UseUrlScraperParams) => {
    const mutation = useMutation({
        mutationFn: async (url: string) => {
            if (!url) throw new Error('URL is required');
            const { title, content, images } = await fetchUrlContent(url);
            return { title, content, images };
        },
        onSuccess: async ({ title, content, images }, url) => {
            setValue('referenceContent', content);
            setScrapedImages(dedupeScrapedImages(images));

            if (title && title.length > 2) {
                setValue('title', title);
            } else {
                // Fallback: Use URL hostname + path as title to avoid "Article Topic" duplicates
                try {
                    const u = new URL(url);
                    const path = u.pathname === '/' ? 'Home' : u.pathname.split('/').pop() || 'Page';
                    setValue('title', `${u.hostname} - ${path}`);
                } catch {
                    setValue('title', url);
                }
            }

            try {
                const brandRes = await extractWebsiteTypeAndTerm(content);
                const websiteType = brandRes.data.websiteType;
                const authorityTerms = brandRes.data.authorityTerms;

                if (websiteType) setValue('websiteType', websiteType);
                if (authorityTerms) setValue('authorityTerms', authorityTerms);
                if (onAddCost) onAddCost(brandRes.cost, brandRes.usage);

                // Automatically create a page profile if callback exists
                if (onCreatePage) {
                    onCreatePage({
                        name: title || url,
                        title: title || '',
                        referenceContent: content,
                        scrapedImages: dedupeScrapedImages(images),
                        websiteType,
                        authorityTerms,
                        targetAudience: (targetAudience as any) || 'zh-TW'
                    });
                }
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
