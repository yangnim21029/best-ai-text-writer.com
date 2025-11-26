import { useCallback, useRef } from 'react';
import { marked } from 'marked';
import { generateSnippet } from '../services/contentGenerationService';
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
    clearHighlight: () => void;
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
    const askAiRangeRef = useRef<{ from: number; to: number } | null>(null);
    const lastActionModeRef = useRef<AskAiMode | null>(null);

    const clearAskAiState = useCallback(() => {
        tiptapApi?.clearHighlight?.();
        askAiRangeRef.current = null;
        lastActionModeRef.current = null;
    }, [tiptapApi]);

    const buildAskAiPrompt = useCallback((input: AskAiRunActionInput, text: string) => {
        if (input.mode === 'format') {
            switch (input.preset) {
                case 'bullet':
                    return `TARGET CONTENT: """${text}"""\nTASK: Convert to a bullet list. Return ONLY the formatted HTML/Markdown.`;
                case 'ordered':
                    return `TARGET CONTENT: """${text}"""\nTASK: Convert to an ordered (numbered) list. Return ONLY the formatted HTML/Markdown.`;
                case 'table-2':
                    return `TARGET CONTENT: """${text}"""\nTASK: Present as a 2-column table (Header + Row values). Return ONLY the table HTML/Markdown.`;
                case 'table-3':
                    return `TARGET CONTENT: """${text}"""\nTASK: Present as a 3-column table (Header + Row values). Return ONLY the table HTML/Markdown.`;
                case 'checklist':
                    return `TARGET CONTENT: """${text}"""\nTASK: Convert to a checklist with unchecked boxes. Return ONLY the formatted HTML/Markdown.`;
                case 'quote':
                    return `TARGET CONTENT: """${text}"""\nTASK: Wrap as a highlighted quote block. Return ONLY the formatted HTML/Markdown.`;
                case 'markdown-clean':
                    return `TARGET CONTENT: """${text}"""\nTASK: Clean up Markdown/HTML, fix nesting, and keep structure minimal. Return ONLY the cleaned HTML/Markdown.`;
                default:
                    return `TARGET CONTENT: """${text}"""\nTASK: Reformat cleanly. Return ONLY the HTML/Markdown.`;
            }
        }

        const presetInstruction = (() => {
            switch (input.preset) {
                case 'rephrase':
                    return 'Rephrase for clarity while keeping meaning.';
                case 'shorten':
                    return 'Make the text noticeably shorter but keep core meaning.';
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

        return `TARGET TEXT: """${text}"""\nINSTRUCTION: ${presetInstruction}${input.prompt ? `\nCUSTOM PROMPT: ${input.prompt}` : ''}\nTASK: Return ONLY the rewritten result in HTML/Markdown.`;
    }, []);

    const runAskAiAction = useCallback(async (input: AskAiRunActionInput) => {
        if (!tiptapApi) {
            alert('Editor not ready.');
            throw new Error('Editor not ready');
        }
        const selectionRange = tiptapApi.getSelectionRange?.() || null;
        lastActionModeRef.current = input.mode;
        askAiRangeRef.current = selectionRange;
        const selectedText = (tiptapApi.getSelectedText?.() || input.selectedText || '').trim();
        if (!selectedText) {
            alert('請先選取要調整的文字。');
            throw new Error('No selection');
        }
        if (selectionRange) {
            tiptapApi.highlightRange?.(selectionRange);
        }
        const promptToSend = buildAskAiPrompt(input, selectedText);

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
            setIsAiLoading(false);
        }
    }, [buildAskAiPrompt, onAddCost, setIsAiLoading, targetAudience, tiptapApi]);

    const handleAskAiInsert = useCallback((html: string) => {
        if (!tiptapApi) return;
        const selectionRange = askAiRangeRef.current || tiptapApi.getSelectionRange?.();
        const mode = lastActionModeRef.current;
        if (selectionRange) {
            tiptapApi.replaceRange(selectionRange, html);
        } else {
            tiptapApi.insertHtml(html);
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
    };
};
