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
}

interface AskAiSelectionProps {
    onRunAction?: (input: RunActionInput) => Promise<string>;
    onInsert?: (html: string) => void;
}

/**
 * Floating Ask AI UI for acting on highlighted text.
 * Designed as a standalone component so we can mount it in any editor surface.
 */
export const AskAiSelection: React.FC<AskAiSelectionProps> = ({
    onRunAction,
    onInsert,
}) => {
    const askAiRootAttr = { 'data-askai-ui': 'true' };
    const [selectionText, setSelectionText] = useState('');
    const [selectionRect, setSelectionRect] = useState<DOMRect | null>(null);
    const [mode, setMode] = useState<AskAiMode>('edit');
    const [showEditMenu, setShowEditMenu] = useState(false);
    const [showFormatMenu, setShowFormatMenu] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [previewHtml, setPreviewHtml] = useState<string | null>(null);
    const [previewTitle, setPreviewTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const selectionRangeRef = useRef<Range | null>(null);
    const toolbarRef = useRef<HTMLDivElement | null>(null);
    const previewRef = useRef<HTMLDivElement | null>(null);
    const [previewHeight, setPreviewHeight] = useState(360);
    const [toolbarSize, setToolbarSize] = useState({ width: 72, height: 200 });

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

    const toolbarPosition = useMemo(() => {
        if (!selectionRect) return { top: viewportSafeArea, left: viewportSafeArea };
        const toolbarWidth = toolbarSize.width || 72;
        const toolbarHeight = toolbarSize.height || 200;
        const baseLeft = window.scrollX + selectionRect.right + 8; // position to the right of selection
        const maxLeft = window.scrollX + window.innerWidth - toolbarWidth - viewportSafeArea;
        const clampedLeft = Math.max(viewportSafeArea, Math.min(baseLeft, maxLeft));
        const baseTop =
            window.scrollY + selectionRect.top + selectionRect.height / 2 - toolbarHeight / 2; // vertical center to selection
        const maxTop = window.scrollY + window.innerHeight - toolbarHeight - viewportSafeArea;
        const clampedTop = Math.max(viewportSafeArea, Math.min(baseTop, maxTop));
        return { top: clampedTop, left: clampedLeft };
    }, [selectionRect, toolbarSize]);

    const previewPosition = useMemo(() => {
        if (!selectionRect) return { top: 80, left: viewportSafeArea };
        const previewWidth = Math.min(720, window.innerWidth * 0.9);
        const baseLeft = window.scrollX + selectionRect.left + selectionRect.width / 2 - previewWidth / 2;
        const maxLeft = window.scrollX + window.innerWidth - previewWidth - viewportSafeArea;
        const clampedLeft = Math.max(viewportSafeArea, Math.min(baseLeft, maxLeft));

        const spaceAbove = selectionRect.top - viewportSafeArea;
        const placeAbove = spaceAbove > previewHeight + 24;
        const top = placeAbove
            ? window.scrollY + selectionRect.top - previewHeight - 16
            : window.scrollY + selectionRect.bottom + 12;

        return { top, left: clampedLeft };
    }, [selectionRect, previewHeight]);

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

    const captureSelection = () => {
        requestAnimationFrame(() => {
            const sel = window.getSelection();
            if (!sel || sel.rangeCount === 0) {
                clearSelectionState();
                return;
            }
            const text = sel.toString().trim();
            if (!text) {
                clearSelectionState();
                return;
            }
            const range = sel.getRangeAt(0);
            const rect = resolveSelectionRect(range);
            if (!rect) {
                clearSelectionState();
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

    const clearSelectionState = () => {
        setSelectionText('');
        setSelectionRect(null);
        selectionRangeRef.current = null;
        setShowEditMenu(false);
        setShowFormatMenu(false);
        setIsPreviewOpen(false);
        setPreviewHtml(null);
        setPreviewTitle('');
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
        if (!isPreviewOpen || !previewRef.current) return;
        const rect = previewRef.current.getBoundingClientRect();
        if (rect.height > 0) {
            setPreviewHeight(rect.height);
        }
    }, [isPreviewOpen, previewHtml]);

    useEffect(() => {
        if (!toolbarRef.current) return;
        const rect = toolbarRef.current.getBoundingClientRect();
        if (rect.width && rect.height) {
            setToolbarSize(prev => {
                if (prev.width === rect.width && prev.height === rect.height) return prev;
                return { width: rect.width, height: rect.height };
            });
        }
    }, [toolbarVisible, selectionText, showEditMenu, showFormatMenu]);

    const dropdownAnchor = useMemo(() => {
        const menuWidth = 256; // w-64
        const desiredLeft = toolbarPosition.left + toolbarSize.width + 12;
        const maxLeft = window.scrollX + window.innerWidth - menuWidth - viewportSafeArea;
        return {
            top: toolbarPosition.top,
            left: Math.max(viewportSafeArea, Math.min(desiredLeft, maxLeft)),
        };
    }, [toolbarPosition, toolbarSize]);

    const runAction = async (input: RunActionInput) => {
        if (!selectionText) return;
        setIsLoading(true);
        setMode(input.mode);
        setIsPreviewOpen(true);
        setPreviewTitle(labelForAction(input));

        const mockResponse = () => {
            if (input.mode === 'format') {
                if (input.preset === 'bullet') {
                    return `<ul class="list-disc pl-5"><li>${selectionText}</li><li>第二點</li></ul>`;
                }
                if (input.preset?.toString().startsWith('table')) {
                    const cols = input.preset === 'table-3' ? 3 : 2;
                    const headers = Array.from({ length: cols }, (_, i) => `Column ${i + 1}`).join('</th><th>');
                    return `<table class="table-auto border-collapse w-full"><thead><tr><th>${headers}</th></tr></thead><tbody><tr>${Array.from({ length: cols }, () => '<td>Value</td>').join('')}</tr></tbody></table>`;
                }
                if (input.preset === 'checklist') {
                    return `<ul class="list-none pl-0"><li>☐ ${selectionText}</li><li>☐ 下一步</li></ul>`;
                }
                if (input.preset === 'quote') {
                    return `<blockquote class="border-l-4 pl-3 italic text-gray-700">${selectionText}</blockquote>`;
                }
                return `<div>${selectionText}</div>`;
            }
            // Edit mock: just echo prompt or preset
            const promptHint = input.prompt ? `（${input.prompt}）` : '';
            return `<p>${selectionText}${promptHint ? ' ' + promptHint : ''}</p>`;
        };

        try {
            const html = await (onRunAction ? onRunAction(input) : Promise.resolve(mockResponse()));
            setPreviewHtml(html);
        } catch (err) {
            console.error('Ask AI run failed', err);
            setPreviewHtml('<p class="text-red-500">AI 輸出失敗，請重試。</p>');
        } finally {
            setIsLoading(false);
        }
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
        if (!previewHtml) return;
        if (onInsert) {
            onInsert(previewHtml);
            setIsPreviewOpen(false);
            return;
        }
        const range = selectionRangeRef.current;
        if (!range) return;
        const fragment = document.createDocumentFragment();
        const temp = document.createElement('div');
        temp.innerHTML = previewHtml;
        while (temp.firstChild) {
            fragment.appendChild(temp.firstChild);
        }
        range.deleteContents();
        range.insertNode(fragment);
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
                    active={showEditMenu}
                    onClick={() => {
                        setShowEditMenu(v => !v);
                        setShowFormatMenu(false);
                        setMode('edit');
                    }}
                />
                <ToolbarIcon
                    icon={<Sparkles className="w-4 h-4" />}
                    label="Format"
                    active={showFormatMenu}
                    onClick={() => {
                        setShowFormatMenu(v => !v);
                        setShowEditMenu(false);
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

    const renderEditMenu = () => {
        if (!showEditMenu || !toolbarVisible) return null;
        return (
            <DropdownCard anchor={dropdownAnchor}>
                <div className="text-sm font-semibold text-gray-800 mb-2">Modify with a prompt</div>
                <input
                    className="w-full mb-3 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Type a prompt..."
                    value={customPrompt}
                    onChange={e => setCustomPrompt(e.target.value)}
                />
                <button
                    className="w-full mb-2 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
                    disabled={!customPrompt.trim() || isLoading}
                    onClick={() => {
                        runAction({ mode: 'edit', preset: undefined, prompt: customPrompt, selectedText: selectionText });
                        setShowEditMenu(false);
                    }}
                >
                    Run prompt
                </button>
                <div className="flex flex-col gap-1">
                    {editPresets.map(preset => (
                        <MenuItem
                            key={preset.id}
                            label={preset.label}
                            disabled={preset.id === 'shorten' && selectionText.length === 0}
                            onClick={() => {
                                runAction({ mode: 'edit', preset: preset.id, prompt: customPrompt, selectedText: selectionText });
                                setShowEditMenu(false);
                            }}
                        />
                    ))}
                </div>
            </DropdownCard>
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
                                runAction({ mode: 'format', preset: template.id, selectedText: selectionText });
                                setShowFormatMenu(false);
                            }}
                        />
                    ))}
                </div>
            </DropdownCard>
        );
    };

    const renderPreview = () => {
        if (!isPreviewOpen || !selectionRect) return null;
        return (
            <div
                data-askai-ui="true"
                className="fixed z-40 w-[min(720px,90vw)] bg-white shadow-2xl border border-gray-200 rounded-2xl p-4"
                style={{ top: previewPosition.top, left: previewPosition.left }}
                ref={previewRef}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <Wand2 className="w-4 h-4 text-purple-500" />
                        <span>{previewTitle || (mode === 'format' ? 'Format' : 'Edit')}</span>
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    </div>
                    <button
                        className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                        onClick={() => setIsPreviewOpen(false)}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-3 mb-4">
                    <div className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                        <div className="text-xs font-semibold text-gray-500 mb-2">Before</div>
                        <div className="text-sm text-gray-800 whitespace-pre-wrap">{selectionText}</div>
                    </div>
                    <div className="border border-purple-100 rounded-xl p-3 bg-purple-50/60">
                        <div className="text-xs font-semibold text-purple-600 mb-2">After</div>
                        <div
                            className="text-sm text-gray-900 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-gray-400">等待生成...</p>' }}
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center md:gap-3 gap-2">
                    {mode === 'edit' && (
                        <input
                                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Refine with a prompt"
                                value={customPrompt}
                                onChange={e => setCustomPrompt(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        runAction({ mode: 'edit', preset: undefined, prompt: customPrompt, selectedText: selectionText });
                                    }
                                }}
                            />
                        )}
                        <div className="flex items-center gap-2">
                            <select
                                className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                onChange={e => {
                                    const preset = e.target.value as PresetId;
                                    if (!preset) return;
                                    runAction({ mode: 'edit', preset, selectedText: selectionText });
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
                        <button
                            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 ${isLoading ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                            onClick={handleInsert}
                            disabled={isLoading || !previewHtml}
                        >
                            Insert
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        (typeof document === 'undefined')
            ? null
            : createPortal(
                <>
                    {renderToolbar()}
                    {renderEditMenu()}
                    {renderFormatMenu()}
                    {renderPreview()}
                </>,
                document.body
              )
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
            onClick={onClick}
        >
            {icon || <PenLine className="w-4 h-4" />}
            <span>{label}</span>
        </button>
    );
};
