import { Editor } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import StarterKit from '@tiptap/starter-kit';
import React, { useEffect, useMemo, useRef } from 'react';
import { cn } from '../utils/cn';
import { AskAiMark } from './editor/AskAiMark';

interface TiptapAdapterProps {
    initialHtml: string;
    placeholder?: string;
    className?: string;
    contentClassName?: string;
    contentStyle?: React.CSSProperties;
    onChange?: (html: string, plainText: string) => void;
    onReady?: (api: {
        getSelectedText: () => string;
        insertHtml: (html: string) => void;
        insertImage: (src: string, alt?: string) => void;
        getPlainText: () => string;
        getHtml: () => string;
        setHtml: (html: string) => void;
        getSelectionRange: () => { from: number; to: number };
        replaceRange: (range: { from: number; to: number }, html: string) => void;
        markAskAiRange: (range: { from: number; to: number }, taskId: string) => void;
        clearAskAiMarks: (taskId?: string) => void;
        findAskAiRange: (taskId: string) => { from: number; to: number } | null;
        toggleUnderline: () => void;
        toggleBold: () => void;
        toggleItalic: () => void;
        toggleHeading: (level: 1 | 2 | 3) => void;
        toggleBlockquote: () => void;
        toggleBulletList: () => void;
        toggleOrderedList: () => void;
        setTextAlign: (align: 'left' | 'center' | 'right' | 'justify') => void;
        setLink: (href: string) => void;
        unsetLink: () => void;
        undo: () => void;
        redo: () => void;
        clearBold: () => void;
        focus: () => void;
    }) => void;
    containerRef?: React.RefObject<HTMLDivElement>;
}

