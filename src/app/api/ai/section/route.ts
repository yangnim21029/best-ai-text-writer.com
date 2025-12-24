import { NextRequest } from 'next/server';
import { aiService } from '@/services/adapters/aiService';
import { prepareSectionPrompt } from '@/services/generation/contentGenerationService';
import { sectionSchema } from '@/schemas/sectionSchema';
import { isAuthorizedAction } from '@/app/actions/auth';
import { createDataStreamResponse } from 'ai';

export async function POST(req: NextRequest) {
  // 1. Auth Check
  const authorized = await isAuthorizedAction();
  if (!authorized && process.env.NODE_ENV !== 'development') {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const sectionIndex = body.index ?? 0;
    console.log(`[API/AI/Section] Starting stream for: ${body.sectionTitle}`);

    // 2. Prepare Prompt
    const { prompt } = await prepareSectionPrompt(body);
    if (!prompt) {
      throw new Error('Generated prompt is empty');
    }

    // 3. Stream JSON
    const safePromptId = `stream_section_${sectionIndex}_${Date.now()}`;
    console.log(`[API/AI/Section] Calling aiService.streamJson...`);
    const result = await aiService.streamJson(prompt, 'FLASH', {
      schema: sectionSchema,
      promptId: safePromptId,
    });

    console.log(`[API/AI/Section] Stream initialized, returning toTextStreamResponse`);
    
    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error('[API/AI/Section] Stream failed:', error);
    return new Response(JSON.stringify({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
