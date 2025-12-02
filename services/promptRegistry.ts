import { promptTemplates, PromptTemplateKey } from './promptTemplates';
import { TargetAudience } from '../types';

export type PromptType = PromptTemplateKey;

export const promptRegistry = {
    build: (type: PromptType, payload: any) => {
        const template = promptTemplates[type];
        if (!template) throw new Error(`Unknown prompt type: ${type}`);
        return template(payload);
    },

    // Explicit typed methods for better DX
    sectionContent: (payload: Parameters<typeof promptTemplates.sectionContent>[0]) => promptTemplates.sectionContent(payload),
    keywordActionPlan: (payload: Parameters<typeof promptTemplates.keywordActionPlan>[0]) => promptTemplates.keywordActionPlan(payload),
    productBrief: (payload: Parameters<typeof promptTemplates.productBrief>[0]) => promptTemplates.productBrief(payload),
    productMapping: (payload: Parameters<typeof promptTemplates.productMapping>[0]) => promptTemplates.productMapping(payload),
    brandSummary: (payload: Parameters<typeof promptTemplates.brandSummary>[0]) => promptTemplates.brandSummary(payload),
    visualStyle: (payload: Parameters<typeof promptTemplates.visualStyle>[0]) => promptTemplates.visualStyle(payload),
    snippet: (payload: Parameters<typeof promptTemplates.snippet>[0]) => promptTemplates.snippet(payload),
    sectionHeading: (payload: Parameters<typeof promptTemplates.sectionHeading>[0]) => promptTemplates.sectionHeading(payload),
    refineHeadings: (articleTitle: string, headings: string[], languageInstruction: string) => promptTemplates.batchRefineHeadings({ articleTitle, headings, languageInstruction }),
    metaSeo: (payload: Parameters<typeof promptTemplates.metaSeo>[0]) => promptTemplates.metaSeo(payload),
    rebrandContent: (payload: Parameters<typeof promptTemplates.rebrandContent>[0]) => promptTemplates.rebrandContent(payload),
    smartFindBlock: (payload: Parameters<typeof promptTemplates.smartFindBlock>[0]) => promptTemplates.smartFindBlock(payload),
    smartRewriteBlock: (payload: Parameters<typeof promptTemplates.smartRewriteBlock>[0]) => promptTemplates.smartRewriteBlock(payload),
    productContext: (rawText: string) => promptTemplates.productContextFromText({ rawText }),
    authorityAnalysis: (authorityTerms: string, title: string, websiteType: string, languageInstruction: string) => promptTemplates.authorityAnalysis({ authorityTerms, title, websiteType, languageInstruction }),
    referenceAnalysis: (content: string, targetAudience: TargetAudience, languageInstruction: string) => promptTemplates.referenceStructure({ content, targetAudience, languageInstruction }),
    keywordAnalysis: (content: string, targetAudience: TargetAudience, languageInstruction: string) => promptTemplates.keywordAnalysis({ content, targetAudience, languageInstruction }),
    imagePromptFromContext: (payload: Parameters<typeof promptTemplates.imagePromptFromContext>[0]) => promptTemplates.imagePromptFromContext(payload),
};
