# ADR-007: Flutter で Feature-First アーキテクチャを採用

## Status

Accepted

## Decision

Flutter アプリのディレクトリ構造として Feature-First + Clean Architecture レイヤリングを採用する。

## Context

Flutter プロジェクトの構造は大きく2つに分かれる: Layer-First（`models/`, `views/`, `controllers/`）と Feature-First（`features/auth/`, `features/clips/`）。ClipSync モバイルは auth, clips, share, settings の4機能に明確に分かれる。

## Consideration

| 項目 | Feature-First | Layer-First |
|------|-------------|------------|
| スケーラビリティ | 機能追加が独立 | 全レイヤに散在 |
| 凝集度 | 高い（機能内完結） | 低い（レイヤ横断） |
| チーム開発 | 機能単位で分担可能 | 衝突しやすい |
| 小規模プロジェクト | やや冗長 | シンプル |

ClipSync は現在4機能だが、将来的にオフラインキャッシュ、検索、タグ機能等の拡張が見込まれる。Feature-First なら新機能を独立ディレクトリとして追加できる。

## Consequences

### ディレクトリ構成

```
lib/
├── app/          # アプリ設定（router, theme）
├── core/         # 共通ユーティリティ（Supabase client, logger, constants）
├── shared/       # 共有モデル・ウィジェット
└── features/     # 機能モジュール
    ├── auth/
    │   ├── application/   # ビジネスロジック（Notifier）
    │   └── presentation/  # UI（Screen, Widget）
    ├── clips/
    │   ├── data/           # リポジトリ（Supabase CRUD）
    │   ├── application/    # ビジネスロジック
    │   └── presentation/   # UI
    ├── share/
    └── settings/
```

- 各 feature 内は data / application / presentation の3層
- feature 間の直接 import 禁止（shared/ 経由で共有）
- Clip モデルは複数 feature で使うため shared/models/ に配置

## References

- [Flutter Project Structure: Feature-first or Layer-first?](https://codewithandrea.com/articles/flutter-project-structure/)
- [Best Practices for Folder Structure in Large Flutter Projects (2025 Guide)](https://www.pravux.com/best-practices-for-folder-structure-in-large-flutter-projects-2025-guide/)
