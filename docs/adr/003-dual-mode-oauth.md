# ADR-003: Dev/Release 二重 OAuth フローの設計

## Status

Accepted

## Decision

OAuth コールバックを dev モード（localhost HTTP サーバー）と release モード（`clipsync://` ディープリンク）で切り替える二重フロー方式を採用する。

## Context

Supabase の Google OAuth はブラウザリダイレクトでトークンを返す。デスクトップアプリではカスタム URL スキーム（`clipsync://auth/callback`）でリダイレクトを受け取るが、Tauri v2 の `deep_link().register()` は非バンドル（dev モード）では動作しない。

dev モードでも OAuth フローを完結させる仕組みが必要。

## Consideration

| 方式 | dev 対応 | release 対応 | 実装コスト |
|------|---------|-------------|-----------|
| ディープリンクのみ | ✗ | ✓ | 低 |
| localhost HTTP のみ | ✓ | △（ポート衝突リスク） | 中 |
| 二重フロー（本案） | ✓ | ✓ | 中 |
| PKCE + 手動トークン貼り付け | ✓ | ✓ | 高（UX 悪い） |

## Consequences

### Dev モードフロー
1. Rust で `localhost:54321` に HTTP サーバーを起動
2. `get_auth_redirect_url` コマンドが `http://localhost:54321/auth/callback` を返す
3. ブラウザが OAuth 後にリダイレクト → HTML ページが `#access_token=...` を JS で読み取り
4. `POST /auth/token` でトークンを Rust サーバーに送信
5. Rust が `deep-link-auth` イベントをフロントに emit

### Release モードフロー
1. `get_auth_redirect_url` が `clipsync://auth/callback` を返す
2. ブラウザが OAuth 後にカスタム URL スキームでリダイレクト
3. Tauri の `on_open_url` ハンドラがトークン付き URL を受け取り
4. `deep-link-auth` イベントをフロントに emit

### フロントエンド共通
- `useAuth` が `deep-link-auth` イベントをリッスン
- `extractTokensFromUrl()` で URL フラグメントからトークン抽出
- `supabase.auth.setSession()` でセッション確立

## References

- [Tauri Deep Link Plugin](https://v2.tauri.app/plugin/deep-linking/)
- Supabase Auth redirect_to パラメータ
