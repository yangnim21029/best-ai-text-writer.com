import { useCallback, useRef } from 'react';
import { marked } from 'marked';
import { generateSnippetAction } from '@/app/actions/generation';
import { getLanguageInstruction } from '../services/adapters/promptService';
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
  clearBold?: (options?: {
    removeBold?: boolean;
    removeBlockquotes?: boolean;
    removeQuotes?: boolean;
    target?: 'selection' | 'document';
  }) => boolean;
  summarizeFormatting?: () => { boldMarks: number; blockquotes: number; quoteChars: number };
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

  const buildAskAiPrompt = useCallback(
    (input: AskAiRunActionInput, text: string) => {
      const languageInstruction = getLanguageInstruction(targetAudience);

      if (input.mode === 'format') {
        let task = '';
        switch (input.preset) {
          case 'bullet':
            task = 'Convert the text into a clean, well-structured bulleted list.';
            break;
          case 'ordered':
            task = 'Convert the text into a clean, numbered list.';
            break;
          case 'table-2':
            task = 'Present the data as an HTML table with 2 columns (Header and Values).';
            break;
          case 'table-3':
            task = 'Present the data as an HTML table with 3 columns.';
            break;
          case 'checklist':
            task = 'Convert into a checklist format using [ ] or <ul> with checkboxes.';
            break;
          case 'quote':
            task = 'Format this text as a high-impact blockquote.';
            break;
          case 'markdown-clean':
            task =
              'Clean up any messy HTML/Markdown formatting while strictly preserving the text content and semantics.';
            break;
          default:
            task = 'Reformat the following text for better readability and structure.';
        }
        return `CONTEXT: Article for ${targetAudience}\nTARGET CONTENT: """${text}"""\nTASK: ${task} Return ONLY the improved HTML snippet.\n\n${languageInstruction}`;
      }

      const presetInstruction = (() => {
        switch (input.preset) {
          case 'rephrase':
            return 'Rephrase for better clarity and impact while strictly maintaining the original meaning.';
          case 'shorten':
            return 'Condense the text significantly (30-50% reduction) by removing wordiness and filler, keeping only the core message.';
          case 'elaborate':
            return 'Expand slightly on these points with relevant supporting details or clearer explanations.';
          case 'formal':
            return 'Rewrite in a professional and sophisticated tone suitable for business or academic contexts.';
          case 'casual':
            return 'Rewrite in a friendly, conversational, and engaging tone.';
          case 'bulletise':
            return 'Extract the key points and present them as a concise bulleted list.';
          case 'summarise':
            return 'Summarise the main ideas into a single, punchy paragraph.';
          default:
            return input.prompt || 'Optimise this text for flow, grammar, and engagement.';
        }
      })();

      const mediaInstruction =
        'IMPORTANT: If the target text contains any <img> tags or other media elements, you MUST preserve them exactly as they are in their relative positions. DO NOT strip them out.';

      return `CONTEXT: Article for ${targetAudience}\nTARGET TEXT: """${text}"""\nINSTRUCTION: ${presetInstruction}${input.prompt ? `\nCUSTOM USER INPUT: ${input.prompt}` : ''}\n\n${mediaInstruction}\n\n${languageInstruction}\n\nTASK: Return ONLY the rewritten result as an HTML snippet. Do not include any preamble or extra commentary.`;
    },
    [targetAudience]
  );

  const lockAskAiRange = useCallback(
    (taskId?: string) => {
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
    },
    [tiptapApi]
  );

  const runAskAiAction = useCallback(
    async (input: AskAiRunActionInput) => {
      if (!tiptapApi) {
        alert('Editor not ready.');
        throw new Error('Editor not ready');
      }

      // selectedText here is expected to be the structural context (HTML or preserved spaces)
      const contentContext = (input.selectedText || tiptapApi.getSelectedText?.() || '').trim();

      if (!contentContext) {
        alert('請先選取要調整的文字。');
        throw new Error('No selection');
      }

      const promptToSend = buildAskAiPrompt(input, contentContext);

      pendingCountRef.current += 1;
      setIsAiLoading(true);
      try {
        const res = await generateSnippetAction(promptToSend, targetAudience as TargetAudience);

        // If the AI returns markdown, parse it to HTML
        let htmlResult = res.data || '';
        if (htmlResult.includes('```') || htmlResult.startsWith('#')) {
          htmlResult = marked.parse(htmlResult, { async: false }) as string;
        }

        onAddCost?.(res.cost, res.usage);
        return htmlResult;
      } catch (error) {
        console.error('AI Edit failed', error);
        alert('Failed to generate content. Please try again.');
        throw error;
      } finally {
        pendingCountRef.current = Math.max(0, pendingCountRef.current - 1);
        setIsAiLoading(pendingCountRef.current > 0);
      }
    },
    [buildAskAiPrompt, onAddCost, setIsAiLoading, targetAudience, tiptapApi]
  );

  const handleAskAiInsert = useCallback(
    (html: string, taskId?: string) => {
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
    },
    [clearAskAiState, onChange, tiptapApi, updateCountsFromText]
  );

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
