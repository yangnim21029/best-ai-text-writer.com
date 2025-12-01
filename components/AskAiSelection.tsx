import React, { useEffect, useMemo, useRef, useState } from 'react';
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
    mode: AskAiMode;
    preset?: PresetId | FormatId;
    prompt?: string;
    taskId?: string;
}

interface AskAiSelectionProps {
    onRunAction?: (input: RunActionInput) => Promise<string>;
    onInsert?: (html: string, taskId?: string) => void;
    onLockSelectionRange?: (taskId: string) => void;
    badgeContainerRef?: React.RefObject<HTMLElement>;
    onHighlightTask?: (taskId: string) => void;
}

/**
 * Floating Ask AI UI for acting on highlighted text.
 * Designed as a standalone component so we can mount it in any editor surface.
 */
export const AskAiSelection: React.FC<AskAiSelectionProps> = ({
    onRunAction,
    onInsert,
    onLockSelectionRange,
    badgeContainerRef,
    onHighlightTask,
}) => {
    const askAiRootAttr = { 'data-askai-ui': 'true' };
    const [selectionText, setSelectionText] = useState('');
    const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
    const [mode, setMode] = useState<AskAiMode>('edit');
    const [showFormatMenu, setShowFormatMenu] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [previewTitle, setPreviewTitle] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [taskSelectionText, setTaskSelectionText] = useState('');
    const [tasks, setTasks] = useState<AskAiTask[]>([]);
    const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
    const selectionRangeRef = useRef<Range | null>(null);
    const taskRangesRef = useRef<Record<string, Range | null>>({});
    const toolbarRef = useRef<HTMLDivElement | null>(null);
    const previewRef = useRef<HTMLDivElement | null>(null);
    const [toolbarSize, setToolbarSize] = useState({ width: 72, height: 200 });
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);

    interface AskAiTask {
        id: string;
        title: string;
        selectionText: string;
        status: 'running' | 'done' | 'error';
        html?: string | null;
        mode: AskAiMode;
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

    const toolbarVisible = selectionText.length > 0 && !!selectionRect;

    const viewportSafeArea = 12;
    const activeTask = activeTaskId ? tasks.find(t => t.id === activeTaskId) : null;
    const completedCount = tasks.filter(t => t.status === 'done').length;
    const totalCount = tasks.length;
    const isActiveLoading = activeTask?.status === 'running';

    const toolbarPosition = useMemo(() => {
        if (!selectionRect) return { top: viewportSafeArea, left: viewportSafeArea };
        const toolbarWidth = toolbarSize.width || 72;
        const toolbarHeight = toolbarSize.height || 200;
        const baseLeft = selectionRect.right + 8; // position to the right of selection
        const maxLeft = window.innerWidth - toolbarWidth - viewportSafeArea;
        const clampedLeft = Math.max(viewportSafeArea, Math.min(baseLeft, maxLeft));
        const baseTop =
            selectionRect.top + selectionRect.height / 2 - toolbarHeight / 2; // vertical center to selection
        const maxTop = window.innerHeight - toolbarHeight - viewportSafeArea;
        const clampedTop = Math.max(viewportSafeArea, Math.min(baseTop, maxTop));
        return { top: clampedTop, left: clampedLeft };
    }, [selectionRect, toolbarSize]);

    const isInsideUi = (target: EventTarget | null | undefined) => {
        return target instanceof Element && target.closest('[data-askai-ui="true"]');
    };

    const resolveSelectionRect = (range: Range): DOMRect | null => {
        const rect = range.getBoundingClientRect();
        if (rect && (rect.width > 0 || rect.height > 0)) return rect;
        const clientRects = Array.from(range.getClientRects()).filter(r => r.width > 0 || r.height > 0);
        if (clientRects.length === 0) return null;
        const left = Math.min(...clientRects.map(r => r.left));
        const right = Math.max(...clientRects.map(r => r.right));
        const top = Math.min(...clientRects.map(r => r.top));
        const bottom = Math.max(...clientRects.map(r => r.bottom));
        return new DOMRect(left, top, right - left, bottom - top);
    };

    const resetFloatingUi = () => {
        setSelectionText('');
        setSelectionRect(null);
        selectionRangeRef.current = null;
        setShowFormatMenu(false);
    };

    const hidePanels = () => {
        setIsPreviewOpen(false);
        setActiveTaskId(null);
    };

    const captureSelection = () => {
        requestAnimationFrame(() => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) {
                resetFloatingUi();
                return;
            }
            const text = sel.toString().trim();
            if (!text) {
                resetFloatingUi();
                return;
            }
            const range = sel.getRangeAt(0);
            const rect = resolveSelectionRect(range);
            if (!rect) {
                resetFloatingUi();
                return;
            }
            setSelectionText(text);
            setSelectionRect(rect);
            selectionRangeRef.current = range.cloneRange();
        });
    };

    const refreshSelectionRect = () => {
        const range = selectionRangeRef.current;
        if (!range) return;
        const rect = resolveSelectionRect(range);
        if (rect) {
            setSelectionRect(rect);
        }
    };

    useEffect(() => {
        const handler = (e: MouseEvent | KeyboardEvent) => {
            if (isInsideUi(e.target)) return;
            captureSelection();
        };
        const selectionChangeHandler = () => {
            const activeEl = document.activeElement;
            const sel = window.getSelection();
            const anchorElement =
                sel?.anchorNode instanceof Element ? sel.anchorNode : sel?.anchorNode?.parentElement;
            if (isInsideUi(activeEl) || isInsideUi(anchorElement)) {
                return;
            }
            captureSelection();
        };
        const scrollHandler = () => {
            refreshSelectionRect();
        };
        document.addEventListener('selectionchange', selectionChangeHandler);
        document.addEventListener('mouseup', handler);
        document.addEventListener('keyup', handler);
        window.addEventListener('scroll', scrollHandler, true);
        window.addEventListener('resize', scrollHandler);
        return () => {
            document.removeEventListener('selectionchange', selectionChangeHandler);
            document.removeEventListener('mouseup', handler);
            document.removeEventListener('keyup', handler);
            window.removeEventListener('scroll', scrollHandler, true);
            window.removeEventListener('resize', scrollHandler);
        };
    }, []);

    useEffect(() => {
        if (!toolbarRef.current) return;
        const rect = toolbarRef.current.getBoundingClientRect();
        if (rect.width && rect.height) {
            setToolbarSize(prev => {
                if (prev.width === rect.width && prev.height === rect.height) return prev;
                return { width: rect.width, height: rect.height };
            });
        }
    }, [toolbarVisible, selectionText, showFormatMenu]);

    // Keep panel content pinned to the selected task; do not auto-switch on task updates.
    useEffect(() => {
        if (!activeTaskId) return;
        const current = tasks.find(t => t.id === activeTaskId);
        if (current) {
            setPreviewTitle(prev => prev || current.title);
            setMode(current.mode);
        }
    }, [activeTaskId, tasks]);

    const dropdownAnchor = useMemo(() => {
        const menuWidth = 256; // w-64
        const desiredLeft = toolbarPosition.left + toolbarSize.width + 12;
        const maxLeft = window.innerWidth - menuWidth - viewportSafeArea;
        return {
            top: toolbarPosition.top,
            left: Math.max(viewportSafeArea, Math.min(desiredLeft, maxLeft)),
        };
    }, [toolbarPosition, toolbarSize]);

    const lockTaskSelection = (overrideText?: string) => {
        const text = (overrideText || taskSelectionText || selectionText).trim();
        if (!text) {
            alert('請先選取要調整的文字。');
            return '';
        }
        const isNewTarget = text !== taskSelectionText;
        setTaskSelectionText(text);
        if (selectionRangeRef.current && isNewTarget) {
            // Range is stored per task on creation
        }
        if (isNewTarget) {
            setCustomPrompt('');
        }
        return text;
    };

    const runAction = async (input: RunActionInput) => {
        const effectiveText = lockTaskSelection(input.selectedText);
        if (!effectiveText) return;
        setMode(input.mode);
        setIsPreviewOpen(false);
        setPreviewTitle(labelForAction(input));
        setPreviewHtml(null);

        const taskId = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        if (selectionRangeRef.current) {
            taskRangesRef.current[taskId] = selectionRangeRef.current.cloneRange();
        }
        onLockSelectionRange?.(taskId);
        onHighlightTask?.(taskId);
        const nextTask: AskAiTask = {
            id: taskId,
            title: labelForAction(input),
            selectionText: effectiveText,
            status: 'running',
            mode: input.mode,
        };
        setTasks(prev => [...prev, nextTask]);
        setActiveTaskView(taskId);

        const mockResponse = () => {
            if (input.mode === 'format') {
                if (input.preset === 'bullet') {
                    return `<ul class="list-disc pl-5"><li>${effectiveText}</li><li>第二點</li></ul>`;
                }
                if (input.preset?.toString().startsWith('table')) {
                    const cols = input.preset === 'table-3' ? 3 : 2;
                    const headers = Array.from({ length: cols }, (_, i) => `Column ${i + 1}`).join('</th><th>');
                    return `<table class="table-auto border-collapse w-full"><thead><tr><th>${headers}</th></tr></thead><tbody><tr>${Array.from({ length: cols }, () => '<td>Value</td>').join('')}</tr></tbody></table>`;
                }
                if (input.preset === 'checklist') {
                    return `<ul class="list-none pl-0"><li>☐ ${effectiveText}</li><li>☐ 下一步</li></ul>`;
                }
                if (input.preset === 'quote') {
                    return `<blockquote class="border-l-4 pl-3 italic text-gray-700">${effectiveText}</blockquote>`;
                }
                return `<div>${effectiveText}</div>`;
            }
            const promptHint = input.prompt ? `（${input.prompt}）` : '';
            return `<p>${effectiveText}${promptHint ? ' ' + promptHint : ''}</p>`;
        };

        try {
            const html = await (onRunAction ? onRunAction({ ...input, selectedText: effectiveText, taskId }) : Promise.resolve(mockResponse()));
            setTasks(prev =>
                prev.map(t =>
                    t.id === taskId ? { ...t, html, status: 'done' } : t
                )
            );
            if (activeTaskId === taskId) {
                setPreviewHtml(html);
                setPreviewTitle(labelForAction(input));
            }
        } catch (err) {
            console.error('Ask AI run failed', err);
            const errorHtml = '<p class="text-red-500">AI 輸出失敗，請重試。</p>';
            setTasks(prev =>
                prev.map(t =>
                    t.id === taskId ? { ...t, html: errorHtml, status: 'error' } : t
                )
            );
            if (activeTaskId === taskId) {
                setPreviewHtml(errorHtml);
                setPreviewTitle(labelForAction(input));
            }
        }
    };

    const setActiveTaskView = (taskId: string | null) => {
        setActiveTaskId(taskId);
        if (!taskId) return;
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        setPreviewTitle(task.title);
        setPreviewHtml(task.html || null);
        setMode(task.mode);
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
            const matched = formatTemplates.find(t => t.id === input.preset);
            return matched?.label || 'Format';
        }
        const matched = editPresets.find(p => p.id === input.preset);
        return matched?.label || 'Edit';
    };

    const handleInsert = () => {
        const activeTask = tasks.find(t => t.id === activeTaskId);
        const htmlToInsert = activeTask?.html || previewHtml;
        if (!htmlToInsert) return;
        if (onInsert) {
            onInsert(htmlToInsert, activeTaskId || undefined);
        setActiveTaskId(null);
        setIsPreviewOpen(false);
        clearSelectionHighlight();
        return;
    }
        const range = activeTaskId ? taskRangesRef.current[activeTaskId] : selectionRangeRef.current;
        if (!range) return;
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
                className="fixed z-30 flex flex-col bg-white border border-gray-200 shadow-lg rounded-full py-3 px-2 gap-3"
                style={{ top: toolbarPosition.top, left: toolbarPosition.left }}
                ref={toolbarRef}
            >
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
                        setShowFormatMenu(v => !v);
                        setMode('format');
                    }}
                />
                <ToolbarIcon
                    icon={<Smile className="w-4 h-4" />}
                    label="Shorten"
                    onClick={() => runAction({ mode: 'edit', preset: 'shorten', selectedText: selectionText })}
                />
                <ToolbarIcon
                    icon={<MessageSquarePlus className="w-4 h-4" />}
                    label="Add note"
                    onClick={() => runAction({ mode: 'edit', preset: 'elaborate', selectedText: selectionText })}
                />
            </div>
        );
    };

    const renderFormatMenu = () => {
        if (!showFormatMenu || !toolbarVisible) return null;
        return (
            <DropdownCard anchor={dropdownAnchor}>
                <div className="text-sm font-semibold text-gray-800 mb-2">Format templates</div>
                <div className="flex flex-col gap-1">
                    {formatTemplates.map(template => (
                        <MenuItem
                            key={template.id}
                            label={template.label}
                            icon={template.icon}
                            onClick={() => {
                                runAction({ mode: 'format', preset: template.id, selectedText: taskSelectionText || selectionText });
                                setShowFormatMenu(false);
                            }}
                        />
                    ))}
                </div>
            </DropdownCard>
        );
    };

    const handleRunCustomPrompt = () => {
        runAction({ mode: 'edit', preset: undefined, prompt: customPrompt, selectedText: activeTask?.selectionText || taskSelectionText || selectionText });
    };

    const renderPreview = () => {
        if (!isPreviewOpen) return null;
        return (
            <div data-askai-ui="true" className="fixed inset-0 z-40 flex items-start justify-center">
                <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px]" />
                <div
                    className="relative mt-12 w-[min(780px,92vw)] bg-white shadow-2xl border border-gray-200 rounded-2xl p-4"
                    ref={previewRef}
                >
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <Wand2 className="w-4 h-4 text-purple-500" />
                            <span>{previewTitle || (mode === 'format' ? 'Format' : 'Edit')}</span>
                            {isActiveLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                        </div>
                        <button
                            className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                            onClick={() => hidePanels()}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {totalCount > 1 && (
                        <div className="mb-3">
                            <select
                                className="w-full px-3 py-2 text-sm border rounded-lg text-gray-700"
                                value={activeTaskId || ''}
                    onChange={e => {
                        const next = e.target.value;
                        if (!next) return;
                        setActiveTaskView(next);
                    }}
                >
                                {tasks.map((t, idx) => (
                                    <option key={t.id} value={t.id}>
                                        Task {idx + 1} — {t.title} ({t.status})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-3 mb-4">
                        <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                            <div className="text-xs font-semibold text-gray-500 mb-2">Before</div>
                            <div className="text-sm text-gray-800 whitespace-pre-wrap">{activeTask?.selectionText || taskSelectionText || selectionText}</div>
                        </div>
                        <div className="border border-purple-100 rounded-xl p-3 bg-purple-50/60 min-h-[140px]">
                            <div className="text-xs font-semibold text-purple-600 mb-2">After</div>
                            <div
                                className="text-sm text-gray-900 leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-gray-400">等待生成...</p>' }}
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        {mode === 'edit' && (
                            <div className="flex flex-col gap-2">
                                <textarea
                                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[96px] resize-y"
                                    placeholder="在這裡輸入更長的提示，或貼上具體的修改說明"
                                    value={customPrompt}
                                    onChange={e => setCustomPrompt(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                            e.preventDefault();
                                            handleRunCustomPrompt();
                                        }
                                    }}
                                />
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                                        onClick={handleRunCustomPrompt}
                                        disabled={!customPrompt.trim() || isActiveLoading}
                                    >
                                        Generate
                                    </button>
                                    <select
                                        className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        onChange={e => {
                                            const preset = e.target.value as PresetId;
                                            if (!preset) return;
                                            runAction({ mode: 'edit', preset, selectedText: activeTask?.selectionText || taskSelectionText || selectionText });
                                            e.currentTarget.value = '';
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>
                                            Quick refine
                                        </option>
                                        {editPresets.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-2 justify-end flex-wrap">
                            {mode !== 'edit' && (
                                <select
                                    className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    onChange={e => {
                                        const preset = e.target.value as PresetId;
                                        if (!preset) return;
                                        runAction({ mode: 'edit', preset, selectedText: activeTask?.selectionText || taskSelectionText || selectionText });
                                        e.currentTarget.value = '';
                                    }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>
                                        Refine
                                    </option>
                                    {editPresets.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.label}
                                        </option>
                                    ))}
                                </select>
                            )}
                            <button
                                className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 ${isActiveLoading ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                onClick={handleInsert}
                                disabled={isActiveLoading || !previewHtml}
                            >
                                Replace
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    const renderTaskBadge = (placement: 'floating' | 'inline') => {
        if (totalCount === 0 || isPreviewOpen) return null;
        const isInline = placement === 'inline';
        const layoutClasses = isInline
            ? 'inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm whitespace-nowrap flex-shrink-0'
            : 'fixed z-30 bottom-4 left-4 w-16 h-16 rounded-full flex flex-col items-center justify-center gap-1 shadow-lg';
        return (
            <button
                type="button"
                data-askai-ui="true"
                className={`${layoutClasses} bg-purple-600 text-white transition-colors hover:bg-purple-500`}
                onClick={() => {
                    const lastTask = tasks[tasks.length - 1];
                    if (lastTask) {
                        setActiveTaskView(lastTask.id);
                        setIsPreviewOpen(true);
                    }
                }}
                title="Ask AI Tasking"
            >
                <span className="text-[10px] leading-none uppercase tracking-wide">Ask AI</span>
                <span className="text-xs font-semibold leading-none">
                    {completedCount}/{totalCount}
                </span>
            </button>
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
};

export type AskAiRunActionInput = RunActionInput;

const ToolbarIcon: React.FC<{
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
}> = ({ icon, label, active, onClick }) => {
    return (
        <button
            className={`w-10 h-10 inline-flex items-center justify-center rounded-full border transition-colors ${
                active ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 hover:border-blue-300 text-gray-600'
            }`}
            onMouseDown={e => e.preventDefault()}
            onClick={onClick}
            title={label}
        >
            {icon}
        </button>
    );
};

const DropdownCard: React.FC<{ anchor: { top: number; left: number }; children: React.ReactNode }> = ({
    anchor,
    children,
}) => {
    return (
        <div
            data-askai-ui="true"
            className="fixed z-40 w-64 bg-white border border-gray-200 shadow-xl rounded-2xl p-3"
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
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm ${
                disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-800 hover:bg-gray-50 active:bg-gray-100'
            }`}
            onMouseDown={e => e.preventDefault()}
            onClick={onClick}
        >
            {icon || <PenLine className="w-4 h-4" />}
            <span>{label}</span>
        </button>
    );
};
