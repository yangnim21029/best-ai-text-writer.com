import { useCallback, useRef } from 'react';
import { marked } from 'marked';
import { generateSnippet } from '../services/contentGenerationService';
import { getLanguageInstruction } from '../services/promptService';
import type { AskAiRunActionInput } from '../components/AskAiSelection';
import { TargetAudience, CostBreakdown, TokenUsage } from '../types';

type AskAiMode = 'edit' | 'format';

type TiptapApi = {
    getSelectedText: () => string;
    insertHtml: (html: string) => void;
    getPlainText: () => string;
    getHtml: () => string;
    setHtml: (html: string) => void;
    getSelectionRange: () => { from: number; to: number };
    replaceRange: (range: { from: number; to: number }, html: string) => void;
    markAskAiRange: (range: { from: number; to: number }, taskId: string) => void;
    clearAskAiMarks: (taskId?: string) => void;
    findAskAiRange: (taskId: string) => { from: number; to: number } | null;
};

interface UseAskAiParams {
    tiptapApi: TiptapApi | null;
    targetAudience: TargetAudience;
    onAddCost?: (cost: CostBreakdown, usage: TokenUsage) => void;
    setIsAiLoading: (loading: boolean) => void;
    updateCountsFromText: (text: string) => void;
    onChange?: (html: string) => void;
}

