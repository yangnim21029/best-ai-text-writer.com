import { ScrapedImage } from '../types';

export const toggleImage = (images: ScrapedImage[], imageToToggle: ScrapedImage): ScrapedImage[] => {
    const keyToMatch = imageToToggle.id || imageToToggle.url || imageToToggle.altText;

    return images.map((img, idx) => {
        const key = img.id || img.url || img.altText || `${idx}`;
        if (key !== keyToMatch) return img;
        return { ...img, ignored: !img.ignored };
    });
};

export const getActiveImages = (images: ScrapedImage[]): ScrapedImage[] => {
    return images.filter(img => !img.ignored);
};
