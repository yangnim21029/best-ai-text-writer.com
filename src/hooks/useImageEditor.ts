import { useCallback, useState, useEffect, useRef } from 'react';
import { TargetAudience, CostBreakdown, TokenUsage, ScrapedImage, ImageAssetPlan } from '../types';
import {
  generateImagePromptFromContext,
  generateImage,
  planImagesForArticle,
} from '../services/generation/imageService';
import { useAppStore } from '../store/useAppStore';
import { useGenerationStore } from '../store/useGenerationStore';
import { compressImage } from '../utils/imageUtils';
import { saveImageToCache, getImageFromCache, deleteImageFromCache } from '../utils/storage/db';

interface UseImageEditorParams {
  editorRef: React.RefObject<HTMLDivElement>;
  tiptapApi?: {
    insertImage: (src: string, alt?: string) => void;
    getPlainText?: () => string;
    getHtml?: () => string;
    setHtml?: (html: string) => void;
    insertHtml?: (html: string) => void;
    getSelectionRange?: () => { from: number; to: number };
  };
  imageContainerRef?: React.RefObject<HTMLElement>;
  targetAudience: TargetAudience;
  visualStyle?: string;
  scrapedImages: ScrapedImage[];
  onAddCost?: (cost: CostBreakdown, usage: TokenUsage) => void;
  handleInput: (e: React.FormEvent<HTMLDivElement>) => void;
  saveSelection: () => Range | null;
  restoreSelection: () => void;
}

