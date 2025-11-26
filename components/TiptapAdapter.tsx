import { Editor } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import StarterKit from '@tiptap/starter-kit';
import React, { useEffect, useMemo, useRef } from 'react';
import { cn } from '../utils/cn';

interface TiptapAdapterProps {
    initialHtml: string;
    placeholder?: string;
    className?: string;
    onChange?: (html: string, plainText: string) => void;
    onReady?: (api: {
        getSelectedText: () => string;
        insertHtml: (html: string) => void;
        insertImage: (src: string, alt?: string) => void;
        getPlainText: () => string;
        setHtml: (html: string) => void;
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
    }) => void;
    containerRef?: React.RefObject<HTMLDivElement>;
}

// Headless Tiptap adapter: mounts a ProseMirror view on a plain div and exposes a minimal command API.
export const TiptapAdapter: React.FC<TiptapAdapterProps> = ({
    initialHtml,
    placeholder = 'Start writing...',
    className,
    onChange,
    onReady,
    containerRef,
}) => {
    const editorElementRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<Editor | null>(null);
    const onChangeRef = useRef(onChange);
    const onReadyRef = useRef(onReady);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        onReadyRef.current = onReady;
    }, [onReady]);

    const extensions = useMemo(
        () => [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            Underline,
            Link.configure({
                autolink: true,
                linkOnPaste: true,
                openOnClick: false,
            }),
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
                    class:
                        'editor-content prose prose-lg max-w-none p-8 md:p-12 focus:outline-none flex-1 overflow-y-auto custom-scrollbar pb-20 min-h-0',
                },
            },
            onUpdate: ({ editor }) => {
                const html = editor.getHTML();
                const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ');
                onChangeRef.current?.(html, text);
            },
        });

        editorRef.current = editor;

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
                setHtml: (html: string) => editor.commands.setContent(html),
                toggleUnderline: () => editor.chain().focus().toggleUnderline().run(),
                toggleBold: () => editor.chain().focus().toggleBold().run(),
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
                clearBold: () => editor.chain().focus().unsetMark('bold').run(),
            };
            onReadyRef.current(api);
        }

        return () => {
            editor.destroy();
            editorRef.current = null;
        };
    }, [extensions]);

    // Keep content in sync when parent updates initialHtml
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;
        if (initialHtml !== editor.getHTML()) {
            editor.commands.setContent(initialHtml);
        }
    }, [initialHtml]);

    return (
        <div ref={containerRef} className={cn('flex-1 bg-white', className)}>
            <div ref={editorElementRef} />
        </div>
    );
};
