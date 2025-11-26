import { useCallback, useState } from 'react';
import { TargetAudience, CostBreakdown, TokenUsage, ScrapedImage, ImageAssetPlan } from '../types';
import { generateImagePromptFromContext, generateImage, planImagesForArticle } from '../services/imageService';

interface UseImageEditorParams {
    editorRef: React.RefObject<HTMLDivElement>;
    tiptapApi?: {
        insertImage: (src: string, alt?: string) => void;
        getPlainText?: () => string;
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
    const [imagePrompt, setImagePrompt] = useState('');
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [isDownloadingImages, setIsDownloadingImages] = useState(false);
    const [imagePlans, setImagePlans] = useState<ImageAssetPlan[]>([]);
    const [isPlanning, setIsPlanning] = useState(false);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);

    const openImageModal = useCallback(async () => {
        saveSelection();
        setShowImageModal(true);
        setIsImageLoading(true);
        setImagePrompt('Analyzing context...');

        let contextText = '';
        if (tiptapApi?.getPlainText) {
            const text = tiptapApi.getPlainText();
            contextText = text.substring(0, 200);
        } else if (editorRef.current) {
            const fullText = editorRef.current.innerText;
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const preCaretRange = range.cloneRange();
                preCaretRange.selectNodeContents(editorRef.current);
                preCaretRange.setEnd(range.startContainer, range.startOffset);
                const startOffset = preCaretRange.toString().length;
                const start = Math.max(0, startOffset - 100);
                const end = Math.min(fullText.length, startOffset + 100);
                contextText = fullText.substring(start, end);
            } else {
                contextText = fullText.substring(0, 200);
            }
        }

        try {
            const res = await generateImagePromptFromContext(contextText, targetAudience, visualStyle || '');
            setImagePrompt(res.data);
            onAddCost?.(res.cost, res.usage);
        } catch (e) {
            setImagePrompt('Create a realistic image relevant to this article.');
        } finally {
            setIsImageLoading(false);
        }
    }, [editorRef, onAddCost, saveSelection, targetAudience, visualStyle]);

    const generateImageFromPrompt = useCallback(async (prompt: string) => {
        if (!prompt) return;
        setIsImageLoading(true);
        try {
            const res = await generateImage(prompt);
            if (res.data) {
                const imgHtml = `<img src="${res.data}" alt="${prompt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 20px 0;" /><br/>`;
                if (tiptapApi) {
                    tiptapApi.insertImage(res.data, prompt);
                } else {
                    restoreSelection();
                    document.execCommand('insertHTML', false, imgHtml);
                    if (editorRef.current) handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
                }
                onAddCost?.(res.cost, res.usage);
                setShowImageModal(false);
            } else {
                alert('Image generation returned no data.');
            }
        } catch (e) {
            console.error('Image generation error', e);
            alert('Failed to generate image.');
        } finally {
            setIsImageLoading(false);
        }
    }, [editorRef, handleInput, onAddCost, restoreSelection]);

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

    const updatePlanPrompt = useCallback((id: string, newPrompt: string) => {
        setImagePlans((prev) => prev.map((p) => (p.id === id ? { ...p, generatedPrompt: newPrompt } : p)));
    }, []);

    const injectImageIntoEditor = useCallback((plan: ImageAssetPlan, method: 'auto' | 'cursor' = 'auto') => {
        if (!plan.url) return;
        
        const imgHtml = `<img src="${plan.url}" alt="${plan.generatedPrompt}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 24px 0; display: block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />`;

        if (tiptapApi) {
            tiptapApi.insertImage(plan.url, plan.generatedPrompt);
            return;
        }

        if (!editorRef.current) return;

        const anchorText = plan.insertAfter || '';
        const currentHtml = editorRef.current.innerHTML;
        if (anchorText && currentHtml.includes(anchorText)) {
            const newHtml = currentHtml.replace(anchorText, `${anchorText}<br/>${imgHtml}`);
            editorRef.current.innerHTML = newHtml;
            handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
            return;
        }

        const chunks = anchorText.split(/[，,。.\n\t\s、：:]+/).filter((c) => c.length >= 4);
        chunks.sort((a, b) => b.length - a.length);
        for (const chunk of chunks) {
            if (currentHtml.includes(chunk)) {
                const newHtml = currentHtml.replace(chunk, `${chunk}<br/>${imgHtml}`);
                editorRef.current.innerHTML = newHtml;
                handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
                return;
            }
        }

        alert(`Could not find anchor: "...${anchorText.substring(0, 15)}...". \n\nPlease place your cursor in the text and click the "Cursor" button to insert manually.`);
    }, [editorRef, handleInput]);

    const generateSinglePlan = useCallback(async (plan: ImageAssetPlan) => {
        if (plan.status === 'generating') return;
        setImagePlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, status: 'generating' } : p)));
        try {
            const imgRes = await generateImage(plan.generatedPrompt);
            if (imgRes.data) {
                const updatedPlan = { ...plan, status: 'done' as const, url: imgRes.data || undefined };
                setImagePlans((prev) => prev.map((p) => (p.id === plan.id ? updatedPlan : p)));
                onAddCost?.(imgRes.cost, imgRes.usage);
            } else {
                setImagePlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, status: 'error' } : p)));
            }
        } catch (e) {
            console.error('Single generation failed', e);
            setImagePlans((prev) => prev.map((p) => (p.id === plan.id ? { ...p, status: 'error' } : p)));
        }
    }, [onAddCost]);

    const handleBatchProcess = useCallback(async () => {
        if (isBatchProcessing) return;
        setIsBatchProcessing(true);
        const plansToProcess = imagePlans.filter((p) => p.status !== 'done');
        const promises = plansToProcess.map((plan) => generateSinglePlan(plan));
        await Promise.all(promises);
        setIsBatchProcessing(false);
    }, [generateSinglePlan, imagePlans, isBatchProcessing]);

    const autoPlanImages = useCallback(async () => {
        const getContent = () => {
            if (tiptapApi?.getPlainText) return tiptapApi.getPlainText();
            return editorRef.current?.innerText || '';
        };
        if (isPlanning) return;
        setIsPlanning(true);
        try {
            const content = getContent();
            const res = await planImagesForArticle(content, scrapedImages, targetAudience, visualStyle || '');
            setImagePlans(res.data);
            onAddCost?.(res.cost, res.usage);
        } catch (e) {
            console.error('Auto-plan failed', e);
            alert('Failed to plan images.');
        } finally {
            setIsPlanning(false);
        }
    }, [editorRef, onAddCost, scrapedImages, targetAudience, visualStyle, isPlanning]);

    return {
        showImageModal,
        setShowImageModal,
        imagePrompt,
        setImagePrompt,
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
        injectImageIntoEditor,
        generateSinglePlan,
        handleBatchProcess,
    };
};
