# ClipSync

クロスプラットフォーム クラウドクリップボード同期。一つのデバイスでコピーして、別のデバイスでペースト。

[English](../README.md)

## 機能

- **グローバルホットキー** — `Cmd+Alt+C`（Mac）/ `Ctrl+Alt+C`（Windows）でクリップボードを保存、`Cmd+Alt+V` / `Ctrl+Alt+V` で履歴からペースト
- **リアルタイム同期** — 全デバイスにクリップが即座に反映
- **ピン留め** — 重要なクリップを上部に固定
- **共有シート**（Android）— 他のアプリから直接 ClipSync にテキストを共有
- **ショートカットカスタマイズ** — 設定画面（`Cmd+,`）でホットキーを変更可能
- **ダークモード** — OS のテーマに自動対応

## 対応プラットフォーム

| プラットフォーム | 技術 | 状態 |
|---------------|------|------|
| macOS | Tauri v2 (Rust + React) | ✅ 対応済み |
| Windows | Tauri v2 (Rust + React) | ✅ 対応済み |
| Android | Flutter (Dart + Riverpod) | ✅ 対応済み |
| iOS | Flutter | 予定 |

## アーキテクチャ

```
┌─────────┐     ┌───────────────┐     ┌───────────────┐
│  Mac    │────▶│  Supabase     │◀────│  Android      │
│ デスクトップ│    │ (PostgreSQL   │     │ (Flutter)     │
└─────────┘     │  + Realtime)  │     └───────────────┘
      │         └───────────────┘
┌─────────┐           ▲
│ Windows │───────────┘
│ デスクトップ│
└─────────┘
```

- **バックエンド**: [Supabase](https://supabase.com) — PostgreSQL + 認証 + リアルタイム
- **デスクトップ**: [Tauri v2](https://v2.tauri.app) — Rust バックエンド + React/TypeScript フロントエンド
- **モバイル**: [Flutter](https://flutter.dev) — Riverpod + go_router + supabase_flutter

## クイックスタート

### 前提条件

- [Node.js](https://nodejs.org) 22+
- [pnpm](https://pnpm.io)
- [Rust](https://rustup.rs)
- [Flutter](https://flutter.dev) 3.22+（モバイル用）

### デスクトップ

```bash
git clone https://github.com/tanabe1478/clipsync.git
cd clipsync
pnpm install
cp .env.example .env  # Supabase の URL と anon key を設定
cargo tauri dev
```

### モバイル（Android）

```bash
cd mobile
cp .env.example .env  # Supabase の URL と anon key を設定
flutter run
```

### Supabase セットアップ

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. マイグレーション実行: `pnpm db:migrate`
3. Auth → Providers → Google で Google OAuth を有効化
4. Auth → URL Configuration でリダイレクト URL を追加

## テスト

```bash
# デスクトップ
pnpm test              # ユニットテスト (vitest)
pnpm test:e2e          # E2E テスト (Playwright)
cargo test --manifest-path src-tauri/Cargo.toml  # Rust テスト

# モバイル
cd mobile && flutter test
```

## データモデル

`clips` テーブル:

| カラム | 型 | 説明 |
|--------|-----|------|
| `id` | UUID | 主キー |
| `user_id` | UUID | ユーザー ID（`auth.uid()` デフォルト） |
| `content` | TEXT | クリップ内容（最大 100KB） |
| `device_name` | TEXT | デバイス名 |
| `pinned` | BOOLEAN | ピン留め |
| `created_at` | TIMESTAMPTZ | 作成日時 |

- RLS（Row Level Security）でユーザー単位のアクセス制御
- Realtime でリアルタイム同期

## ドキュメント

[arXiv:2602.20478](https://arxiv.org/pdf/2602.20478) に基づく [3階層ドキュメントシステム](adr/004-three-tier-context-infrastructure.md) を採用:

- **Tier 1**: [CLAUDE.md](../CLAUDE.md) — 常時読込プロジェクトコンテキスト
- **Tier 2**: [docs/specs/](specs/) — 領域特化仕様書
- **Tier 3**: [docs/adr/](adr/) — Architecture Decision Records

### ADR 一覧

| ADR | 内容 |
|-----|------|
| [001](adr/001-tauri-v2-desktop-framework.md) | Tauri v2 デスクトップフレームワーク選定 |
| [002](adr/002-supabase-backend.md) | Supabase バックエンド選定 |
| [003](adr/003-dual-mode-oauth.md) | Dev/Release 二重 OAuth フロー |
| [004](adr/004-three-tier-context-infrastructure.md) | 3階層コンテキスト基盤 |
| [005](adr/005-flutter-mobile-crossplatform.md) | Flutter モバイルクロスプラットフォーム |
| [006](adr/006-riverpod-state-management.md) | Riverpod 状態管理 |
| [007](adr/007-feature-first-flutter-architecture.md) | Feature-First アーキテクチャ |

## ライセンス

MIT