export const useImageEditor = ({
  editorRef,
  tiptapApi,
  imageContainerRef,
  targetAudience,
  visualStyle,
  scrapedImages,
  onAddCost,
  handleInput,
  saveSelection,
  restoreSelection,
}: UseImageEditorParams) => {
  const [showImageModal, setShowImageModal] = useState(false);
  const [imagePrompts, setImagePrompts] = useState<string[]>([]);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [isDownloadingImages, setIsDownloadingImages] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  const {
    imageAssetPlans: imagePlans,
    setImageAssetPlans: setImagePlans,
    updateImageAssetPlan: updatePlanPromptStore,
    deleteImageAssetPlan: deletePlanStore,
    status: generationStatus,
    setStatus,
  } = useGenerationStore();

  const isPlanning = generationStatus === 'analyzing' || generationStatus === 'planning_visuals';
  const isBatchProcessing = generationStatus === 'streaming';

  const updatePlanPrompt = useCallback(
    (id: string, updates: Partial<ImageAssetPlan>) => {
      updatePlanPromptStore(id, updates);
    },
    [updatePlanPromptStore]
  );

  const deletePlan = useCallback(
    async (id: string) => {
      deletePlanStore(id);
      await deleteImageFromCache(id);
    },
    [deletePlanStore]
  );

  // Local session style overrides
  const { defaultModelAppearance, defaultDesignStyle } = useAppStore();
  const [localModelAppearance, setLocalModelAppearance] = useState(defaultModelAppearance);
  const [localDesignStyle, setLocalDesignStyle] = useState(defaultDesignStyle);
  const hasHydratedImages = useRef(false);

  // HYDRATION: Load cached images from IndexedDB when plans become available
  useEffect(() => {
    if (hasHydratedImages.current || imagePlans.length === 0) return;

    const hydrate = async () => {
      const needsHydration = imagePlans.some((p) => p.status === 'done' && !p.url);
      if (!needsHydration) {
        hasHydratedImages.current = true;
        return;
      }

      const updatedPlans = await Promise.all(
        imagePlans.map(async (p) => {
          if (p.status === 'done' && !p.url) {
            const cached = await getImageFromCache(p.id);
            if (cached) return { ...p, url: cached };
          }
          return p;
        })
      );

      const changed = updatedPlans.some((p, idx) => p.url !== imagePlans[idx].url);
      if (changed) {
        setImagePlans(updatedPlans);
      }
      hasHydratedImages.current = true;
    };

    hydrate();
  }, [imagePlans.length, setImagePlans]); // Re-run if plans length changes (e.g. initial load)

  // Sync from store when they change (if needed)
  useEffect(() => {
    setLocalModelAppearance(defaultModelAppearance);
  }, [defaultModelAppearance]);

  useEffect(() => {
    setLocalDesignStyle(defaultDesignStyle);
  }, [defaultDesignStyle]);

  const openImageModal = useCallback(async () => {
    const { defaultModelAppearance } = useAppStore.getState();
    saveSelection();
    setShowImageModal(true);
    setIsImageLoading(true);
    setImagePrompts(['Analyzing context...']);

    let contextText = '';
    if (tiptapApi?.getPlainText) {
      const text = tiptapApi.getPlainText();
      const { from } = tiptapApi.getSelectionRange();
      const start = Math.max(0, from - 500);
      const end = Math.min(text.length, from + 500);
      contextText = text.substring(start, end);
    } else if (editorRef.current) {
      const fullText = editorRef.current.innerText;
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editorRef.current);
        preCaretRange.setEnd(range.startContainer, range.startOffset);
        const startOffset = preCaretRange.toString().length;
        const start = Math.max(0, startOffset - 500);
        const end = Math.min(fullText.length, startOffset + 500);
        contextText = fullText.substring(start, end);
      } else {
        contextText = fullText.substring(0, 500);
      }
    }

    try {
      const res = await generateImagePromptFromContext(
        contextText,
        targetAudience,
        visualStyle || '',
        defaultModelAppearance
      );
      setImagePrompts(res.data);
      onAddCost?.(res.cost, res.usage);
    } catch (e) {
      setImagePrompts(['Create a realistic image relevant to this article.']);
    } finally {
      setIsImageLoading(false);
    }
  }, [editorRef, onAddCost, saveSelection, targetAudience, visualStyle, tiptapApi]);

  const generateImageFromPrompt = useCallback(
    async (prompt: string) => {
      if (!prompt) return;

      const anchorId = Math.random().toString(36).substring(2, 9);
      const anchorText = `[Generating Image... id:${anchorId}]`;
      const anchorHtml = `<p id="anchor-${anchorId}" style="color: #db2777; font-weight: bold; padding: 12px; background: #fdf2f8; border-radius: 12px; border: 2px dashed #f9a8d4; text-align: center; margin: 20px 0;">${anchorText}</p>`;

      if (tiptapApi) {
        tiptapApi.insertHtml(anchorHtml);
      } else {
        restoreSelection();
        document.execCommand('insertHTML', false, anchorHtml);
      }

      setShowImageModal(false);
      setIsImageLoading(false); // Modal loading is done, but image generation is background

      try {
        const res = await generateImage(prompt);
        if (res.data) {
          const imgHtml = `<img src="${res.data}" alt="${prompt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" /><br/>`;

          const replaceAnchor = (html: string) => {
            const target = `id="anchor-${anchorId}"`;
            if (html.includes(target)) {
              // Find the whole <p> tag containing this ID
              const regex = new RegExp(`<p[^>]*${target}[^>]*>.*?</p>`, 'i');
              return html.replace(regex, imgHtml);
            }
            return html + imgHtml;
          };

          if (tiptapApi && tiptapApi.getHtml && tiptapApi.setHtml) {
            const currentHtml = tiptapApi.getHtml();
            tiptapApi.setHtml(replaceAnchor(currentHtml));
          } else if (editorRef.current) {
            editorRef.current.innerHTML = replaceAnchor(editorRef.current.innerHTML);
            handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
          }

          onAddCost?.(res.cost, res.usage);
        } else {
          alert('Image generation returned no data.');
        }
      } catch (e) {
        console.error('Image generation error', e);
        alert('Failed to generate image.');
      }
    },
    [editorRef, handleInput, onAddCost, restoreSelection, tiptapApi]
  );

  const downloadImages = useCallback(async () => {
    const container = imageContainerRef?.current || editorRef.current || document.body;
    const images = container.querySelectorAll('img');
    if (images.length === 0) {
      alert('No images found in the editor to download.');
      return;
    }
    if (!confirm(`Found ${images.length} images in the article. Download them now?`)) return;

    setIsDownloadingImages(true);
    const downloadLink = document.createElement('a');
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);

    try {
      for (let i = 0; i < images.length; i++) {
        const img = images[i] as HTMLImageElement;
        const src = img.src;
        const ext = src.includes('image/jpeg') ? 'jpg' : 'png';
        const filename = `article-image-${Date.now()}-${i + 1}.${ext}`;

        if (src.startsWith('data:')) {
          downloadLink.href = src;
          downloadLink.download = filename;
          downloadLink.click();
        } else {
          try {
            const response = await fetch(src);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            downloadLink.href = url;
            downloadLink.download = filename;
            downloadLink.click();
            URL.revokeObjectURL(url);
          } catch (err) {
            console.warn(`Failed to download ${src}, opening in new tab instead.`);
            window.open(src, '_blank');
          }
        }
        await new Promise((r) => setTimeout(r, 200));
      }
    } catch (e) {
      console.error('Download failed', e);
      alert('Some images could not be downloaded.');
    } finally {
      document.body.removeChild(downloadLink);
      setIsDownloadingImages(false);
    }
  }, [editorRef]);

  const injectImageIntoEditor = useCallback(
    (plan: ImageAssetPlan, method: 'auto' | 'cursor' = 'auto') => {
      if (!plan.url) return;

      const imgHtml = `<img src="${plan.url}" alt="${plan.generatedPrompt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 24px 0; display: block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />`;
      const anchorText = plan.insertAfter?.trim() || '';
      const tryInjectByAnchor = (html: string, replaceFn: (nextHtml: string) => void) => {
        const insertAt = (target: string) => {
          if (!target || !html.includes(target)) return false;
          replaceFn(html.replace(target, `${target}<br/>${imgHtml}`));
          return true;
        };

        if (insertAt(anchorText)) return true;

        const chunks = anchorText
          .split(/[，,。.\n\t\s、：:]+/)
          .filter((c) => c.length >= 4)
          .sort((a, b) => b.length - a.length);

        for (const chunk of chunks) {
          if (insertAt(chunk)) return true;
        }
        return false;
      };

      if (tiptapApi) {
        const insertAtSelection = () => tiptapApi.insertImage(plan.url!, plan.generatedPrompt);

        if (method === 'cursor' || !anchorText || !tiptapApi.getHtml || !tiptapApi.setHtml) {
          insertAtSelection();
          return;
        }

        const html = tiptapApi.getHtml();
        const injected = tryInjectByAnchor(html, (nextHtml) => tiptapApi.setHtml!(nextHtml));
        if (!injected) {
          insertAtSelection();
        }
        return;
      }

      if (!editorRef.current) return;

      if (method === 'cursor') {
        restoreSelection();
        document.execCommand('insertHTML', false, imgHtml);
        handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
        return;
      }

      const currentHtml = editorRef.current.innerHTML;
      const injected = tryInjectByAnchor(currentHtml, (nextHtml) => {
        editorRef.current!.innerHTML = nextHtml;
        handleInput({ currentTarget: editorRef.current! } as React.FormEvent<HTMLDivElement>);
      });

      if (!injected) {
        alert(
          `Could not find anchor: "...${anchorText.substring(0, 15)}...". \n\nPlease place your cursor in the text and click the "Cursor" button to insert manually.`
        );
      }
    },
    [editorRef, handleInput, restoreSelection, tiptapApi]
  );

  const generateSinglePlan = useCallback(
    async (plan: ImageAssetPlan) => {
      if (plan.status === 'generating') return;
      setImagePlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, status: 'generating' } : p))
      );
      try {
        // Consolidate prompt with styles
        let finalPrompt = plan.generatedPrompt;
        if (plan.category === 'BRANDED_LIFESTYLE' || plan.category === 'PRODUCT_DETAIL') {
          finalPrompt += `, ${localModelAppearance}`;
        } else if (plan.category === 'INFOGRAPHIC' || plan.category === 'PRODUCT_INFOGRAPHIC') {
          finalPrompt += `, style: ${localDesignStyle}`;
        }

        const imgRes = await generateImage(finalPrompt);
        if (imgRes.data) {
          // COMPRESSION & CACHING
          const compressed = await compressImage(imgRes.data);
          await saveImageToCache(plan.id, compressed);

          const updatedPlan = { ...plan, status: 'done' as const, url: compressed };
          updatePlanPrompt(plan.id, updatedPlan);
          onAddCost?.(imgRes.cost, imgRes.usage);
        } else {
          updatePlanPrompt(plan.id, { status: 'error' });
        }
      } catch (e) {
        console.error('Single generation failed', e);
        updatePlanPrompt(plan.id, { status: 'error' });
      }
    },
    [onAddCost, localModelAppearance, localDesignStyle, updatePlanPrompt]
  );

  const handleBatchProcess = useCallback(async () => {
    if (isBatchProcessing) return;
    setStatus('streaming');
    const plansToProcess = imagePlans.filter((p) => p.status !== 'done');
    const promises = plansToProcess.map((plan) => generateSinglePlan(plan));
    await Promise.all(promises);
    setStatus('completed');
  }, [generateSinglePlan, imagePlans, isBatchProcessing, setStatus]);

  const autoPlanImages = useCallback(async () => {
    const getContent = () => {
      if (tiptapApi?.getPlainText) return tiptapApi.getPlainText();
      return editorRef.current?.innerText || '';
    };
    if (isPlanning) return;
    setStatus('planning_visuals');
    try {
      const content = getContent();
      const res = await planImagesForArticle(
        content,
        scrapedImages,
        targetAudience,
        visualStyle || ''
      );
      setImagePlans(res.data);
      onAddCost?.(res.cost, res.usage);
      setStatus('analysis_ready');
    } catch (e) {
      console.error('Auto-plan failed', e);
      alert('Failed to plan images.');
      setStatus('error');
    }
  }, [
    editorRef,
    onAddCost,
    scrapedImages,
    targetAudience,
    visualStyle,
    isPlanning,
    setStatus,
    setImagePlans,
  ]);

  return {
    showImageModal,
    setShowImageModal,
    imagePrompts,
    setImagePrompts,
    isImageLoading,
    isDownloadingImages,
    imagePlans,
    isPlanning,
    isBatchProcessing,
    openImageModal,
    generateImageFromPrompt,
    downloadImages,
    autoPlanImages,
    updatePlanPrompt,
    deletePlan,
    injectImageIntoEditor,
    generateSinglePlan,
    handleBatchProcess,
    showBatchModal,
    setShowBatchModal,
    localModelAppearance,
    setLocalModelAppearance,
    localDesignStyle,
    setLocalDesignStyle,
  };
};
