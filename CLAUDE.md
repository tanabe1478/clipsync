# ClipSync

Cross-platform cloud clipboard sync app.

## Tech Stack

- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Desktop**: Tauri v2 (Rust + React + TypeScript + Vite)
- **Auth**: Google Sign-In via Supabase Auth

## Project Structure

```
clipsync/
├── src/                  # React frontend
│   ├── components/       # UI components
│   ├── hooks/            # React hooks (useAuth, useClips, etc.)
│   └── lib/              # Supabase client, types, logger
├── src-tauri/            # Tauri Rust backend
│   └── src/              # Rust source (clipboard, hotkeys, commands, auth server)
├── supabase/migrations/  # SQL migrations
├── docs/
│   ├── specs/            # Tier 2: 領域特化仕様書
│   ├── adr/              # Tier 3: Architecture Decision Records
│   └── diary/            # セッション振り返り
├── e2e/                  # Playwright E2E tests
└── .claude/hooks/        # ドキュメント自動チェックフック
```

## Build & Run

```bash
pnpm install              # Install frontend dependencies
cargo tauri dev           # Run in dev mode (builds Rust + starts Vite)
```

## Test

```bash
pnpm test                 # Frontend unit tests (vitest, 28 tests)
pnpm test:e2e             # E2E tests (Playwright, 7 tests)
cargo test --manifest-path src-tauri/Cargo.toml  # Rust tests
```

## Conventions

- **Immutability**: Never mutate state; always create new objects
- **Rust**: rustfmt + clippy with -D warnings
- **TypeScript**: Strict mode, readonly types
- **TDD**: Write tests first
- **Logging**: エラーを握り潰さない。`logger.error()` で Rust ログに転送

## Data Model

- `clips` table: id, user_id (DEFAULT auth.uid()), content, device_name, pinned, created_at
- RLS enforced: users can only access their own clips
- Realtime enabled for cross-device sync

## Phase Plan

- Phase 1: Mac + Windows desktop (current)
- Phase 2: Android
- Phase 3: iPhone

## ADR (Architecture Decision Records)

設計上の重要な判断は `docs/adr/` に ADR として記録する。

- テンプレート: `docs/adr/000-template.md`
- 新規追加時は連番で `NNN-タイトル.md` を作成
- 既存 ADR の変更時は新規 ADR を作成し、旧版の Status を `Superseded by ADR-NNN` に更新

```
docs/adr/
├── 000-template.md
├── 001-tauri-v2-desktop-framework.md
├── 002-supabase-backend.md
├── 003-dual-mode-oauth.md
└── 004-three-tier-context-infrastructure.md
```

## Context Infrastructure (3-Tier Docs)

arXiv:2602.20478 に基づく3階層ドキュメントシステム（ADR-004）。

### Tier 1: 常時読込 → このファイル (CLAUDE.md)

### Tier 2: 領域特化仕様書 → `docs/specs/`

**ルール（必須 — 違反は禁止）**:
1. `.rs`, `.ts`, `.tsx`, `.sql` ファイルを編集する**前に**、下表の Trigger 列に該当する spec を**必ず Read すること**（hooks でリマインドされるが、hook が動作しなくてもこのルールは有効）
2. バグ修正後は `docs/specs/bug-memory.md` にエントリを**必ず追記**すること
3. 動作仕様を変更した場合は、対応する spec を**同じコミットで更新**すること（`> Last updated:` の日付も更新）
4. コミット前に `docs/specs/` 内の関連 spec が最新であることを確認すること

| Spec | Trigger（編集対象） | 内容 |
|------|-------------------|------|
| [clipboard-flow.md](docs/specs/clipboard-flow.md) | commands.rs, lib.rs, App.tsx | IPC コマンド、ホットキー、クリップボード R/W |
| [supabase-data.md](docs/specs/supabase-data.md) | useClips.ts, useRealtimeClips.ts, supabase.ts, types.ts, *.sql | テーブルスキーマ、RLS、Realtime、CRUD |
| [auth-flow.md](docs/specs/auth-flow.md) | useAuth.ts, auth_server.rs, lib.rs | OAuth フロー、ディープリンク、dev コールバック |
| [ui-components.md](docs/specs/ui-components.md) | AuthScreen.tsx, ClipList.tsx, ClipItem.tsx, HistoryPicker.tsx, App.tsx | コンポーネント構造、UX |
| [bug-memory.md](docs/specs/bug-memory.md) | 全ファイル（デバッグ時） | 過去のバグパターンと修正方法 |

### Tier 3: オンデマンド検索 → `docs/adr/`

- `docs/adr/` — 設計判断の経緯（000-004）

### 自動チェック（hooks — `.claude/settings.json`）

| イベント | スクリプト | 動作 |
|---------|-----------|------|
| Edit 任意ファイル | `spec-read-reminder.sh` | .rs/.ts/.tsx/.sql の場合、対応 spec のパスを表示 |
| git commit | `spec-freshness-check.sh` | 変更ファイルに対応する spec が今日更新されていなければ警告 |
| gh pr create | `pr-spec-reminder.sh` | spec 更新漏れ確認、fix ブランチなら bug-memory 追記リマインド |

**hook が動作しない場合でも、上記 Tier 2 のルールは手動で遵守すること。**

### メンテナンス

週次（目安30分）: git log から変更を確認し、影響する spec を更新。新規バグは bug-memory.md に追記。頻出パターンは CLAUDE.md に昇格。
