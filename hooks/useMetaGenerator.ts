import { useCallback, useState } from 'react';
import { generateSnippet } from '../services/geminiService';
import { TargetAudience, CostBreakdown, TokenUsage, ProductBrief } from '../types';
import { promptRegistry } from '../services/promptRegistry';

interface MetaContext {
    keyPoints: string[];
    brandExclusivePoints: string[];
    productBrief?: ProductBrief | null;
    visualStyle?: string;
}

interface UseMetaGeneratorParams {
    editorRef: React.RefObject<HTMLDivElement>;
    targetAudience: TargetAudience;
    context: MetaContext;
    onAddCost?: (cost: CostBreakdown, usage: TokenUsage) => void;
}

export const useMetaGenerator = ({
    editorRef,
    targetAudience,
    context,
    onAddCost,
}: UseMetaGeneratorParams) => {
    const [metaTitle, setMetaTitle] = useState('');
    const [metaDescription, setMetaDescription] = useState('');
    const [urlSlug, setUrlSlug] = useState('');
    const [isMetaLoading, setIsMetaLoading] = useState(false);

    const generateMeta = useCallback(async () => {
        setIsMetaLoading(true);
        try {
            const articleText = (editorRef.current?.innerText || '').slice(0, 4000);
            const contextLines: string[] = [];
            if (context.keyPoints.length > 0) contextLines.push(`Key Points: ${context.keyPoints.slice(0, 6).join('; ')}`);
            if (context.brandExclusivePoints.length > 0) contextLines.push(`Brand USPs: ${context.brandExclusivePoints.slice(0, 4).join('; ')}`);
            if (context.productBrief?.brandName || context.productBrief?.productName) {
                contextLines.push(`Brand: ${context.productBrief?.brandName || ''} Product: ${context.productBrief?.productName || ''} USP: ${context.productBrief?.usp || ''}`);
            }
            if (context.visualStyle) contextLines.push(`Visual Style: ${context.visualStyle}`);

            const metaPrompt = promptRegistry.build('metaSeo', {
                targetAudience,
                contextLines,
                articlePreview: articleText,
            });

            const res = await generateSnippet(metaPrompt, targetAudience);
            let parsed: any = null;
            try {
                const cleaned = (res.data || '').replace(/```json|```/g, '');
                parsed = JSON.parse(cleaned);
            } catch (err) {
                console.warn('Meta JSON parse failed, raw text used', err);
            }
            if (parsed) {
                setMetaTitle(parsed.title || '');
                setMetaDescription(parsed.description || '');
                setUrlSlug(parsed.slug || '');
            }
            onAddCost?.(res.cost, res.usage);
        } catch (err) {
            console.error('Meta generation failed', err);
            alert('Failed to generate meta info. Please try again.');
        } finally {
            setIsMetaLoading(false);
        }
    }, [context.brandExclusivePoints, context.keyPoints, context.productBrief, context.visualStyle, editorRef, onAddCost, targetAudience]);

    return {
        metaTitle,
        metaDescription,
        urlSlug,
        setMetaTitle,
        setMetaDescription,
        setUrlSlug,
        isMetaLoading,
        generateMeta,
    };
};