export const useAskAi = ({
    tiptapApi,
    targetAudience,
    onAddCost,
    setIsAiLoading,
    updateCountsFromText,
    onChange,
}: UseAskAiParams) => {
    const askAiRangesRef = useRef<Record<string, { from: number; to: number }>>({});
    const lastRangeRef = useRef<{ from: number; to: number } | null>(null);
    const lastActionModeRef = useRef<AskAiMode | null>(null);
    const pendingCountRef = useRef(0);

    const clearAskAiState = useCallback(() => {
        // Keep other task highlights; only clear generic marks if no task is specified.
        lastActionModeRef.current = null;
    }, [tiptapApi]);

    const buildAskAiPrompt = useCallback((input: AskAiRunActionInput, text: string) => {
        const languageInstruction = getLanguageInstruction(targetAudience);

        if (input.mode === 'format') {
            let task = '';
            switch (input.preset) {
                case 'bullet':
                    task = 'Convert to a bullet list.';
                    break;
                case 'ordered':
                    task = 'Convert to an ordered (numbered) list.';
                    break;
                case 'table-2':
                    task = 'Present as a 2-column table (Header + Row values).';
                    break;
                case 'table-3':
                    task = 'Present as a 3-column table (Header + Row values).';
                    break;
                case 'checklist':
                    task = 'Convert to a checklist with unchecked boxes.';
                    break;
                case 'quote':
                    task = 'Wrap as a highlighted quote block.';
                    break;
                case 'markdown-clean':
                    task = 'Clean up Markdown/HTML, fix nesting, and keep structure minimal.';
                    break;
                default:
                    task = 'Reformat cleanly.';
            }
            return `TARGET CONTENT: """${text}"""\nTASK: ${task} Return ONLY the formatted HTML/Markdown.\n\n${languageInstruction}`;
        }

        const presetInstruction = (() => {
            switch (input.preset) {
                case 'rephrase':
                    return 'Rephrase for clarity while keeping meaning. Ensure the tone is natural and professional.';
                case 'shorten':
                    return 'CRITICAL: Condense the text by 30-50%. Remove all fluff, redundancy, and filler words. Keep ONLY the core message.';
                case 'elaborate':
                    return 'Expand with 1-2 concise sentences to add clarity.';
                case 'formal':
                    return 'Rewrite in a more formal tone.';
                case 'casual':
                    return 'Rewrite in a friendlier, more casual tone.';
                case 'bulletise':
                    return 'Convert into concise bullet points.';
                case 'summarise':
                    return 'Summarise into a brief paragraph or 2 bullets.';
                default:
                    return input.prompt || 'Improve the text with better flow.';
            }
        })();

        return `TARGET TEXT: """${text}"""\nINSTRUCTION: ${presetInstruction}${input.prompt ? `\nCUSTOM PROMPT: ${input.prompt}` : ''}\n\n${languageInstruction}\n\nTASK: Return ONLY the rewritten result in HTML/Markdown.`;
    }, [targetAudience]);

    const lockAskAiRange = useCallback((taskId?: string) => {
        if (!tiptapApi) return null;
        const selectionRange = tiptapApi.getSelectionRange?.() || null;
        if (selectionRange) {
            lastRangeRef.current = selectionRange;
            if (taskId) {
                askAiRangesRef.current[taskId] = selectionRange;
                tiptapApi.markAskAiRange?.(selectionRange, taskId);
            }
        }
        return selectionRange;
    }, [tiptapApi]);

    const runAskAiAction = useCallback(async (input: AskAiRunActionInput) => {
        if (!tiptapApi) {
            alert('Editor not ready.');
            throw new Error('Editor not ready');
        }
        const selectionRange =
            (input.taskId ? tiptapApi.findAskAiRange?.(input.taskId) : null) ||
            (input.taskId ? askAiRangesRef.current[input.taskId] : null) ||
            lastRangeRef.current ||
            tiptapApi.getSelectionRange?.() ||
            null;
        lastActionModeRef.current = input.mode;
        if (selectionRange) {
            lastRangeRef.current = selectionRange;
            if (input.taskId) {
                askAiRangesRef.current[input.taskId] = selectionRange;
            }
        }
        const selectedText = (input.selectedText || tiptapApi.getSelectedText?.() || '').trim();
        if (!selectedText) {
            alert('請先選取要調整的文字。');
            throw new Error('No selection');
        }
        if (selectionRange && input.taskId) {
            tiptapApi.markAskAiRange?.(selectionRange, input.taskId);
        }
        const promptToSend = buildAskAiPrompt(input, selectedText);

        pendingCountRef.current += 1;
        setIsAiLoading(true);
        try {
            const res = await generateSnippet(promptToSend, targetAudience as TargetAudience);
            const htmlSnippet = marked.parse(res.data || '', { async: false }) as string;
            onAddCost?.(res.cost, res.usage);
            return htmlSnippet;
        } catch (error) {
            console.error("AI Edit failed", error);
            alert("Failed to generate content. Please try again.");
            throw error;
        } finally {
            pendingCountRef.current = Math.max(0, pendingCountRef.current - 1);
            setIsAiLoading(pendingCountRef.current > 0);
        }
    }, [buildAskAiPrompt, onAddCost, setIsAiLoading, targetAudience, tiptapApi]);

    const handleAskAiInsert = useCallback((html: string, taskId?: string) => {
        if (!tiptapApi) return;
        const selectionRange =
            (taskId ? tiptapApi.findAskAiRange?.(taskId) : null) ||
            (taskId ? askAiRangesRef.current[taskId] : null) ||
            lastRangeRef.current ||
            tiptapApi.getSelectionRange?.();
        const mode = lastActionModeRef.current;
        if (selectionRange) {
            tiptapApi.replaceRange(selectionRange, html);
        } else {
            tiptapApi.insertHtml(html);
        }
        if (taskId) {
            delete askAiRangesRef.current[taskId];
            tiptapApi.clearAskAiMarks?.(taskId);
        }
        clearAskAiState();
        const updatedText = tiptapApi.getPlainText();
        updateCountsFromText(updatedText);
        onChange?.(tiptapApi.getHtml());
    }, [clearAskAiState, onChange, tiptapApi, updateCountsFromText]);

    return {
        runAskAiAction,
        handleAskAiInsert,
        clearAskAiState,
        lockAskAiRange,
        highlightAskAiTarget: (taskId: string) => {
            const range = tiptapApi?.findAskAiRange?.(taskId);
            if (range) {
                tiptapApi?.markAskAiRange?.(range, taskId);
            }
        },
    };
};
