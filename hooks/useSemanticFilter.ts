import { useState, useCallback } from 'react';
import { embedTexts, cosineSimilarity } from '../services/engine/embeddingService';

const DEFAULT_SEMANTIC_THRESHOLD = 0.79;

const splitIntoBlankLineChunks = (content: string): string[] =>
    content
        .split(/\n\s*\n+/)
        .map(chunk => chunk.trim())
        .filter(Boolean);

export const useSemanticFilter = () => {
    const [isChunkModalOpen, setIsChunkModalOpen] = useState(false);
    const [chunkPreview, setChunkPreview] = useState<string[]>([]);
    const [isFilteringChunks, setIsFilteringChunks] = useState(false);
    const [filterError, setFilterError] = useState<string | null>(null);
    const [chunkScores, setChunkScores] = useState<number[]>([]);
    const [isScoringChunks, setIsScoringChunks] = useState(false);
    const [manualKeep, setManualKeep] = useState<Record<number, boolean>>({});
    const [semanticThreshold, setSemanticThreshold] = useState<number>(DEFAULT_SEMANTIC_THRESHOLD);
    const [semanticThresholdInput, setSemanticThresholdInput] = useState<string>(DEFAULT_SEMANTIC_THRESHOLD.toString());

    const commitSemanticThreshold = useCallback((raw?: string) => {
        const candidate = (typeof raw === 'string' ? raw : semanticThresholdInput).trim();
        if (candidate === '') {
            setSemanticThresholdInput(semanticThreshold.toString());
            return semanticThreshold;
        }

        const parsed = parseFloat(candidate);
        if (Number.isNaN(parsed)) {
            setSemanticThresholdInput(semanticThreshold.toString());
            return semanticThreshold;
        }

        const clamped = Math.min(1, Math.max(0, parsed));
        const normalized = Math.round(clamped * 100) / 100;
        setSemanticThreshold(normalized);
        setSemanticThresholdInput(normalized.toString());
        return normalized;
    }, [semanticThresholdInput, semanticThreshold]);

    const scoreChunks = useCallback(async (chunks: string[], title: string) => {
        if (!title) {
            setFilterError('請先填寫標題，再計算語意距離。');
            return null;
        }

        setIsScoringChunks(true);
        setFilterError(null);

        try {
            const [titleEmbeddings, chunkEmbeddings] = await Promise.all([
                embedTexts([title]),
                embedTexts(chunks),
            ]);

            const titleEmbedding = titleEmbeddings[0];
            if (!titleEmbedding?.length) {
                throw new Error('無法取得標題向量，請稍後再試。');
            }

            const similarities = chunks.map((chunk, idx) => {
                const chunkEmbedding = chunkEmbeddings[idx];
                if (!chunkEmbedding?.length) return 1;
                return cosineSimilarity(titleEmbedding, chunkEmbedding);
            });

            setChunkScores(similarities);
            return similarities;
        } catch (error: any) {
            setFilterError(error?.message || '語意過濾失敗，請稍後再試。');
            return null;
        } finally {
            setIsScoringChunks(false);
        }
    }, []);

    const openFilterModal = useCallback((content: string, title: string) => {
        const chunks = splitIntoBlankLineChunks(content);
        if (!chunks.length) {
            alert('找不到可以分段的內容（需有空白行分隔）。');
            return;
        }

        setChunkPreview(chunks);
        setFilterError(null);
        setChunkScores([]);
        setManualKeep({});
        setIsChunkModalOpen(true);
        void scoreChunks(chunks, title);
    }, [scoreChunks]);

    const applyFilter = useCallback(async (content: string, title: string): Promise<string | null> => {
        const chunks = chunkPreview.length ? chunkPreview : splitIntoBlankLineChunks(content);
        if (!chunks.length) {
            setFilterError('找不到可用的段落。');
            return null;
        }

        setIsFilteringChunks(true);
        setFilterError(null);

        try {
            const existingScores = (chunkScores.length === chunks.length) ? chunkScores : null;
            const computedScores = existingScores || (await scoreChunks(chunks, title)) || [];

            if (!computedScores.length) {
                setFilterError('無法取得語意距離，請確認標題與 API 設定。');
                return null;
            }

            const keptChunks = chunks.filter((chunk, idx) => {
                const similarity = computedScores[idx] ?? 1;
                const forcedKeep = manualKeep[idx];
                return forcedKeep || similarity >= semanticThreshold;
            });

            const filteredContent = keptChunks.join('\n\n').trim();
            setIsChunkModalOpen(false);
            return filteredContent;
        } catch (error: any) {
            setFilterError(error?.message || '語意過濾失敗，請稍後再試。');
            return null;
        } finally {
            setIsFilteringChunks(false);
        }
    }, [chunkPreview, chunkScores, manualKeep, scoreChunks, semanticThreshold]);

    return {
        isChunkModalOpen,
        setIsChunkModalOpen,
        chunkPreview,
        chunkScores,
        isScoringChunks,
        isFilteringChunks,
        filterError,
        manualKeep,
        setManualKeep,
        openFilterModal,
        applyFilter,
        semanticThreshold,
        semanticThresholdInput,
        setSemanticThresholdInput,
        commitSemanticThreshold,
        DEFAULT_SEMANTIC_THRESHOLD
    };
};
