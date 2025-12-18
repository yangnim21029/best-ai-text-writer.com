import React, { createContext, useContext, useMemo } from 'react';
import { useGenerationStore } from '@/store/useGenerationStore';
import { useAnalysisStore } from '@/store/useAnalysisStore';
import { useAppStore } from '@/store/useAppStore';
import { CostBreakdown, TokenUsage } from '../../types';

interface EditorContextValue {
    content: string;
    setContent: (value: string) => void;
    status: string;
    generationStep: string;
    error: string | null;
    targetAudience: any;
    keyPoints: string[];
    brandExclusivePoints: string[];
    checkedPoints: string[];
    scrapedImages: any[];
    visualStyle: string;
    productBrief: any;
    displayScale: number;
    articleTitle: string;
    outlineSections: string[];
    onTogglePoint: (point: string) => void;
    onRemoveScrapedImage: (img: any) => void;
    onAddCost: (cost: CostBreakdown, usage: TokenUsage) => void;
    setArticleTitle: (title: string) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const generation = useGenerationStore();
    const analysis = useAnalysisStore();
    const app = useAppStore();

    const value = useMemo<EditorContextValue>(() => {
        const structure = analysis.refAnalysis?.structure || [];
        const legacyGeneral = Array.isArray(analysis.refAnalysis?.keyInformationPoints)
            ? analysis.refAnalysis.keyInformationPoints
            : [];
        const legacyBrand = Array.isArray(analysis.refAnalysis?.brandExclusivePoints)
            ? analysis.refAnalysis.brandExclusivePoints
            : [];
        const general = new Set<string>();
        const brand = new Set<string>();
        legacyGeneral.forEach((p: string) => p && general.add(p));
        legacyBrand.forEach((p: string) => p && brand.add(p));
        structure.forEach((s: any) => {
            (Array.isArray(s?.keyFacts) ? s.keyFacts : []).forEach((p: string) => p && general.add(p));
            (Array.isArray(s?.uspNotes) ? s.uspNotes : []).forEach((p: string) => p && brand.add(p));
        });

        return {
            content: generation.content,
            setContent: (val) => generation.setContent(val),
            status: generation.status,
            generationStep: generation.generationStep,
            error: generation.error,
            targetAudience: analysis.targetAudience,
            keyPoints: Array.from(general),
            brandExclusivePoints: Array.from(brand),
            checkedPoints: analysis.coveredPoints,
            scrapedImages: analysis.scrapedImages,
            visualStyle: analysis.visualStyle,
            productBrief: analysis.activeProductBrief,
            displayScale: app.displayScale,
            articleTitle: analysis.articleTitle,
            outlineSections: analysis.refAnalysis?.structure?.map(s => s.title) || [],
            onTogglePoint: (point: string) => analysis.setCoveredPoints(prev => prev.includes(point) ? prev.filter(p => p !== point) : [...prev, point]),
            onRemoveScrapedImage: (img) => analysis.setScrapedImages(analysis.scrapedImages.map(existing => {
                const key = existing.id || existing.url;
                const match = img.id || img.url;
                if (key && key === match) return { ...existing, ignored: !existing.ignored };
                return existing;
            })),
            onAddCost: (cost, usage) => app.addCost(cost?.totalCost || 0, usage?.totalTokens || 0),
            setArticleTitle: analysis.setArticleTitle,
        };
    }, [analysis, generation, app.addCost, app.displayScale]);

    return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
};

export const useEditorContext = () => {
    const ctx = useContext(EditorContext);
    if (!ctx) throw new Error('useEditorContext must be used within EditorProvider');
    return ctx;
};

export const useOptionalEditorContext = () => useContext(EditorContext);
