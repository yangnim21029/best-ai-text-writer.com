import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Wand2,
  PenLine,
  Sparkles,
  Smile,
  MessageSquarePlus,
  List,
  ListOrdered,
  Table,
  CheckSquare,
  Quote,
  ArrowRight,
  Loader2,
  X,
} from 'lucide-react';

type AskAiMode = 'edit' | 'format';

type PresetId =
  | 'rephrase'
  | 'shorten'
  | 'elaborate'
  | 'formal'
  | 'casual'
  | 'bulletise'
  | 'summarise';

type FormatId =
  | 'bullet'
  | 'ordered'
  | 'table-2'
  | 'table-3'
  | 'checklist'
  | 'quote'
  | 'markdown-clean';

interface RunActionInput {
  selectedText: string;
  selectedHtml?: string;
  mode: AskAiMode;
  preset?: PresetId | FormatId;
  prompt?: string;
  taskId?: string;
}

interface AskAiSelectionProps {
  onRunAction?: (input: RunActionInput) => Promise<string>;
  onInsert?: (html: string, taskId?: string) => void;
  onLockSelectionRange?: (taskId: string) => void;
  onHighlightTask?: (taskId: string) => void;
  selectionText?: string;
  selectionHtml?: string;
  selectionRect?: DOMRect | null;
  selectionRange?: { from: number; to: number } | null;
  badgeContainerRef?: React.RefObject<HTMLElement>;
}

export interface AskAiSelectionHandle {
  openTask: (taskId: string) => void;
}

/**
 * Floating Ask AI UI for acting on highlighted text.
 * Designed as a standalone component so we can mount it in any editor surface.
 */
