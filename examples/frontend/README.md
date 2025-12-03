# Frontend Streaming Notes

- All sync endpoints now return `usage` and `totalUsage` (e.g., `/ai/generate`, `/ai/embed`, `/ai/vision`, `/ai/image`). If `totalUsage` is missing, treat `usage` as the total.
- `/ai/stream` without schema returns a Vercel UI message stream (SSE). Use `readUIMessageStream({ stream: res.body })` or manual SSE parsing. Token data is in `message.metadata.totalUsage` (or `metadata.usage`) on the final message.
- `/ai/stream` with schema now streams SSE `fullStream` events (`type: "object" | "text-delta" | "finish" | ...`). The `finish` event carries `usage`/`totalUsage`; the stream is no longer plain text.
- See `examples/frontend/ai-stream.ts` for a minimal UI-stream consumer that prints `metadata.totalUsage`.
