# ADR-002: バックエンドに Supabase を採用

## Status

Accepted

## Decision

クラウドバックエンドとして Supabase（PostgreSQL + Auth + Realtime）を採用する。

## Context

クリップボードデータのクラウド同期に、認証・データベース・リアルタイム同期の3機能が必要。個人開発の MVP として無料枠で運用可能なサービスを選定する。

## Consideration

| 項目 | Supabase | Firebase | 自前 REST API |
|------|----------|----------|-------------|
| DB | PostgreSQL (SQL) | Firestore (NoSQL) | 任意 |
| 無料枠 DB | 500MB | 1GB | なし |
| 認証 | Google OAuth 対応 | Google OAuth 対応 | 自前実装 |
| Realtime | Postgres Changes | Realtime DB / Firestore | WebSocket 自前 |
| RLS | ネイティブ対応 | Security Rules | 自前実装 |
| SQL 直書き | 可能 | 不可 | 可能 |
| 一時停止 | 7日非活動で停止 | なし | なし |

Supabase は PostgreSQL ベースなので SQL が直接書け、RLS（Row Level Security）でユーザー分離が自然に実現できる。Realtime 機能でクリップの即時同期も組み込み済み。

## Consequences

- 無料プランで MVP に十分な容量（500MB DB, 5GB 帯域）
- 7日間非アクティブで DB が一時停止する制約あり
- RLS ポリシーで `auth.uid() = user_id` を強制し、サーバー側でアクセス制御
- `user_id` カラムに `DEFAULT auth.uid()` を設定し、INSERT 時の明示的指定を不要にした

## References

- [Supabase 公式](https://supabase.com/)
- [Supabase Pricing](https://supabase.com/pricing)
