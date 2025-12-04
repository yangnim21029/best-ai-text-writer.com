# Web Scraping 測試指南

## 快速開始

### 1. 安裝依賴
確保項目已安裝所有依賴：
```bash
npm install
```

### 2. 運行測試腳本

```bash
# 使用 ts-node 運行（推薦）
npx ts-node test-scraping.ts

# 或者先編譯再運行
npx tsc test-scraping.ts
node test-scraping.js
```

### 3. 查看結果

測試完成後，會在 `output/` 目錄生成 JSON 報告：
```
output/scraping-test-2024-12-04T10-47-00-000Z.json
```

---

## 測試配置

### Rate Limiting
- **免費計劃限制**: Jina Reader 每小時 200 次請求
- **腳本配置**: 每秒 1 次請求（安全範圍）
- **批次大小**: 每批 5 個 URL
- **預計時間**: ~24 秒（24 個 URL × 1 秒）

### 測試 URL
腳本包含 24 個台灣/香港美容、時尚網站：
- Cosmopolitan HK/TW
- ELLE TW/HK
- Harper's Bazaar TW
- Vogue TW
- Marie Claire TW
- Women's Health TW
- Beauty321
- 其他生活風格網站

---

## 輸出報告格式

### 控制台輸出
```
🚀 Starting Web Scraping Test
📊 Total URLs: 24
⏱️  Rate Limit: 1 request/second
📦 Batch Size: 5 URLs
⏳ Estimated Time: ~24 seconds

📦 Batch 1/5 (5 URLs)
------------------------------------------------------------

🔍 Scraping: https://www.cosmopolitan.com.hk/cosmobody/...
✅ Success: "鷓鴣食譜推薦"
   📄 Content: 4523 chars
   🖼️  Images: 8
   ⏱️  Time: 1247ms

...

📊 SUMMARY REPORT
============================================================

✅ Successful: 22/24
❌ Failed: 2/24
📈 Success Rate: 91.7%

📊 Averages (Successful):
   Content Length: 3847 chars
   Images per URL: 6
   Duration: 1134ms

🏆 Top 5 Content-Rich URLs:
   1. 2025年女生髮型趨勢
      8934 chars, 12 images
      https://www.womenshealthmag.com/...
```

### JSON 報告
```json
{
  "timestamp": "2024-12-04T10:47:00.000Z",
  "totalUrls": 24,
  "successful": 22,
  "failed": 2,
  "successRate": 91.7,
  "results": [
    {
      "url": "https://...",
      "success": true,
      "title": "文章標題",
      "contentLength": 4523,
      "imageCount": 8,
      "duration": 1247
    }
  ]
}
```

---

## 常見問題

### Q: 遇到 429 Too Many Requests 錯誤？
**A**: 降低請求頻率：
```typescript
// test-scraping.ts 第 111 行
await delay(2000); // 改為 2 秒
```

### Q: 某些網站一直失敗？
**A**: 可能原因：
1. 網站有反爬蟲機制
2. 需要登入才能查看
3. 內容是動態加載（JavaScript）

解決方案：
```typescript
// 在 webScraper.ts 中調整 Jina headers
headers['X-With-Generated-Alt'] = 'true'; // 生成 alt 文本
headers['X-Timeout'] = '30'; // 增加超時時間
```

### Q: 如何測試單個 URL？
**A**: 修改腳本：
```typescript
const TEST_URLS = [
  'https://www.cosmopolitan.com.hk/cosmobody/partridge-soup-recipe-recommendations'
];

runTests(TEST_URLS, 1); // 批次大小改為 1
```

### Q: 想跳過 rate limit 測試更快？
**A**: ⚠️ 注意免費計劃限制！
```typescript
// test-scraping.ts 第 110 行
await delay(100); // 改為 0.1 秒（風險自負）
```

---

## 測試指標說明

### 成功率
- **90%+**: 優秀，scraper 穩定
- **70-90%**: 良好，部分網站需要特殊處理
- **<70%**: 需要檢查 scraper 配置

### 內容長度
- **>3000 字元**: 完整文章
- **1000-3000**: 一般文章
- **<1000**: 可能只抓到摘要或有問題

### 圖片數量
- **5-15 張**: 正常的美容文章
- **>20 張**: 可能包含廣告圖
- **0 張**: 檢查圖片提取邏輯

### 響應時間
- **<2000ms**: 快速
- **2000-5000ms**: 正常
- **>5000ms**: 慢，可能網站負載高

---

## 進階配置

### 自定義測試 URL
編輯 `test-scraping.ts`:
```typescript
const TEST_URLS = [
  'https://your-test-url-1.com',
  'https://your-test-url-2.com'
];
```

### 調整批次大小
```typescript
runTests(TEST_URLS, 10); // 每批 10 個 URL
```

### 保存抓取內容
```typescript
// 在 testSingleUrl() 中添加
if (result.success) {
  fs.writeFileSync(
    `output/content-${Date.now()}.md`,
    result.content
  );
}
```

---

## 下一步

### 測試成功後
1. 分析失敗的 URL，調整清理規則
2. 檢查圖片提取是否完整
3. 評估是否需要添加網站特定規則

### 測試失敗後
1. 查看錯誤信息
2. 檢查網絡連線
3. 確認 Jina Reader 服務狀態
4. 嘗試使用 `includeNav: true` 選項

---

## 疑難排解

### TypeScript 錯誤

```bash
# 如果遇到類型錯誤
npm install --save-dev @types/node

# 或使用 JavaScript 運行
node test-scraping.js
```

### Import 錯誤
確保 `webScraper.ts` 路徑正確：
```typescript
import { fetchUrlContent } from './services/webScraper';
```

### 缺少 output 目錄
腳本會自動創建，但如果有權限問題：
```bash
mkdir output
chmod 755 output
```

---

## 相關文檔

- [Jina Reader 官方文檔](https://jina.ai/reader)
- [Web Scraper 源碼分析](./complexity_analysis.md#複雜點-2-webscraperts---清理邏輯過載)
- [代碼優化建議](./code_optimization_analysis.md)
