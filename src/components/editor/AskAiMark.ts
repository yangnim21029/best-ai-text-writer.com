import { Mark, mergeAttributes } from '@tiptap/core';

export interface AskAiMarkOptions {
    HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
    interface Commands<ReturnType> {
        askai: {
            setAskAiMark: (attrs: { taskId: string }) => ReturnType;
            unsetAskAiMark: () => ReturnType;
        };
    }
}

export const AskAiMark = Mark.create<AskAiMarkOptions>({
    name: 'askai',

    addOptions() {
        return {
            HTMLAttributes: { class: 'ask-ai-highlight' },
        };
    },

    addAttributes() {
        return {
            taskId: {
                default: null,
                parseHTML: element => element.getAttribute('data-ask-ai-task'),
                renderHTML: attributes => ({
                    'data-ask-ai-task': attributes.taskId || undefined,
                }),
            },
        };
    },

    parseHTML() {
        return [{ tag: 'mark[data-ask-ai-task]' }];
    },

    renderHTML({ HTMLAttributes }) {
        return ['mark', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
    },

    addCommands() {
        return {
            setAskAiMark:
                attrs =>
                    ({ chain }) =>
                        chain().setMark(this.name, attrs).run(),
            unsetAskAiMark:
                () =>
                    ({ chain }) =>
                        chain().unsetMark(this.name).run(),
        };
    },
});