export const AskAiSelection = React.forwardRef<AskAiSelectionHandle, AskAiSelectionProps>(
  (
    {
      onRunAction,
      onInsert,
      onLockSelectionRange,
      badgeContainerRef,
      onHighlightTask,
      selectionText: propsSelectionText = '',
      selectionHtml: propsSelectionHtml = '',
      selectionRect: propsSelectionRect = null,
      selectionRange: propsSelectionRange = null,
    },
    ref
  ) => {
    const askAiRootAttr = { 'data-askai-ui': 'true' };
    const [mode, setMode] = useState<AskAiMode>('edit');
    const [showFormatMenu, setShowFormatMenu] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [taskSelectionText, setTaskSelectionText] = useState('');
    const [taskSelectionHtml, setTaskSelectionHtml] = useState('');
    const [tasks, setTasks] = useState<AskAiTask[]>([]);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const selectionRangeRef = useRef<Range | null>(null);
    const taskRangesRef = useRef<Record<string, { from: number; to: number } | Range | null>>({});
    const toolbarRef = useRef<HTMLDivElement | null>(null);
    const previewRef = useRef<HTMLDivElement | null>(null);
    const [toolbarSize, setToolbarSize] = useState({ width: 72, height: 200 });
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        openTask: (taskId: string) => {
          const task = tasks.find((t) => t.id === taskId);
          if (task) {
            setActiveTaskId(taskId);
            setIsPreviewOpen(true);
          }
        },
      }),
      [tasks]
    );

    interface AskAiAttempt {
      id: string;
      title: string;
      status: 'running' | 'done' | 'error';
      html?: string | null;
      mode: AskAiMode;
      prompt?: string;
    }

    interface AskAiTask {
      id: string;
      selectionText: string;
      selectionHtml: string;
      attempts: AskAiAttempt[];
      activeAttemptId: string | null;
    }

    const editPresets: { id: PresetId; label: string }[] = [
      { id: 'rephrase', label: 'Rephrase' },
      { id: 'shorten', label: 'Shorten' },
      { id: 'elaborate', label: 'Elaborate' },
      { id: 'formal', label: 'More formal' },
      { id: 'casual', label: 'More casual' },
      { id: 'bulletise', label: 'Bulletise' },
      { id: 'summarise', label: 'Summarise' },
    ];

    const formatTemplates: { id: FormatId; label: string; icon: React.ReactNode }[] = [
      { id: 'bullet', label: 'Bullet list', icon: <List className="w-4 h-4" /> },
      { id: 'ordered', label: 'Numbered list', icon: <ListOrdered className="w-4 h-4" /> },
      { id: 'table-2', label: 'Table (2 columns)', icon: <Table className="w-4 h-4" /> },
      { id: 'table-3', label: 'Table (3 columns)', icon: <Table className="w-4 h-4" /> },
      { id: 'checklist', label: 'Checklist', icon: <CheckSquare className="w-4 h-4" /> },
      { id: 'quote', label: 'Quote block', icon: <Quote className="w-4 h-4" /> },
      { id: 'markdown-clean', label: 'Markdown clean-up', icon: <Sparkles className="w-4 h-4" /> },
    ];

    const toolbarVisible = propsSelectionText.length > 0 && !!propsSelectionRect;

    const viewportSafeArea = 12;
    const activeTask = activeTaskId ? tasks.find((t) => t.id === activeTaskId) : null;
    const activeAttempt = activeTask?.attempts.find((a) => a.id === activeTask.activeAttemptId);

    const completedCount = tasks.filter((t) => t.attempts.some((a) => a.status === 'done')).length;
    const totalCount = tasks.length;
    const isActiveLoading = activeAttempt?.status === 'running';

    const toolbarPosition = useMemo(() => {
      if (!propsSelectionRect) return { top: viewportSafeArea, left: viewportSafeArea };
      const toolbarWidth = toolbarSize.width || 240;
      const toolbarHeight = toolbarSize.height || 48;

      // Horizontal position: centered relative to selection or clamped
      const selectionCenter = propsSelectionRect.left + propsSelectionRect.width / 2;
      const baseLeft = selectionCenter - toolbarWidth / 2;
      const maxLeft = window.innerWidth - toolbarWidth - viewportSafeArea;
      const clampedLeft = Math.max(viewportSafeArea, Math.min(baseLeft, maxLeft));

      // Vertical position: above selection if room, otherwise below
      const spaceAbove = propsSelectionRect.top - viewportSafeArea;
      const baseTop =
        spaceAbove > toolbarHeight + 12
          ? propsSelectionRect.top - toolbarHeight - 12
          : propsSelectionRect.bottom + 12;

      const maxTop = window.innerHeight - toolbarHeight - viewportSafeArea;
      const clampedTop = Math.max(viewportSafeArea, Math.min(baseTop, maxTop));

      return { top: clampedTop, left: clampedLeft };
    }, [propsSelectionRect, toolbarSize]);

    const isInsideUi = (target: EventTarget | null | undefined) => {
      return target instanceof Element && target.closest('[data-askai-ui="true"]');
    };

    const resolveSelectionRect = (range: Range): DOMRect | null => {
      const rect = range.getBoundingClientRect();
      if (rect && (rect.width > 0 || rect.height > 0)) return rect;
      const clientRects = Array.from(range.getClientRects()).filter(
        (r) => r.width > 0 || r.height > 0
      );
      if (clientRects.length === 0) return null;
      const left = Math.min(...clientRects.map((r) => r.left));
      const right = Math.max(...clientRects.map((r) => r.right));
      const top = Math.min(...clientRects.map((r) => r.top));
      const bottom = Math.max(...clientRects.map((r) => r.bottom));
      return new DOMRect(left, top, right - left, bottom - top);
    };

    const captureSelectionRange = () => {
      return propsSelectionRange;
    };

    useEffect(() => {
      if (!toolbarRef.current) return;
      const rect = toolbarRef.current.getBoundingClientRect();
      if (rect.width && rect.height) {
        setToolbarSize((prev) => {
          if (prev.width === rect.width && prev.height === rect.height) return prev;
          return { width: rect.width, height: rect.height };
        });
      }
    }, [toolbarVisible, propsSelectionText, showFormatMenu]);

    // Keep panel content pinned to the selected task; do not auto-switch on task updates.
    useEffect(() => {
      if (!activeAttempt) return; // Use activeAttempt directly
      setPreviewTitle((prev) => prev || activeAttempt.title);
      setMode(activeAttempt.mode);
    }, [activeAttempt]); // Depend on activeAttempt

    const dropdownAnchor = useMemo(() => {
      const menuWidth = 256; // w-64
      const desiredLeft = toolbarPosition.left;
      const maxLeft = window.innerWidth - menuWidth - viewportSafeArea;
      return {
        top: toolbarPosition.top + toolbarSize.height + 8,
        left: Math.max(viewportSafeArea, Math.min(desiredLeft, maxLeft)),
      };
    }, [toolbarPosition, toolbarSize]);

    const lockTaskSelection = (override?: { text?: string; html?: string }) => {
      // Use override if provided (e.g. from a task), otherwise use current props
      const text = (override?.text || propsSelectionText || taskSelectionText).trim();
      const html = (override?.html || propsSelectionHtml).trim();

      if (!text && !html) {
        alert('請先選取要調整的文字。');
        return null;
      }

      // Update the locked text for consistency if we are starting from the toolbar
      if (!override && text !== taskSelectionText) {
        setTaskSelectionText(text);
        setTaskSelectionHtml(html);
        setCustomPrompt('');
      }
      return { text, html };
    };

    const runAction = async (input: RunActionInput) => {
      const selection = lockTaskSelection({ text: input.selectedText, html: input.selectedHtml });
      if (!selection) return;

      const { text: effectiveText, html: effectiveHtml } = selection;
      const taskId = input.taskId || `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const attemptId = `${Date.now()}-${Math.random().toString(36).slice(2, 4)}`;

      const newAttempt: AskAiAttempt = {
        id: attemptId,
        title: labelForAction(input),
        status: 'running',
        mode: input.mode,
        prompt: input.prompt,
      };

      setTasks((prev) => {
        const existingTask = prev.find((t) => t.id === taskId);
        if (existingTask) {
          return prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  attempts: [...t.attempts, newAttempt],
                  activeAttemptId: attemptId,
                }
              : t
          );
        } else {
          onLockSelectionRange?.(taskId);
          onHighlightTask?.(taskId);
          if (propsSelectionRange) {
            (taskRangesRef.current as any)[taskId] = propsSelectionRange;
          }
          return [
            ...prev,
            {
              id: taskId,
              selectionText: effectiveText,
              selectionHtml: effectiveHtml,
              attempts: [newAttempt],
              activeAttemptId: attemptId,
            },
          ];
        }
      });

      setActiveTaskView(taskId, attemptId);

      try {
        const htmlResult = await (onRunAction
          ? onRunAction({ ...input, selectedText: effectiveHtml || effectiveText, taskId })
          : Promise.resolve(`<p>${effectiveText}</p>`));
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  attempts: t.attempts.map((a) =>
                    a.id === attemptId ? { ...a, html: htmlResult, status: 'done' } : a
                  ),
                }
              : t
          )
        );
      } catch (err) {
        console.error('Ask AI run failed', err);
        const errorHtml = '<p class="text-red-500">AI 輸出失敗，請重試。</p>';
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  attempts: t.attempts.map((a) =>
                    a.id === attemptId ? { ...a, html: errorHtml, status: 'error' } : a
                  ),
                }
              : t
          )
        );
      }
    };

    const setActiveTaskView = (taskId: string | null, attemptId?: string) => {
      setActiveTaskId(taskId);
      if (!taskId) return;

      setTasks((prev) =>
        prev.map((t) => {
          if (t.id === taskId) {
            const targetAttemptId =
              attemptId || t.activeAttemptId || t.attempts[t.attempts.length - 1]?.id;
            return { ...t, activeAttemptId: targetAttemptId };
          }
          return t;
        })
      );
    };

    const deleteTask = (taskId: string, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setTasks((prev) => {
        const next = prev.filter((t) => t.id !== taskId);
        if (activeTaskId === taskId) {
          if (next.length > 0) {
            setActiveTaskView(next[next.length - 1].id);
          } else {
            hidePanels();
          }
        }
        return next;
      });
    };

    const clearAllTasks = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setTasks([]);
      setActiveTaskId(null);
      setIsPreviewOpen(false);
      setPreviewHtml(null);
      setTaskSelectionText('');
    };

    const hidePanels = () => {
      setIsPreviewOpen(false);
      setActiveTaskId(null);
    };

    const openEditPanel = () => {
      const text = lockTaskSelection();
      if (!text) return;
      setMode('edit');
      setPreviewTitle('Edit');
      setPreviewHtml(null);
      setIsPreviewOpen(true);
      setCustomPrompt('');
    };

    const labelForAction = (input: RunActionInput) => {
      if (input.mode === 'format') {
        const matched = formatTemplates.find((t) => t.id === input.preset);
        return matched?.label || 'Format';
      }
      const matched = editPresets.find((p) => p.id === input.preset);
      return matched?.label || 'Edit';
    };

    const handleInsert = () => {
      const htmlToInsert = activeAttempt?.html;
      if (!htmlToInsert) return;

      if (onInsert) {
        onInsert(htmlToInsert, activeTaskId || undefined);
        setActiveTaskId(null);
        setIsPreviewOpen(false);
        clearSelectionHighlight();
        return;
      }

      // DOM-based fallback (for non-Tiptap environments if any)
      const range = activeTaskId ? taskRangesRef.current[activeTaskId] : selectionRangeRef.current;
      if (range && range instanceof Range) {
        const fragment = document.createDocumentFragment();
        const temp = document.createElement('div');
        temp.innerHTML = htmlToInsert;
        while (temp.firstChild) {
          fragment.appendChild(temp.firstChild);
        }
        range.deleteContents();
        range.insertNode(fragment);
        if (activeTaskId) {
          delete taskRangesRef.current[activeTaskId];
        }
      }

      setActiveTaskId(null);
      setIsPreviewOpen(false);
      clearSelectionHighlight();
    };

    const clearSelectionHighlight = () => {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
      }
    };

    const renderToolbar = () => {
      if (!toolbarVisible) return null;
      return (
        <div
          data-askai-ui="true"
          className="fixed z-30 flex items-center bg-white/80 backdrop-blur-md border border-gray-200/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-2xl p-1.5 gap-1 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
          style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
          ref={toolbarRef}
        >
          <div className="flex items-center gap-1 border-r border-gray-200/50 pr-1 mr-1">
            <ToolbarIcon
              icon={<PenLine className="w-4 h-4" />}
              label="Edit"
              onClick={() => {
                setShowFormatMenu(false);
                openEditPanel();
              }}
            />
            <ToolbarIcon
              icon={<Sparkles className="w-4 h-4" />}
              label="Format"
              active={showFormatMenu}
              onClick={() => {
                setShowFormatMenu((v) => !v);
                setMode('format');
              }}
            />
          </div>
          <div className="flex items-center gap-1">
            <button
              className="h-8 px-3 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100/80 transition-colors flex items-center gap-1.5"
              onClick={() =>
                runAction({
                  mode: 'edit',
                  preset: 'shorten',
                  selectedText: propsSelectionText,
                  selectedHtml: propsSelectionHtml,
                })
              }
            >
              <Smile className="w-3.5 h-3.5 text-blue-500" />
              Shorten
            </button>
            <button
              className="h-8 px-3 rounded-xl text-xs font-medium text-gray-700 hover:bg-gray-100/80 transition-colors flex items-center gap-1.5"
              onClick={() =>
                runAction({
                  mode: 'edit',
                  preset: 'elaborate',
                  selectedText: propsSelectionText,
                  selectedHtml: propsSelectionHtml,
                })
              }
            >
              <MessageSquarePlus className="w-3.5 h-3.5 text-purple-500" />
              Add note
            </button>
          </div>
        </div>
      );
    };

    const renderFormatMenu = () => {
      if (!showFormatMenu || !toolbarVisible) return null;
      return (
        <DropdownCard anchor={dropdownAnchor}>
          <div className="text-sm font-semibold text-gray-800 mb-2">Format templates</div>
          <div className="flex flex-col gap-1">
            {formatTemplates.map((template) => (
              <MenuItem
                key={template.id}
                label={template.label}
                icon={template.icon}
                onClick={() => {
                  runAction({
                    mode: 'format',
                    preset: template.id,
                    selectedText:
                      activeTask?.selectionText || taskSelectionText || propsSelectionText,
                    selectedHtml:
                      activeTask?.selectionHtml || taskSelectionHtml || propsSelectionHtml,
                  });
                  setShowFormatMenu(false);
                }}
              />
            ))}
          </div>
        </DropdownCard>
      );
    };

    const handleRunCustomPrompt = () => {
      runAction({
        mode: 'edit',
        preset: undefined,
        prompt: customPrompt,
        taskId: activeTaskId || undefined,
        selectedText: activeTask?.selectionText || taskSelectionText || propsSelectionText,
        selectedHtml: activeTask?.selectionHtml || taskSelectionHtml || propsSelectionHtml,
      });
    };

    const renderPreview = () => {
      if (!isPreviewOpen) return null;
      return (
        <div
          data-askai-ui="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => hidePanels()}
          />
          <div
            className="relative w-full max-w-4xl bg-white shadow-[0_32px_64px_rgba(0,0,0,0.2)] border border-gray-100 rounded-3xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-300"
            ref={previewRef}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-50 via-white to-blue-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-200">
                  <Wand2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 leading-tight">
                    {activeAttempt?.title || (mode === 'format' ? 'Format' : 'Edit')}
                  </h3>
                  <div className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5 uppercase tracking-wider">
                    AI-Powered Content Optimization
                    {isActiveLoading && (
                      <Loader2 className="w-3 h-3 animate-spin text-purple-500" />
                    )}
                  </div>
                </div>
              </div>
              <button
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
                onClick={() => hidePanels()}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Comparison Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                <div className="grid lg:grid-cols-2 gap-6 h-full">
                  {/* Before */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Original
                      </span>
                    </div>
                    <div className="flex-1 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm overflow-y-auto max-h-[300px] lg:max-h-none">
                      <div
                        className="prose prose-sm prose-gray max-w-none opacity-60 leading-relaxed"
                        dangerouslySetInnerHTML={{
                          __html:
                            activeTask?.selectionHtml ||
                            activeTask?.selectionText ||
                            taskSelectionText ||
                            propsSelectionHtml ||
                            propsSelectionText,
                        }}
                      />
                    </div>
                  </div>
                  {/* After */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-widest">
                        AI Suggestion
                      </span>
                      {previewHtml && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
                          PREVIEW
                        </span>
                      )}
                    </div>
                    <div className="flex-1 bg-white border-2 border-purple-100 rounded-2xl p-5 shadow-[0_8px_24px_rgba(147,51,234,0.05)] overflow-y-auto max-h-[300px] lg:max-h-none">
                      {isActiveLoading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-3 py-12">
                          <div className="flex gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.3s]" />
                          </div>
                          <p className="text-xs font-semibold text-purple-600 animate-pulse">
                            Generating your content...
                          </p>
                        </div>
                      ) : (
                        <div
                          className="prose prose-sm prose-purple max-w-none text-gray-900 leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html:
                              activeAttempt?.html ||
                              '<p class="text-gray-400 italic">Waiting for AI suggestion...</p>',
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Refine / Prompt Area */}
              <div className="bg-white border-t border-gray-100 p-6 flex flex-col gap-4">
                {mode === 'edit' && (
                  <div className="relative group">
                    <textarea
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 min-h-[100px] resize-none transition-all placeholder:text-gray-400"
                      placeholder="Add instructions (e.g., 'Make it more exciting', 'Use simpler words'...)"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleRunCustomPrompt();
                        }
                      }}
                    />
                    <div className="absolute top-2 right-2 flex gap-1.5">
                      {editPresets.slice(0, 3).map((p) => (
                        <button
                          key={p.id}
                          className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-[11px] font-bold text-gray-600 hover:border-gray-300 hover:shadow-sm transition-all"
                          onClick={() =>
                            runAction({
                              mode: 'edit',
                              preset: p.id,
                              selectedText:
                                activeTask?.selectionText ||
                                taskSelectionText ||
                                propsSelectionText,
                              selectedHtml:
                                activeTask?.selectionHtml ||
                                taskSelectionHtml ||
                                propsSelectionHtml,
                            })
                          }
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-1.5 border border-gray-100">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter pl-1">
                        History
                      </span>
                      <div className="flex items-center gap-1">
                        <select
                          className="bg-transparent text-xs font-bold text-gray-700 focus:outline-none cursor-pointer"
                          value={activeAttempt?.id || ''}
                          onChange={(e) => setActiveTaskView(activeTaskId, e.target.value)}
                        >
                          {activeTask?.attempts.map((a, idx) => (
                            <option key={a.id} value={a.id}>
                              Ver {idx + 1}: {a.title}
                            </option>
                          ))}
                        </select>
                        {activeTaskId && (
                          <button
                            onClick={(e) => deleteTask(activeTaskId, e)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete this version"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {mode === 'edit' ? (
                      <button
                        className="h-11 px-6 rounded-2xl bg-purple-600 text-white text-sm font-bold shadow-lg shadow-purple-100 hover:bg-purple-700 hover:shadow-purple-200 transition-all active:scale-[0.98] disabled:opacity-50"
                        onClick={handleRunCustomPrompt}
                        disabled={!customPrompt.trim() || isActiveLoading}
                      >
                        Generate Suggestion
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 mr-1">TWEAK</span>
                        {editPresets.slice(0, 3).map((p) => (
                          <button
                            key={p.id}
                            className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all"
                            onClick={() =>
                              runAction({
                                mode: 'edit',
                                preset: p.id,
                                selectedText:
                                  activeTask?.selectionText ||
                                  taskSelectionText ||
                                  propsSelectionText,
                                selectedHtml:
                                  activeTask?.selectionHtml ||
                                  taskSelectionHtml ||
                                  propsSelectionHtml,
                              })
                            }
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="w-px h-6 bg-gray-100 mx-1" />

                    <button
                      className="h-11 px-6 rounded-2xl bg-emerald-600 text-white text-sm font-black shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:shadow-emerald-200 transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-50"
                      onClick={handleInsert}
                      disabled={!activeAttempt?.html || isActiveLoading}
                    >
                      Apply Changes
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    };

    const renderTaskBadge = (placement: 'floating' | 'inline') => {
      if (placement === 'floating') return null;
      if (totalCount === 0 || isPreviewOpen) return null;
      const isInline = placement === 'inline';
      const layoutClasses = isInline
        ? 'inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold shadow-sm whitespace-nowrap flex-shrink-0 border border-purple-100 bg-white group'
        : 'fixed z-30 bottom-6 left-6 w-16 h-16 rounded-3xl flex flex-col items-center justify-center gap-1 shadow-[0_12px_32px_rgba(147,51,234,0.25)] border border-purple-300/30 bg-purple-600 text-white animate-in zoom-in slide-in-from-bottom-4 duration-500';

      return (
        <div data-askai-ui="true" className={`${layoutClasses} group`}>
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1 w-full h-full rounded-[inherit] hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none"
            onClick={(e) => {
              const lastTask = tasks[tasks.length - 1];
              if (lastTask) {
                setActiveTaskView(lastTask.id);
                setIsPreviewOpen(true);
              }
            }}
          >
            {isInline ? (
              <>
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-gray-900 group-hover:text-purple-600 transition-colors">
                    AI Processing
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    {completedCount}/{totalCount} Completed
                  </span>
                </div>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span className="text-[10px] font-black">
                  {completedCount}/{totalCount}
                </span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              clearAllTasks();
            }}
            className={
              isInline
                ? 'ml-auto p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100'
                : 'absolute -top-2 -right-2 w-5 h-5 rounded-full bg-white text-gray-400 border border-gray-200 flex items-center justify-center hover:text-red-500 hover:border-red-200 transition-all opacity-0 group-hover:opacity-100 shadow-sm'
            }
            title={isInline ? 'Clear all tasks' : 'Clear all suggestions'}
          >
            <X className={isInline ? 'w-4 h-4' : 'w-3 h-3'} />
          </button>
        </div>
      );
    };

    if (typeof document === 'undefined') return null;

    const badgeTarget = badgeContainerRef?.current;
    const badgeNode = renderTaskBadge(badgeTarget ? 'inline' : 'floating');

    return (
      <>
        {createPortal(
          <>
            {renderToolbar()}
            {renderFormatMenu()}
            {renderPreview()}
          </>,
          document.body
        )}
        {badgeNode && createPortal(badgeNode, badgeTarget || document.body)}
      </>
    );
  }
);

export type AskAiRunActionInput = RunActionInput;

const ToolbarIcon: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => {
  return (
    <button
      className={`w-9 h-9 inline-flex items-center justify-center rounded-xl transition-all duration-200 ${
        active
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
          : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'
      }`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={label}
    >
      {icon}
    </button>
  );
};

const DropdownCard: React.FC<{
  anchor: { top: number; left: number };
  children: React.ReactNode;
}> = ({ anchor, children }) => {
  return (
    <div
      data-askai-ui="true"
      className="fixed z-40 w-64 bg-white/90 backdrop-blur-xl border border-gray-100 shadow-[0_16px_48px_rgba(0,0,0,0.1)] rounded-2xl p-4 animate-in fade-in zoom-in-95 duration-200"
      style={{ top: anchor.top, left: anchor.left }}
    >
      {children}
    </div>
  );
};

const MenuItem: React.FC<{
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}> = ({ label, icon, disabled, onClick }) => {
  return (
    <button
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        disabled
          ? 'text-gray-300 cursor-not-allowed'
          : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700 active:scale-[0.97]'
      }`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <div
        className={`p-1.5 rounded-lg transition-colors ${disabled ? 'bg-gray-50' : 'bg-gray-50 group-hover:bg-purple-100'}`}
      >
        {icon || <PenLine className="w-4 h-4" />}
      </div>
      <span>{label}</span>
    </button>
  );
};
