import { z } from 'zod';

export const articleFormSchema = z.object({
  title: z.string().min(1, 'Topic is required'),
  referenceContent: z.string().min(50, 'Reference content must be at least 50 characters'),
  sampleOutline: z.string().optional(),
  authorityTerms: z.string().optional(),
  websiteType: z.string().optional(),
  targetAudience: z.enum(['zh-TW', 'zh-HK', 'zh-MY']),
  productRawText: z.string().optional(),

  // UI-only fields that might need validation if used
  urlInput: z.string().url('Invalid URL').optional().or(z.literal('')),
  productUrlList: z.string().optional(),
  siteUrl: z.string().optional(),
  brandRagUrl: z.string().optional(),
  customVoiceProfileId: z.string().optional(),
  targetUrlList: z.string().optional(), // NEW: User provided specific URLs for Director
  directorContext: z.string().optional(), // NEW: Specific context for Director planning
});

export type ArticleFormValues = z.infer<typeof articleFormSchema>;
