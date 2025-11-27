import { Editor } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import React, { useEffect, useMemo, useRef } from 'react';
import { cn } from '../utils/cn';

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
        highlightRange: (range: { from: number; to: number }) => void;
        clearHighlight: () => void;
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
            Highlight.configure({ multicolor: false }),
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

        const stripMarkdownEmphasis = () => {
            const ed = editorRef.current;
            if (!ed) return false;
            const { from, to } = ed.state.selection;
            if (from === to) return false;
            const text = ed.state.doc.textBetween(from, to, ' ');
            const cleaned = text.replace(/^\s*\*{1,2}([\s\S]*?)\*{1,2}\s*$/, '$1');
            if (cleaned === text) return false;
            ed
                .chain()
                .focus()
                .insertContentAt({ from, to }, cleaned)
                .setTextSelection({ from, to: from + cleaned.length })
                .run();
            return true;
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
                highlightRange: (range) =>
                    editor.chain().setTextSelection(range).setHighlight().run(),
                clearHighlight: () => editor.chain().unsetHighlight().run(),
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
                    stripMarkdownEmphasis();
                    return editor.chain().focus().unsetMark('bold').run();
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