// Headless Tiptap adapter: mounts a ProseMirror view on a plain div and exposes a minimal command API.
export const TiptapAdapter: React.FC<TiptapAdapterProps> = ({
    initialHtml,
    placeholder = 'Start writing...',
    className,
    contentClassName,
    contentStyle,
    onChange,
    onReady,
    containerRef,
}) => {
    const editorElementRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<Editor | null>(null);
    const onChangeRef = useRef(onChange);
    const onReadyRef = useRef(onReady);
    const contentClassRef = useRef(contentClassName);
    const contentStyleRef = useRef(contentStyle);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        onReadyRef.current = onReady;
    }, [onReady]);

    const extensions = useMemo(
        () => [
            // Disable built-in link/underline in StarterKit to avoid duplicate extension name warnings.
            StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false, underline: false }),
            Link.configure({
                autolink: true,
                linkOnPaste: true,
                openOnClick: false,
            }),
            AskAiMark,
            Image,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Placeholder.configure({ placeholder }),
        ],
        [placeholder],
    );

    // Create/destroy the headless editor
    useEffect(() => {
        if (!editorElementRef.current) return;

        const editor = new Editor({
            element: editorElementRef.current,
            extensions,
            content: initialHtml,
            editorProps: {
                attributes: {
                    class: cn(
                        'editor-content prose prose-lg max-w-none focus:outline-none min-h-full pt-0',
                        contentClassName,
                    ),
                    style: contentStyle as any,
                },
            },
            onUpdate: ({ editor }) => {
                const html = editor.getHTML();
                const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ');
                onChangeRef.current?.(html, text);
            },
        });

        contentClassRef.current = contentClassName;
        contentStyleRef.current = contentStyle;
        editorRef.current = editor;

        const stripMarkdownEmphasis = (options?: { fallbackToDoc?: boolean }) => {
            const ed = editorRef.current;
            if (!ed) return false;
            const { state } = ed;
            const { from, to } = state.selection;
            const hasSelection = from !== to;
            const targetFrom = hasSelection ? from : options?.fallbackToDoc ? 0 : null;
            const targetTo = hasSelection ? to : options?.fallbackToDoc ? state.doc.content.size : null;
            if (targetFrom === null || targetTo === null) return false;

            let tr = state.tr;
            let changed = false;

            state.doc.nodesBetween(targetFrom, targetTo, (node, pos) => {
                if (!node.isText || !node.text) return;

                const nodeStart = pos;
                const nodeEnd = pos + node.nodeSize;
                const clampedFrom = Math.max(nodeStart, targetFrom);
                const clampedTo = Math.min(nodeEnd, targetTo);
                const localFrom = clampedFrom - nodeStart;
                const localTo = clampedTo - nodeStart;

                const segment = node.text.slice(localFrom, localTo);
                const cleanedSegment = segment.replace(/\*/g, '').replace(/>/g, '');

                if (segment === cleanedSegment) return;

                const newText = node.text.slice(0, localFrom) + cleanedSegment + node.text.slice(localTo);
                const mappedFrom = tr.mapping.map(nodeStart);
                const mappedTo = tr.mapping.map(nodeEnd);
                tr = tr.replaceRangeWith(
                    mappedFrom,
                    mappedTo,
                    state.schema.text(newText, node.marks),
                );
                changed = true;
            });

            if (changed) {
                ed.view.dispatch(tr);
            }
            return changed;
        };

        if (onReadyRef.current) {
            const api = {
                getSelectedText: () => {
                    const { from, to } = editor.state.selection;
                    if (from === to) return '';
                    return editor.state.doc.textBetween(from, to, ' ');
                },
                insertHtml: (html: string) => editor.chain().focus().insertContent(html).run(),
                insertImage: (src: string, alt: string = '') =>
                    editor.chain().focus().setImage({ src, alt }).run(),
                getPlainText: () => editor.state.doc.textBetween(0, editor.state.doc.content.size, ' '),
                getHtml: () => editor.getHTML(),
                setHtml: (html: string) => editor.commands.setContent(html),
                getSelectionRange: () => {
                    const { from, to } = editor.state.selection;
                    return { from, to };
                },
                replaceRange: (range, html: string) =>
                    editor.chain().focus().insertContentAt(range, html).run(),
                markAskAiRange: (range, taskId) => {
                    editor.chain().setTextSelection(range).setAskAiMark({ taskId }).run();
                },
                clearAskAiMarks: (taskId) => {
                    const ed = editorRef.current;
                    if (!ed) return;
                    const { state } = ed;
                    const askAiMark = state.schema.marks.askai;
                    if (!askAiMark) return;
                    let tr = state.tr;
                    state.doc.descendants((node, pos) => {
                        if (!node.isText) return;
                        node.marks.forEach(mark => {
                            if (mark.type !== askAiMark) return;
                            if (taskId && mark.attrs.taskId !== taskId) return;
                            tr = tr.removeMark(pos, pos + node.nodeSize, askAiMark);
                        });
                    });
                    if (tr.docChanged) {
                        ed.view.dispatch(tr);
                    }
                },
                findAskAiRange: (taskId) => {
                    const ed = editorRef.current;
                    if (!ed) return null;
                    const { state } = ed;
                    const askAiMark = state.schema.marks.askai;
                    if (!askAiMark) return null;
                    let from: number | null = null;
                    let to: number | null = null;
                    state.doc.descendants((node, pos) => {
                        if (!node.isText) return;
                        const hasMark = node.marks.some(mark => mark.type === askAiMark && mark.attrs.taskId === taskId);
                        if (!hasMark) return;
                        const start = pos;
                        const end = pos + node.nodeSize;
                        from = from === null ? start : Math.min(from, start);
                        to = to === null ? end : Math.max(to, end);
                    });
                    if (from === null || to === null) return null;
                    return { from, to };
                },
                toggleUnderline: () => editor.chain().focus().toggleUnderline().run(),
                toggleBold: () => {
                    stripMarkdownEmphasis();
                    return editor.chain().focus().toggleBold().run();
                },
                toggleItalic: () => editor.chain().focus().toggleItalic().run(),
                toggleHeading: (level: 1 | 2 | 3) => editor.chain().focus().toggleHeading({ level }).run(),
                toggleBlockquote: () => editor.chain().focus().toggleBlockquote().run(),
                toggleBulletList: () => editor.chain().focus().toggleBulletList().run(),
                toggleOrderedList: () => editor.chain().focus().toggleOrderedList().run(),
                setTextAlign: (align: 'left' | 'center' | 'right' | 'justify') =>
                    editor.chain().focus().setTextAlign(align).run(),
                setLink: (href: string) => editor.chain().focus().extendMarkRange('link').setLink({ href }).run(),
                unsetLink: () => editor.chain().focus().unsetLink().run(),
                undo: () => editor.chain().focus().undo().run(),
                redo: () => editor.chain().focus().redo().run(),
                clearBold: () => {
                    const removed = stripMarkdownEmphasis({ fallbackToDoc: true });
                    if (editor.isActive('blockquote')) {
                        editor.chain().focus().toggleBlockquote().run();
                    }
                    return removed;
                },
                focus: () => editor.chain().focus().run(),
            };
            onReadyRef.current(api);
        }

        return () => {
            editor.destroy();
            editorRef.current = null;
        };
    }, [extensions]);

    // Update className/style on content when props change after init
    useEffect(() => {
        const el = editorElementRef.current;
        if (!el) return;
        const baseClass = cn('editor-content prose prose-lg max-w-none focus:outline-none min-h-full', contentClassName);
        if (el.className !== baseClass) el.className = baseClass;
        if (contentStyle) {
            Object.assign(el.style, contentStyle);
        }
        contentClassRef.current = contentClassName;
        contentStyleRef.current = contentStyle;
    }, [contentClassName, contentStyle]);

    // Keep content in sync when parent updates initialHtml
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;
        if (initialHtml !== editor.getHTML()) {
            editor.commands.setContent(initialHtml);
        }
    }, [initialHtml]);

    return (
        <div
            ref={containerRef}
            className={cn('flex-1 bg-white flex flex-col min-h-0 overflow-hidden relative', className)}
        >
            <div className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full overflow-y-auto custom-scrollbar">
                    <div ref={editorElementRef} className="h-full" />
                </div>
            </div>
        </div>
    );
};
