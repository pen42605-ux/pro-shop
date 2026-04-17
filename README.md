# pro-shop（完整合併專案）

單一 Node 程序包含：

| 區塊 | 說明 |
|------|------|
| **Express API** | `GET /health`、`POST /auth/register`、`POST /auth/login`、`GET /auth/me`、LINE 相關 `/auth/line/*` |
| **VIP 商城前端** | `public/`（代理驗證、商城、購物車、後台等） |
| **前端 ↔ 後端** | `public/js/pro-api.js` 以同源 `fetch` 呼叫 `/auth/*`；JWT 存在 `localStorage`（`vip_api_token`），並由 `storage.js` 的 `VIPStore` 管理 |

## 本機

```bash
cp .env.example .env
# 填 DATABASE_URL、JWT_SECRET（必填才能註冊／信箱登入）
npm install
npm start
```

- 商城首頁：<http://127.0.0.1:3000/>
- 會員登入：`index.html` — **LINE** 仍為前端模擬；**信箱 + 密碼** 連後端 PostgreSQL。
- 註冊：`register.html`

## Railway

- Root Directory：本專案根目錄（含 `server.js`）
- 環境變數：`DATABASE_URL`、`JWT_SECRET`、LINE 相關（若使用）
- 監聽：`0.0.0.0` + `process.env.PORT`

## 資料備註

- 購物車、訂單、後台帳號等仍多為 **localStorage** 示範；若要全部進 DB，需再擴充 API 與資料表。
