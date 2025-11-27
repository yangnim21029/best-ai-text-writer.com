// Minimal JSON schema type helper used by our generationConfig.
// Keeps client-side code independent from the @google/genai package.
export const Type = {
    OBJECT: 'object',
    ARRAY: 'array',
    STRING: 'string',
    INTEGER: 'integer',
    NUMBER: 'number',
    BOOLEAN: 'boolean',
} as const;

export type SchemaType = typeof Type[keyof typeof Type];
