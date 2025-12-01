# AI Quickstart Examples

Minimal examples for hitting the backend AI endpoints directly from the command line (TypeScript + dotenv).

## Prerequisites
- Node 18+ (for built-in `fetch`)
- Environment variables:
  - `AI_BASE_URL` or `VITE_AI_BASE_URL` (e.g., `http://localhost:3000`)
  - Optional: `AI_TOKEN` if your gateway requires `Authorization: Bearer <token>`

## Run the sample script
```bash
# Install deps if you haven't
npm install

# Text generation (default)
npx tsx examples/quickstart.ts

# JSON (schema) generation
npx tsx examples/quickstart.ts schema

# Stream (tries /stream, falls back to /generate on 404)
npx tsx examples/quickstart.ts stream

# Image generation
npx tsx examples/quickstart.ts image

# Streaming reader (token-by-token stdout)
npx tsx examples/stream-reader.ts "Give me two SEO title ideas for summer travel."

# Batch embeddings
npx tsx examples/embed.ts
```

Set `AI_EMBED_MODEL_ID` if your backend expects a different embedding model (defaults to `gemini-embedding-001`).

You can override the endpoint path if your backend mounts under a different prefix (e.g., `/api/ai`):
```bash
AI_PATH=/api/ai npx tsx examples/quickstart.ts
```
