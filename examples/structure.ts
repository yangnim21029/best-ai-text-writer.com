import { MODEL_ID, postJson } from './config';

type Review = {
    rating: number;
    summary: string;
    pros?: string[];
    cons?: string[];
};

type StructuredResponse<T> = {
    object: T;
    usage?: unknown;
    finishReason?: string;
};

const reviewSchema = {
    type: 'object',
    properties: {
        rating: { type: 'number' },
        summary: { type: 'string' },
        pros: { type: 'array', items: { type: 'string' } },
        cons: { type: 'array', items: { type: 'string' } },
    },
    required: ['rating', 'summary'],
    additionalProperties: false,
} as const;

async function main() {
    const data = await postJson<StructuredResponse<Review>>(
        '/ai/generate',
        {
            // Backend takes JSON Schema directly and wraps with the AI SDK helper.
            prompt: 'Write a short product review for a standing desk.',
            model: MODEL_ID,
            schema: reviewSchema,
        },
    );

    const usage = (data as any).totalUsage || data.usage;

    console.log('Structured object:', data.object);
    console.log('Finish reason:', data.finishReason ?? 'n/a');
    console.log('Usage:', usage ?? 'n/a');
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
