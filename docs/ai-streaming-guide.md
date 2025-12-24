# AI 串流實作指南 (AI Streaming Guide)

這份文件記錄了本專案中 AI 串流最穩定的「黃金寫法」，請未來的開發者務必遵守，以避免常見的驗證錯誤與畫面卡死問題。

## 1. 最穩的後端寫法 (Server-side)

**一定要用 `streamText` 搭配 `Output.object`。**  
雖然 `streamObject` 看起來很直覺，但在 AI SDK v6+ 中，`streamText` 才是官方推薦且相容性最好的做法。

```typescript
// src/services/adapters/aiService.ts
return streamText({
  model: vertex('gemini-3-flash-preview'), // 目前最新的型號
  prompt: yourPrompt,
  output: Output.object({
    schema: yourZodSchema,
  }),
  headers: {
    // 注意：Header 不能有中文！一定要過濾掉非 ASCII 字元
    'x-prompt-id': promptId.replace(/[^\x00-\x7F]/g, '_'), 
  }
});
```

## 2. 怎麼把資料傳給前端 (API Response)

**對接 `useObject` 時，請統一使用 `toTextStreamResponse()`。**  
雖然文件可能會提到 `toDataStreamResponse`，但在目前環境中，`toTextStreamResponse` 對於純物件串流的解析最為穩定，且不會夾雜特殊的協議前綴（如 `0:`），避免前端 `JSON.parse` 報錯。

```typescript
// src/app/api/ai/section/route.ts
const result = await aiService.streamJson(...);
return result.toTextStreamResponse();
```

## 3. 前端的保護措施 (Client-side)

**Zod Schema 一定要加 `.default()`。**  
串流剛開始時，資料是空的（undefined），這會導致 Zod 報出 `received undefined`。加上預設值可以讓前端在資料還沒跑出來前，先拿預設值頂著。

```typescript
// src/schemas/sectionSchema.ts
export const sectionSchema = z.object({
  content: z.string().default(''),
  usedPoints: z.array(z.string()).default([]),
  injectedCount: z.number().default(0),
});
```

## 4. 解決開發模式的「連抽兩次」問題 (React Strict Mode)

**使用 `useRef` 擋掉重複的請求。**  
Next.js 開發模式會讓 `useEffect` 跑兩次。為了省 Token 並保持日誌乾淨，請在 `SectionStreamer` 中加入守衛。

```typescript
const hasStarted = useRef(false);

useEffect(() => {
  if (!hasStarted.current) {
    hasStarted.current = true;
    submit(body);
  }
}, [body, submit]);
```

## 5. 常見錯誤排除 (Troubleshooting)

- **TypeError: ... is not a function**: 通常是版本升級後方法名變了。請先用 `node -e` 印出物件原型確認方法名。
- **TypeError: Cannot convert argument to a ByteString**: 絕對是 HTTP Header 裡塞了中文字。請檢查 `x-prompt-id`。
- **200 OK 但畫面沒東西**: 檢查 API 回傳是否帶有 `0:` 等前綴。如果是，代表前端 `useObject` 無法解析該協議，請改用 `toTextStreamResponse()`。

---
*Last Updated: 2025-12-24*
