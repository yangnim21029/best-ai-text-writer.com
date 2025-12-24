import { z } from 'zod';

// Schema for section generation result
export const sectionSchema = z.object({
  content: z.string().default(''),
  usedPoints: z.array(z.string()).default([]),
  injectedCount: z.number().default(0),
  comment: z.string().optional().default(''),
});
