import { useCallback, useState } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { scrapeUrlAction } from '@/app/actions/scrape';
import { extractWebsiteTypeAction } from '@/app/actions/analysis';
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

      const result = await scrapeUrlAction(url);
      return result;
    },
    onSuccess: async ({ title, content, images }, url) => {
      // 1. Immediately switch to manual mode to show content
      setInputType('text');

      setValue('referenceContent', content);
      setScrapedImages(dedupeScrapedImages(images));

      let finalTitle = title;
      if (!finalTitle || finalTitle.length <= 2) {
        try {
          const u = new URL(url);
          const path = u.pathname === '/' ? 'Home' : u.pathname.split('/').pop() || 'Page';
          finalTitle = `${u.hostname} - ${path}`;
        } catch {
          finalTitle = url;
        }
      }
      setValue('title', finalTitle);

      let websiteType = '';
      let authorityTerms = '';

      try {
        const brandRes = await extractWebsiteTypeAction(content);
        websiteType = brandRes.data.websiteType;
        authorityTerms = brandRes.data.authorityTerms;

        if (websiteType) setValue('websiteType', websiteType);
        if (authorityTerms) setValue('authorityTerms', authorityTerms);
        if (onAddCost) onAddCost(brandRes.cost, brandRes.usage);

      } catch (aiError) {
        console.warn('Failed to auto-extract brand info', aiError);
      }

      // Automatically create a page profile if callback exists
      if (onCreatePage) {
        onCreatePage({
          name: finalTitle || url,
          title: finalTitle || '',
          referenceContent: content,
          scrapedImages: dedupeScrapedImages(images),
          websiteType,
          authorityTerms,
          targetAudience: (targetAudience as any) || 'zh-TW',
        });
      }
    },
    onError: () => {
      alert('Failed to fetch content from URL. The site might block bots.');
    },
  });

  const fetchAndPopulate = useCallback(
    async (url: string) => {
      await mutation.mutateAsync(url);
    },
    [mutation]
  );

  return {
    scrapedImages,
    setScrapedImages,
    isFetchingUrl: mutation.isPending,
    fetchAndPopulate,
  };
};
