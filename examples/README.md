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

# Image generation
npx tsx examples/quickstart.ts image
```

You can override the endpoint path if your backend mounts under a different prefix (e.g., `/api/ai`):
```bash
AI_PATH=/api/ai npx tsx examples/quickstart.ts
```
