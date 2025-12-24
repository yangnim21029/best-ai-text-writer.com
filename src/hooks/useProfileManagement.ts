import { useAppStore } from '@/store/useAppStore';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { SavedProfile, ScrapedImage } from '@/types';
import { parseProductContextAction } from '@/app/actions/analysis';

export const useProfileManagement = () => {
  const app = useAppStore();
  const analysisStore = useAnalysisStore();

  const handleLoadProfile = async (profile: SavedProfile) => {
    app.setActiveProfile(profile);
    analysisStore.setTargetAudience(profile.targetAudience);
    analysisStore.setBrandKnowledge(profile.brandKnowledge || '');

    if (profile.productRawText) {
      const res = await parseProductContextAction(profile.productRawText);
      analysisStore.setActiveProductBrief(res.data);
    }
  };

  const handleRemoveScrapedImage = (image: ScrapedImage) => {
    const keyToMatch = image.id || image.url || image.altText;
    if (!keyToMatch) return;
    const updated = analysisStore.scrapedImages.map((img, idx) => {
      const key = img.id || img.url || img.altText || `${idx}`;
      if (key !== keyToMatch) return img;
      return { ...img, ignored: !img.ignored };
    });
    analysisStore.setScrapedImages(updated);
  };

  return {
    handleLoadProfile,
    handleRemoveScrapedImage,
  };
};
