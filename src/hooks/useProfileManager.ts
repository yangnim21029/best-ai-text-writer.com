import { useCallback } from 'react';
import { UseFormSetValue } from 'react-hook-form';
import { ArticleFormValues } from '../schemas/formSchema';
import { SavedProfile, PageProfile, ScrapedImage } from '../types';

interface ProfileManagerParams {
  savedProfiles?: SavedProfile[];
  setSavedProfiles?: (profiles: SavedProfile[]) => void;
  activeProfile?: SavedProfile | null;
  onSetActiveProfile?: (profile: SavedProfile | null) => void;
  // Page Profiles
  savedPages?: PageProfile[];
  setSavedPages?: (pages: PageProfile[]) => void;
  activePageId?: string;
  onSetActivePageId?: (id: string | undefined) => void;

  brandKnowledge?: string;
  setValue: UseFormSetValue<ArticleFormValues>;
  setScrapedImages?: (images: ScrapedImage[]) => void;
  setBrandRagUrl?: (url: string) => void;
}

export const useProfileManager = ({
  savedProfiles = [],
  setSavedProfiles,
  activeProfile,
  onSetActiveProfile,
  savedPages = [],
  setSavedPages,
  activePageId,
  onSetActivePageId,
  brandKnowledge,
  setValue,
  setScrapedImages,
  setBrandRagUrl,
}: ProfileManagerParams) => {
  // --- Website Profile Logic ---
  const createProfile = useCallback(
    (name: string, values: ArticleFormValues) => {
      if (!setSavedProfiles || !name.trim()) return null;

      const newProfile: SavedProfile = {
        id: Date.now().toString(),
        name: name.trim(),
        websiteType: values.websiteType || '',
        authorityTerms: values.authorityTerms || '',
        brandKnowledge: brandKnowledge || '',
        targetAudience: values.targetAudience,
        productRawText: values.productRawText,
        siteUrl: values.siteUrl,
        brandRagUrl: values.brandRagUrl, // Added brandRagUrl
      };

      const updated = [...savedProfiles, newProfile];
      setSavedProfiles(updated);
      onSetActiveProfile?.(newProfile);
      return newProfile;
    },
    [brandKnowledge, onSetActiveProfile, savedProfiles, setSavedProfiles]
  );

  const updateProfile = useCallback(
    (id: string, updates: Partial<SavedProfile>) => {
      if (!setSavedProfiles) return null;

      const updatedProfiles = savedProfiles.map((p) =>
        p.id === id
          ? {
              ...p,
              ...updates,
            }
          : p
      );

      setSavedProfiles(updatedProfiles);
      if (activeProfile?.id === id) {
        const updatedActive = updatedProfiles.find((p) => p.id === id) || null;
        onSetActiveProfile?.(updatedActive);
      }
      return updatedProfiles.find((p) => p.id === id) || null;
    },
    [activeProfile, onSetActiveProfile, savedProfiles, setSavedProfiles]
  );

  const deleteProfile = useCallback(
    (id: string) => {
      if (!setSavedProfiles) return;
      const updatedProfiles = savedProfiles.filter((p) => p.id !== id);
      setSavedProfiles(updatedProfiles);
      if (activeProfile?.id === id) {
        onSetActiveProfile?.(null);
      }
    },
    [activeProfile?.id, onSetActiveProfile, savedProfiles, setSavedProfiles]
  );

  const applyProfileToForm = useCallback(
    (profile: SavedProfile) => {
      setValue('websiteType', profile.websiteType);
      setValue('authorityTerms', profile.authorityTerms);
      setValue('targetAudience', profile.targetAudience);

      if (profile.productRawText) {
        setValue('productRawText', profile.productRawText);
      } else if (profile.productBrief) {
        setValue(
          'productRawText',
          `${profile.productBrief.productName} - ${profile.productBrief.usp}. Link: ${profile.productBrief.ctaLink}`
        );
      }

      if (profile.brandRagUrl) {
        setBrandRagUrl?.(profile.brandRagUrl);
        setValue('brandRagUrl', profile.brandRagUrl);
      }

      onSetActiveProfile?.(profile);
    },
    [onSetActiveProfile, setBrandRagUrl, setValue]
  );

  const loadProductFromProfile = useCallback(
    (profile: SavedProfile) => {
      if (profile.productRawText) {
        setValue('productRawText', profile.productRawText);
      } else if (profile.productBrief) {
        setValue(
          'productRawText',
          `${profile.productBrief.productName} - ${profile.productBrief.usp}. Link: ${profile.productBrief.ctaLink}`
        );
      } else {
        alert('This profile has no saved product/service details.');
      }
    },
    [setValue]
  );

  // --- Page Profile Logic ---
  const createPage = useCallback(
    (data: Partial<PageProfile> & { name: string }) => {
      if (!setSavedPages || !data.name.trim()) return null;

      const newPage: PageProfile = {
        id: Date.now().toString(),
        name: data.name.trim(),
        title: data.title || '',
        referenceContent: data.referenceContent || '',
        scrapedImages: data.scrapedImages || [],
        websiteType: data.websiteType,
        authorityTerms: data.authorityTerms,
        targetAudience: data.targetAudience || 'zh-TW',
        brandRagUrl: data.brandRagUrl, // Snapshotted link
      };

      const updated = [...savedPages, newPage];
      setSavedPages(updated);
      onSetActivePageId?.(newPage.id);
      return newPage;
    },
    [savedPages, setSavedPages, onSetActivePageId]
  );

  const deletePage = useCallback(
    (id: string) => {
      if (!setSavedPages) return;
      setSavedPages(savedPages.filter((p) => p.id !== id));
      if (activePageId === id) {
        onSetActivePageId?.(undefined);
      }
    },
    [activePageId, onSetActivePageId, savedPages, setSavedPages]
  );

  const updatePage = useCallback(
    (id: string, updates: Partial<PageProfile>) => {
      if (!setSavedPages) return null;
      const updated = savedPages.map((p) => (p.id === id ? { ...p, ...updates } : p));
      setSavedPages(updated);
      return updated.find((p) => p.id === id) || null;
    },
    [savedPages, setSavedPages]
  );

  const applyPageToForm = useCallback(
    (page: PageProfile) => {
      setValue('title', page.title);
      setValue('referenceContent', page.referenceContent);
      if (page.scrapedImages) {
        setScrapedImages?.(page.scrapedImages);
      }
      if (page.websiteType) setValue('websiteType', page.websiteType);
      if (page.authorityTerms) setValue('authorityTerms', page.authorityTerms);
      setValue('targetAudience', page.targetAudience);
      if (page.brandRagUrl) {
        // We need a way to set it in store, but useProfileManager doesn't have it directly.
        // Actually, we can pass it via setters if needed.
      }

      if (page.brandRagUrl) {
        setBrandRagUrl?.(page.brandRagUrl);
        setValue('brandRagUrl', page.brandRagUrl);
      }

      onSetActivePageId?.(page.id);
    },
    [onSetActivePageId, setBrandRagUrl, setScrapedImages, setValue]
  );

  return {
    createProfile,
    updateProfile,
    deleteProfile,
    applyProfileToForm,
    loadProductFromProfile,
    // Page operations
    createPage,
    updatePage,
    deletePage,
    applyPageToForm,
  };
};
