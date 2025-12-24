import { z } from 'zod';
import { TargetAudience, ServiceResponse } from '../../types';
import { getLanguageInstruction } from '../adapters/promptService';
import { promptTemplates } from '../adapters/promptTemplates';
import { aiService } from '../adapters/aiService';

// 🆕 SMART INJECT POINT (Refine with Paragraph Compact Indexing)
export const smartInjectPoint = async (
    fullHtmlContent: string,
    pointToInject: string,
    targetAudience: TargetAudience
): Promise<ServiceResponse<{ originalSnippet: string; newSnippet: string }>> => {
    if (typeof window !== 'undefined') {
        throw new Error('smartInjectPoint is server-only');
    }
    const startTs = Date.now();
    const languageInstruction = getLanguageInstruction(targetAudience);

    // 1. PARSE & INDEX (Paragraph Compact Indexing)
    // Server-side: Dynamically import JSDOM to avoid client-side bundling errors
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM(fullHtmlContent);
    const doc = dom.window.document;

    const blocks: { id: number; text: string; html: string }[] = [];
    const nodes = doc.querySelectorAll('p, li');

    nodes.forEach((node, index) => {
        const text = node.textContent?.trim() || '';
        if (text.length > 20) {
            blocks.push({
                id: index,
                text: text.substring(0, 80) + '...',
                html: node.outerHTML,
            });
        }
    });

    if (blocks.length === 0) {
        return {
            data: { originalSnippet: '', newSnippet: '' },
            usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
            cost: { inputCost: 0, outputCost: 0, totalCost: 0 },
            duration: Date.now() - startTs,
        };
    }

    // 2. OPTIMIZED: FIND & REWRITE IN ONE STEP
    const combinedPrompt = promptTemplates.smartFindAndRewriteBlock({
        pointToInject,
        blocks,
        languageInstruction
    });

    const response = await aiService.runJson<{ originalBlockId: number; newHtml: string }>(
        combinedPrompt,
        'FLASH',
        {
            schema: z.object({
                originalBlockId: z.number(),
                newHtml: z.string(),
            }),
            promptId: 'smart_inject_combined'
        }
    );

    const { originalBlockId, newHtml } = response.data;

    // Find the original block to return as "before" state
    const targetBlock = blocks.find((b) => b.id === originalBlockId);

    // If AI hallucinates an ID, fallback to the first block or handle gracefully
    const fallbackBlock = targetBlock || blocks[0];

    return {
        data: {
            originalSnippet: fallbackBlock?.html || '',
            newSnippet: newHtml || fallbackBlock?.html || '',
        },
        usage: response.usage,
        cost: response.cost,
        duration: Date.now() - startTs,
    };
};
