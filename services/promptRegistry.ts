import { promptTemplates, PromptTemplateKey } from './promptTemplates';

export type PromptType = PromptTemplateKey;

export const promptRegistry = {
    build: (type: PromptType, payload: any) => {
        const template = promptTemplates[type];
        if (!template) throw new Error(`Unknown prompt type: ${type}`);
        return template(payload);
    }
};
