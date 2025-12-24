import { Editor, getHTMLFromFragment } from '@tiptap/core';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import StarterKit from '@tiptap/starter-kit';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../utils/cn';
import { AskAiMark } from './editor/AskAiMark';
import { ImageResizeToolbar } from './editor/ImageResizeToolbar';
import { SanitizeUtils } from '../utils/sanitizeUtils';

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
    clearBold: (options?: {
      removeBold?: boolean;
      removeBlockquotes?: boolean;
      removeQuotes?: boolean;
      target?: 'selection' | 'document';
      scope?: { from: number; to: number };
    }) => boolean;
    summarizeFormatting: () => {
      boldMarks: number;
      blockquotes: number;
      quoteChars: number;
      blocks: Array<{
        from: number;
        to: number;
        text: string;
        boldMarks: number;
        blockquotes: number;
        quoteChars: number;
        type: string;
      }>;
    };
    listCleanupTargets: () => Array<{
      from: number;
      to: number;
      text: string;
      boldMarks: number;
      blockquotes: number;
      quoteChars: number;
      type: string;
    }>;
    focus: () => void;
    editor: Editor;
  }) => void;
  onSelectionChange?: (data: {
    text: string;
    html: string;
    rect: DOMRect | null;
    range: { from: number; to: number } | null;
  }) => void;
  onAskAiClick?: (taskId: string) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
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
  onSelectionChange,
  onAskAiClick,
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
  const onSelectionChangeRef = useRef(onSelectionChange);
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);
  const onAskAiClickRef = useRef(onAskAiClick);
  useEffect(() => {
    onAskAiClickRef.current = onAskAiClick;
  }, [onAskAiClick]);

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
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              renderHTML: (attributes) => ({
                width: attributes.width,
              }),
              parseHTML: (element) => element.getAttribute('width'),
            },
            height: {
              default: null,
              renderHTML: (attributes) => ({
                height: attributes.height,
              }),
              parseHTML: (element) => element.getAttribute('height'),
            },
          };
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'image'],
      }),
      BubbleMenuExtension.configure({
        element: null, // Headless mode, we use the BubbleMenu component
      }),
      Placeholder.configure({ placeholder }),
    ],
    [placeholder]
  );

  const isInternalUpdateRef = useRef(false);

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
            contentClassName
          ),
          style: contentStyle as any,
        },
        handleDOMEvents: {
          click: (view, event) => {
            const target = event.target as HTMLElement;
            const mark = target.closest('mark.ask-ai-highlight');
            if (mark) {
              const taskId = mark.getAttribute('data-ask-ai-task');
              if (taskId) {
                onAskAiClickRef.current?.(taskId);
                return true; // Consume event
              }
            }
            return false;
          },
        },
      },
      onUpdate: ({ editor }) => {
        if (isInternalUpdateRef.current) return;
        const html = editor.getHTML();
        const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, ' ');
        onChangeRef.current?.(html, text);
      },
      onSelectionUpdate: ({ editor }) => {
        if (isInternalUpdateRef.current) return;
        const { from, to } = editor.state.selection;
        const isCollapsed = from === to;

        // Use \n\n for clear separation between paragraphs in plain text
        const text = isCollapsed ? '' : editor.state.doc.textBetween(from, to, '\n\n');

        // Get the structured HTML content of the selection
        let html = '';
        if (!isCollapsed) {
          const slice = editor.state.selection.content();
          html = getHTMLFromFragment(slice.content, editor.schema);
        }

        let rect: DOMRect | null = null;
        if (!isCollapsed) {
          try {
            const { view } = editor;
            const start = view.coordsAtPos(from);
            const end = view.coordsAtPos(to);
            rect = new DOMRect(
              start.left,
              start.top,
              end.right - start.left,
              end.bottom - start.top || 24 // fallback height
            );
          } catch (e) {}
        }

        onSelectionChangeRef.current?.({
          text,
          html,
          rect,
          range: isCollapsed ? null : { from, to },
        });
      },
    });

    contentClassRef.current = contentClassName;
    contentStyleRef.current = contentStyle;
    editorRef.current = editor;

    const stripMarkdownEmphasis = (options?: {
      fallbackToDoc?: boolean;
      stripQuotes?: boolean;
      stripBlockquoteChars?: boolean;
      stripAsterisks?: boolean;
      scope?: { from: number; to: number };
      dispatch?: boolean;
    }) => {
      const ed = editorRef.current;
      if (!ed) return { changed: false, tr: null as any };
      const { state } = ed;
      const { from, to } = options?.scope || state.selection;
      const hasSelection = from !== to;
      const targetFrom = hasSelection ? from : options?.fallbackToDoc ? 0 : null;
      const targetTo = hasSelection ? to : options?.fallbackToDoc ? state.doc.content.size : null;
      if (targetFrom === null || targetTo === null) return { changed: false, tr: null as any };

      let tr = state.tr;
      let changed = false;
      const stripQuotes = options?.stripQuotes !== false;
      const stripBlockquoteChars = options?.stripBlockquoteChars !== false;
      const stripAsterisks = options?.stripAsterisks !== false;

      state.doc.nodesBetween(targetFrom, targetTo, (node, pos) => {
        if (!node.isText || !node.text) return;

        const nodeStart = pos;
        const nodeEnd = pos + node.nodeSize;
        const clampedFrom = Math.max(nodeStart, targetFrom);
        const clampedTo = Math.min(nodeEnd, targetTo);
        const localFrom = clampedFrom - nodeStart;
        const localTo = clampedTo - nodeStart;

        const segment = node.text.slice(localFrom, localTo);
        let cleanedSegment = segment;
        if (stripAsterisks) cleanedSegment = cleanedSegment.replace(/\*/g, '');
        if (stripBlockquoteChars) cleanedSegment = cleanedSegment.replace(/>/g, '');
        if (stripQuotes) cleanedSegment = cleanedSegment.replace(/[\"“”「」]/g, '');

        if (segment === cleanedSegment) return;

        const newText = node.text.slice(0, localFrom) + cleanedSegment + node.text.slice(localTo);
        const mappedFrom = tr.mapping.map(nodeStart);
        const mappedTo = tr.mapping.map(nodeEnd);
        tr = tr.replaceRangeWith(mappedFrom, mappedTo, state.schema.text(newText, node.marks));
        changed = true;
      });

      if (changed) {
        if (options?.dispatch === false) {
          return { changed, tr };
        }
        ed.view.dispatch(tr);
      }
      return { changed, tr };
    };

    const summarizeFormatting = () => {
      const ed = editorRef.current;
      if (!ed) return { boldMarks: 0, blockquotes: 0, quoteChars: 0, blocks: [] };
      const boldMark = ed.state.schema.marks.bold;
      let boldMarks = 0;
      let blockquotes = 0;
      let quoteChars = 0;
      const blocks: Array<{
        from: number;
        to: number;
        text: string;
        boldMarks: number;
        blockquotes: number;
        quoteChars: number;
        type: string;
      }> = [];

      ed.state.doc.descendants((node, pos) => {
        if (node.type.name === 'blockquote') {
          blockquotes += 1;
        }

        if (node.isText && node.text) {
          if (boldMark && node.marks.some((mark) => mark.type === boldMark)) {
            boldMarks += 1;
          }
          const matches = node.text.match(/[\"“”「」]/g);
          if (matches) {
            quoteChars += matches.length;
          }
        }

        if (node.isBlock) {
          let blockBold = node.type.name === 'blockquote' ? 1 : 0;
          let blockBlockquote = node.type.name === 'blockquote' ? 1 : 0;
          let blockQuotes = 0;

          node.descendants((child) => {
            if (child.type.name === 'blockquote') {
              blockBlockquote += 1;
            }
            if (child.isText && child.text) {
              if (boldMark && child.marks.some((mark) => mark.type === boldMark)) {
                blockBold += 1;
              }
              const matches = child.text.match(/[\"“”「」]/g);
              if (matches) {
                blockQuotes += matches.length;
              }
            }
          });

          const text = node.textBetween(0, node.content.size, ' ', ' ').trim();
          blocks.push({
            from: pos,
            to: pos + node.nodeSize,
            text,
            boldMarks: blockBold,
            blockquotes: blockBlockquote,
            quoteChars: blockQuotes,
            type: node.type.name,
          });
        }
      });

      return { boldMarks, blockquotes, quoteChars, blocks };
    };

    const listCleanupTargets = () => {
      const summary = summarizeFormatting();
      return summary.blocks.filter((b) => b.boldMarks > 0 || b.blockquotes > 0 || b.quoteChars > 0);
    };

    if (onReadyRef.current) {
      const api = {
        getSelectedText: () => {
          const { from, to } = editor.state.selection;
          if (from === to) return '';
          return editor.state.doc.textBetween(from, to, ' ');
        },
        insertHtml: (html: string) =>
          editor.chain().focus().insertContent(SanitizeUtils.sanitizeHtml(html)).run(),
        insertImage: (src: string, alt: string = '') =>
          editor.chain().focus().setImage({ src, alt }).run(),
        getPlainText: () => editor.state.doc.textBetween(0, editor.state.doc.content.size, ' '),
        getHtml: () => editor.getHTML(),
        setHtml: (html: string) => editor.commands.setContent(SanitizeUtils.sanitizeHtml(html)),
        getSelectionRange: () => {
          const { from, to } = editor.state.selection;
          return { from, to };
        },
        replaceRange: (range: { from: number; to: number }, html: string) =>
          editor.chain().focus().insertContentAt(range, html).run(),
        markAskAiRange: (range: { from: number; to: number }, taskId: string) => {
          editor.chain().setTextSelection(range).setAskAiMark({ taskId }).run();
        },
        clearAskAiMarks: (taskId?: string) => {
          const ed = editorRef.current;
          if (!ed) return;
          const { state } = ed;
          const askAiMark = state.schema.marks.askai;
          if (!askAiMark) return;
          let tr = state.tr;
          state.doc.descendants((node, pos) => {
            if (!node.isText) return;
            node.marks.forEach((mark) => {
              if (mark.type !== askAiMark) return;
              if (taskId && mark.attrs.taskId !== taskId) return;
              tr = tr.removeMark(pos, pos + node.nodeSize, askAiMark);
            });
          });
          if (tr.docChanged) {
            ed.view.dispatch(tr);
          }
        },
        findAskAiRange: (taskId: string) => {
          const ed = editorRef.current;
          if (!ed) return null;
          const { state } = ed;
          const askAiMark = state.schema.marks.askai;
          if (!askAiMark) return null;
          let from: number | null = null;
          let to: number | null = null;
          state.doc.descendants((node, pos) => {
            if (!node.isText) return;
            const hasMark = node.marks.some(
              (mark) => mark.type === askAiMark && mark.attrs.taskId === taskId
            );
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
        setLink: (href: string) =>
          editor.chain().focus().extendMarkRange('link').setLink({ href }).run(),
        unsetLink: () => editor.chain().focus().unsetLink().run(),
        undo: () => editor.chain().focus().undo().run(),
        redo: () => editor.chain().focus().redo().run(),
        clearBold: (options?: {
          removeBold?: boolean;
          removeBlockquotes?: boolean;
          removeQuotes?: boolean;
          target?: 'selection' | 'document';
          scope?: { from: number; to: number };
        }) => {
          const ed = editorRef.current;
          if (!ed) return false;
          const { state } = ed;
          const removeBold = options?.removeBold !== false;
          const removeBlockquotes = options?.removeBlockquotes !== false;
          const removeQuotes = options?.removeQuotes !== false;
          const targetDocument = options?.target === 'document';
          const customScope = options?.scope;
          const { from, to } = state.selection;
          const hasSelection = from !== to;
          const scopeFrom = customScope?.from ?? (targetDocument || !hasSelection ? 0 : from);
          const scopeTo =
            customScope?.to ?? (targetDocument || !hasSelection ? state.doc.content.size : to);

          let changed = false;
          const { tr: strippedTr, changed: stripped } = stripMarkdownEmphasis({
            fallbackToDoc: targetDocument || !hasSelection,
            stripQuotes: removeQuotes,
            stripBlockquoteChars: true,
            stripAsterisks: true,
            scope: { from: scopeFrom, to: scopeTo },
            dispatch: false,
          });

          let tr = strippedTr || state.tr;
          changed = changed || stripped;

          if (removeBold) {
            const boldMark = state.schema.marks.bold;
            if (boldMark) {
              state.doc.descendants((node, pos) => {
                if (!node.isText) return;
                if (!node.marks.some((mark) => mark.type === boldMark)) return;
                const nodeStart = pos;
                const nodeEnd = pos + node.nodeSize;
                if (nodeEnd <= scopeFrom || nodeStart >= scopeTo) return;
                const mappedFrom = tr.mapping.map(pos);
                const mappedTo = tr.mapping.map(pos + node.nodeSize);
                tr = tr.removeMark(mappedFrom, mappedTo, boldMark);
                changed = true;
              });
            }
          }

          if (removeBlockquotes) {
            const blockquoteType = state.schema.nodes.blockquote;
            if (blockquoteType) {
              state.doc.descendants((node, pos) => {
                if (node.type !== blockquoteType) return;
                const nodeStart = pos;
                const nodeEnd = pos + node.nodeSize;
                if (nodeEnd <= scopeFrom || nodeStart >= scopeTo) return;
                const mappedFrom = tr.mapping.map(nodeStart);
                const mappedTo = tr.mapping.map(nodeEnd);
                tr = tr.replaceWith(mappedFrom, mappedTo, node.content);
                changed = true;
              });
            }
          }

          if (changed && tr) {
            ed.view.dispatch(tr);
          }
          return changed;
        },
        summarizeFormatting,
        listCleanupTargets,
        focus: () => editor.chain().focus().run(),
        editor,
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
    const baseClass = cn(
      'editor-content prose prose-lg max-w-none focus:outline-none min-h-full',
      contentClassName
    );
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
      isInternalUpdateRef.current = true;
      try {
        editor.commands.setContent(initialHtml);
      } finally {
        isInternalUpdateRef.current = false;
      }
    }
  }, [initialHtml]);

  const [imageMenuPos, setImageMenuPos] = useState<{ top: number; left: number } | null>(null);

  // Update menu position on selection change
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleUpdate = () => {
      if (editor.isActive('image')) {
        const { view } = editor;
        const { selection } = view.state;
        try {
          const node = view.nodeDOM(selection.from) as HTMLElement;
          if (node) {
            const rect = node.getBoundingClientRect();
            const containerRect = editorElementRef.current?.parentElement?.getBoundingClientRect();
            if (containerRect) {
              setImageMenuPos({
                top: rect.top - containerRect.top - 50,
                left: rect.left - containerRect.left + rect.width / 2,
              });
              return;
            }
          }
        } catch (e) {}
      }
      setImageMenuPos(null);
    };

    editor.on('selectionUpdate', handleUpdate);
    editor.on('transaction', handleUpdate);
    return () => {
      editor.off('selectionUpdate', handleUpdate);
      editor.off('transaction', handleUpdate);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('flex-1 bg-white flex flex-col min-h-0 overflow-hidden relative', className)}
    >
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <div className="h-full overflow-y-auto custom-scrollbar">
          <div ref={editorElementRef} className="h-full" />
        </div>

        {imageMenuPos && editorRef.current && (
          <div
            className="absolute z-50 -translate-x-1/2 pointer-events-auto"
            style={{ top: imageMenuPos.top, left: imageMenuPos.left }}
          >
            <ImageResizeToolbar
              onResize={(size) => {
                const widthMap = { small: '300px', medium: '600px', full: '100%', original: null };
                editorRef.current
                  ?.chain()
                  .focus()
                  .updateAttributes('image', { width: widthMap[size] })
                  .run();
              }}
              onAlign={(align) => editorRef.current?.chain().focus().setTextAlign(align).run()}
              onRemove={() => editorRef.current?.chain().focus().deleteSelection().run()}
              currentWidth={editorRef.current.getAttributes('image').width}
              currentAlign={
                editorRef.current.isActive({ textAlign: 'left' })
                  ? 'left'
                  : editorRef.current.isActive({ textAlign: 'center' })
                    ? 'center'
                    : editorRef.current.isActive({ textAlign: 'right' })
                      ? 'right'
                      : null
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};
