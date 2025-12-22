import { useCallback, useState } from 'react';
import { generateSnippet } from '../services/generation/contentGenerationService';
import { TargetAudience, CostBreakdown, TokenUsage, ProductBrief } from '../types';
import { promptTemplates } from '../services/engine/promptTemplates';
import { Type } from '../services/engine/schemaTypes';
import { aiService } from '../services/engine/aiService';

interface MetaContext {
  keyPoints: string[];
  brandExclusivePoints: string[];
  productBrief?: ProductBrief | null;
  visualStyle?: string;
  outlineSections?: string[];
}

interface UseMetaGeneratorParams {
  editorRef: React.RefObject<HTMLDivElement>;
  tiptapApi?: { getPlainText: () => string } | null;
  targetAudience: TargetAudience;
  context: MetaContext;
  onAddCost?: (cost: CostBreakdown, usage: TokenUsage) => void;
  onMetaGenerated?: (meta: { title: string; description: string; slug: string }) => void;
}

export const useMetaGenerator = ({
  editorRef,
  tiptapApi,
  targetAudience,
  context,
  onAddCost,
  onMetaGenerated,
}: UseMetaGeneratorParams) => {
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [urlSlug, setUrlSlug] = useState('');
  const [isMetaLoading, setIsMetaLoading] = useState(false);

  const generateMeta = useCallback(async () => {
    setIsMetaLoading(true);
    try {
      const articleText = (
        tiptapApi?.getPlainText ? tiptapApi.getPlainText() : editorRef.current?.innerText || ''
      ).slice(0, 1000);
      const contextLines: string[] = [];
      if (context.keyPoints.length > 0)
        contextLines.push(`Key Points: ${context.keyPoints.slice(0, 6).join('; ')} `);
      if (context.brandExclusivePoints.length > 0)
        contextLines.push(`Brand USPs: ${context.brandExclusivePoints.slice(0, 4).join('; ')} `);
      if (context.productBrief?.brandName || context.productBrief?.productName) {
        contextLines.push(
          `Brand: ${context.productBrief?.brandName || ''} Product: ${context.productBrief?.productName || ''} USP: ${context.productBrief?.usp || ''} `
        );
      }
      if (context.visualStyle) contextLines.push(`Visual Style: ${context.visualStyle} `);
      if (context.outlineSections && context.outlineSections.length > 0) {
        const outlinePreview = context.outlineSections.slice(0, 8).join(' > ');
        contextLines.push(`Outline: ${outlinePreview} `);
      }

      const metaPrompt = promptTemplates.metaSeo({
        targetAudience,
        contextLines,
        articlePreview: articleText,
      });

      const res = await generateSnippet(metaPrompt, targetAudience, {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            slug: { type: Type.STRING },
          },
        },
        // Force JSON and minimal verbosity
        generationConfig: {
          response_mime_type: 'application/json',
        },
      });

      const parsed = JSON.parse(res.data || '{}');
      const title = parsed.title || metaTitle || '';
      const description = parsed.description || metaDescription || '';
      const slug =
        parsed.slug ||
        metaTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') ||
        '';
      setMetaTitle(title);
      setMetaDescription(description);
      setUrlSlug(slug);
      onMetaGenerated?.({ title, description, slug });
      onAddCost?.(res.cost, res.usage);
    } catch (err) {
      console.error('Meta generation failed', err);
      alert('Failed to generate meta info. Please try again.');
    } finally {
      setIsMetaLoading(false);
    }
  }, [
    context.brandExclusivePoints,
    context.keyPoints,
    context.productBrief,
    context.visualStyle,
    context.outlineSections,
    editorRef,
    onAddCost,
    onMetaGenerated,
    targetAudience,
  ]);

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
