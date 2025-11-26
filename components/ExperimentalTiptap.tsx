import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from '../utils/cn';

interface ExperimentalTiptapProps {
    placeholder?: string;
    className?: string;
}

export const ExperimentalTiptap: React.FC<ExperimentalTiptapProps> = ({
    placeholder = 'Write notes or outline ideas here...',
    className,
}) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder,
            })
        ],
        content: '',
    });

    return (
        <div className={cn("border border-gray-200 rounded-lg bg-white shadow-sm", className)}>
            <div className="px-3 py-2 border-b border-gray-100 text-[10px] font-bold uppercase text-gray-500">
                TipTap Scratchpad (Experimental)
            </div>
            <div className="p-3">
                <EditorContent editor={editor} className="prose prose-sm max-w-none min-h-[120px] focus:outline-none" />
            </div>
        </div>
    );
};
