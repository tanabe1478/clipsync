# ADR-004: 3階層コンテキスト基盤の導入

## Status

Accepted

## Decision

論文 "Codified Context: Infrastructure for AI Agents in a Complex Codebase" (arXiv:2602.20478) の3階層ドキュメントシステムを ClipSync の開発フローに導入する。SwiftyGyaim での実装実績をベースに、Rust + TypeScript + SQL のポリグロット構成に適応する。

## Context

AI コーディングにおいて、セッション間で記憶が共有されないため、プロジェクトの規約や過去のミスを繰り返す問題がある。ClipSync は Tauri（Rust）+ React（TypeScript）+ Supabase（SQL）の3言語にまたがり、OAuth フローや RLS ポリシーなどのドメイン固有知識が多い。

## Consideration

### 3階層のマッピング

| 階層 | 定義 | ClipSync 対応 |
|------|------|-------------|
| Tier 1 (常時読込) | 基本ルール、制約 | CLAUDE.md |
| Tier 2 (領域トリガー) | ファイル編集時に参照する仕様書 | `docs/specs/` (新設) |
| Tier 3 (オンデマンド) | 設計判断の記録 | `docs/adr/` (新設) |

### SwiftyGyaim との差異

| 項目 | SwiftyGyaim | ClipSync |
|------|------------|----------|
| 言語 | Swift のみ | Rust + TypeScript + SQL |
| フック対象 | `.swift` | `.rs`, `.ts`, `.tsx`, `.sql` |
| ベースブランチ | `master` | `main` |
| Spec 数 | 6 | 5 |
| ADR 数 | 14 | 4 (初期) |

## Consequences

### ディレクトリ構成

```
CLAUDE.md                          ← Tier 1: 常時読込
docs/
├── specs/                         ← Tier 2: 領域特化仕様書
│   ├── clipboard-flow.md          # Trigger: commands.rs, lib.rs, App.tsx
│   ├── supabase-data.md           # Trigger: useClips.ts, useRealtimeClips.ts, *.sql
│   ├── auth-flow.md               # Trigger: useAuth.ts, auth_server.rs, lib.rs
│   ├── ui-components.md           # Trigger: *.tsx (components), App.tsx
│   └── bug-memory.md              # Trigger: 全ファイル（デバッグ時）
├── adr/                           ← Tier 3: 設計判断の記録
│   ├── 000-template.md
│   ├── 001-tauri-v2-desktop-framework.md
│   ├── 002-supabase-backend.md
│   ├── 003-dual-mode-oauth.md
│   └── 004-three-tier-context-infrastructure.md
└── diary/                         ← セッション振り返り
```

### フック自動化

| イベント | スクリプト | 動作 |
|---------|-----------|------|
| Edit | spec-read-reminder.sh | 対応 spec のパスを表示 |
| git commit | spec-freshness-check.sh | spec が今日更新されていなければ警告 |
| gh pr create | pr-spec-reminder.sh | spec 更新漏れ + bug-memory リマインド |

### メンテナンスフロー

週次（目安30分）:
1. git log から変更を確認し、影響する spec を更新
2. 新規バグパターンを bug-memory.md に追記
3. 頻出パターンは CLAUDE.md に昇格

## References

- [arXiv:2602.20478 - Codified Context: Infrastructure for AI Agents in a Complex Codebase](https://arxiv.org/pdf/2602.20478)
- SwiftyGyaim ADR-013: 3階層コンテキスト基盤の導入
