# Spec: Authentication Flow

> Trigger: useAuth.ts, auth_server.rs, lib.rs
> Last updated: 2026-03-24

## 概要

Google OAuth による認証フロー。dev モードと release モードで異なるコールバック方式を使用。

## 二重フロー設計（ADR-003）

### Dev モード (`cfg!(debug_assertions)`)

```
App → signInWithGoogle()
  → invoke("get_auth_redirect_url") → "http://localhost:54321/auth/callback"
  → supabase.auth.signInWithOAuth({ redirectTo })
  → ブラウザで Google ログイン
  → リダイレクト: http://localhost:54321/auth/callback#access_token=...
  → auth_server.rs: HTML ページを返す
  → JS: hash fragment を読み取り POST /auth/token
  → Rust: emit("deep-link-auth", url)
  → useAuth: extractTokensFromUrl() → setSession()
```

### Release モード

```
App → signInWithGoogle()
  → invoke("get_auth_redirect_url") → "clipsync://auth/callback"
  → supabase.auth.signInWithOAuth({ redirectTo })
  → ブラウザで Google ログイン
  → リダイレクト: clipsync://auth/callback#access_token=...
  → Tauri: on_open_url() → emit("deep-link-auth", url)
  → useAuth: extractTokensFromUrl() → setSession()
```

## Auth Server (`auth_server.rs`)

- ポート: `54321` (ハードコード)
- dev モードのみ起動 (`cfg!(debug_assertions)`)
- エンドポイント:
  - `GET /auth/callback` → HTML ページ（JS でフラグメント読み取り + POST）
  - `POST /auth/token` → body からトークン抽出、`deep-link-auth` イベント emit
  - `OPTIONS` → CORS preflight（`Access-Control-Allow-Origin: *`）

## トークン抽出 (`extractTokensFromUrl`)

```typescript
// URL: clipsync://auth/callback#access_token=abc&refresh_token=def
function extractTokensFromUrl(url: string): { accessToken, refreshToken } | null
```

- `#` 以降を `URLSearchParams` でパース
- `access_token` と `refresh_token` の両方が必要（片方でも欠けたら null）

## セッション管理

- 起動時: `supabase.auth.getSession()` で既存セッション復元
- リアルタイム: `onAuthStateChange` でセッション変化を監視
- サインアウト: `supabase.auth.signOut()` → `setUser(null)`

## Supabase Dashboard 設定

- Auth → Providers → Google: Client ID + Client Secret 設定済み
- Auth → URL Configuration → Redirect URLs:
  - `http://localhost:54321/auth/callback` (dev)
  - `clipsync://auth/callback` (release、将来追加)
