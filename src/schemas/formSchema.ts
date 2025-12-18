import { z } from 'zod';

export const articleFormSchema = z.object({
    title: z.string().min(1, "Topic is required"),
    referenceContent: z.string().min(50, "Reference content must be at least 50 characters"),
    sampleOutline: z.string().optional(),
    authorityTerms: z.string().optional(),
    websiteType: z.string().optional(),
    targetAudience: z.enum(['zh-TW', 'zh-HK', 'zh-MY']),
    useRag: z.boolean(),
    autoImagePlan: z.boolean(),
    productRawText: z.string().optional(),

    // UI-only fields that might need validation if used
    urlInput: z.string().url("Invalid URL").optional().or(z.literal('')),
    productUrlList: z.string().optional(),
});

export type ArticleFormValues = z.infer<typeof articleFormSchema>;
