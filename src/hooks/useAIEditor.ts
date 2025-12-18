import { useCallback } from 'react';
import { marked } from 'marked';
import { TargetAudience, CostBreakdown, TokenUsage } from '../types';
import { generateSnippet, smartInjectPoint } from '../services/generation/contentGenerationService';

interface UseAIEditorParams {
    editorRef: React.RefObject<HTMLDivElement>;
    aiPrompt: string;
    selectedContext: string;
    isFormatMode: boolean;
    targetAudience: TargetAudience;
    onAddCost?: (cost: CostBreakdown, usage: TokenUsage) => void;
    onTogglePoint?: (point: string) => void;
    setIsAiLoading: (loading: boolean) => void;
    setRefiningPoint: (point: string | null) => void;
    restoreSelection: () => void;
    handleInput: (e: React.FormEvent<HTMLDivElement>) => void;
    closeAiModal: () => void;
}

export const useAIEditor = ({
    editorRef,
    aiPrompt,
    selectedContext,
    isFormatMode,
    targetAudience,
    onAddCost,
    onTogglePoint,
    setIsAiLoading,
    setRefiningPoint,
    restoreSelection,
    handleInput,
    closeAiModal,
}: UseAIEditorParams) => {

    const handleAiSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiPrompt.trim()) return;

        setIsAiLoading(true);
        try {
            let promptToSend = aiPrompt;
            if (isFormatMode && selectedContext) {
                promptToSend = `
                TARGET CONTENT: """${selectedContext}"""
                FORMATTING INSTRUCTION: ${aiPrompt}
                TASK: Reformat the TARGET CONTENT exactly according to the instruction. Return ONLY the formatted result in Markdown/HTML.
                `;
            } else if (selectedContext && selectedContext.trim().length > 0) {
                promptToSend = `TARGET TEXT TO MODIFY: """${selectedContext}"""\n\nINSTRUCTION: ${aiPrompt}\n\nTASK: Rewrite or replace the target text based on the instruction. Return ONLY the result in Markdown/HTML.`;
            }

            const res = await generateSnippet(promptToSend, targetAudience as TargetAudience);
            const htmlSnippet = marked.parse(res.data, { async: false }) as string;
            restoreSelection();
            document.execCommand('insertHTML', false, htmlSnippet);
            if (editorRef.current) handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
            if (onAddCost) onAddCost(res.cost, res.usage);
            closeAiModal();
        } catch (error) {
            console.error("AI Edit failed", error);
            alert("Failed to generate content. Please try again.");
        } finally {
            setIsAiLoading(false);
        }
    }, [aiPrompt, closeAiModal, editorRef, handleInput, isFormatMode, onAddCost, restoreSelection, selectedContext, setIsAiLoading, targetAudience]);

    const handleRefinePoint = useCallback(async (point: string) => {
        if (!editorRef.current) return;
        setRefiningPoint(point);

        try {
            const fullHtml = editorRef.current.innerHTML;

            const res = await smartInjectPoint(fullHtml, point, targetAudience as TargetAudience);

            if (res.data && res.data.originalSnippet && res.data.newSnippet) {
                const { originalSnippet, newSnippet } = res.data;

                if (editorRef.current.innerHTML.includes(originalSnippet)) {
                    editorRef.current.innerHTML = editorRef.current.innerHTML.replace(originalSnippet, newSnippet);
                } else {
                    const suggestionHtml = `
                        <div style="border-left: 4px solid #8b5cf6; padding-left: 12px; margin: 16px 0; background: #f5f3ff; padding: 12px; border-radius: 4px;">
                            <p style="font-size: 10px; color: #8b5cf6; font-weight: bold; margin: 0 0 4px 0;">✨ REFINED WITH: ${point}</p>
                            ${newSnippet}
                        </div>
                       `;
                    editorRef.current.innerHTML += suggestionHtml;
                }

                onTogglePoint?.(point);
                if (onAddCost) onAddCost(res.cost, res.usage);
            } else {
                alert("AI couldn't identify a suitable paragraph to refine.");
            }
        } catch (e) {
            console.error("Refine failed", e);
            alert("Refinement failed.");
        } finally {
            setRefiningPoint(null);
            if (editorRef.current) handleInput({ currentTarget: editorRef.current } as React.FormEvent<HTMLDivElement>);
        }
    }, [editorRef, handleInput, onAddCost, onTogglePoint, setRefiningPoint, targetAudience]);

    return {
        handleAiSubmit,
        handleRefinePoint,
    };
};
