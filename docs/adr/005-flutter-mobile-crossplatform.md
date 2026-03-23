# ADR-005: モバイルフレームワークに Flutter を採用

## Status

Accepted

## Decision

Android / iOS モバイルアプリのフレームワークとして Flutter を採用する。

## Context

Phase 2（Android）と Phase 3（iOS）で同じコードベースを共有したい。候補は Flutter、React Native、Kotlin Multiplatform。

## Consideration

| 項目 | Flutter | React Native | Kotlin Multiplatform |
|------|---------|-------------|---------------------|
| 言語 | Dart | JavaScript/TypeScript | Kotlin |
| UI 共有 | 100% | 100% | ロジックのみ共有 |
| Supabase SDK | supabase_flutter（公式） | supabase-js（Web 向け） | supabase-kt（コミュニティ） |
| 型安全 | 強い（Dart + Freezed） | TypeScript で可能 | Kotlin で強い |
| パフォーマンス | ネイティブ近い（Skia/Impeller） | ブリッジ経由 | ネイティブ |
| Google Auth | supabase_flutter 内蔵 | 追加設定必要 | 自前実装 |
| コード生成 | Freezed + build_runner | なし | なし |

Flutter は supabase_flutter 公式 SDK があり、Google OAuth がモバイルでネイティブに動作する。Dart の型システムと Freezed による不変モデルは、プロジェクトの Immutability 規約と合致する。

デスクトップは Tauri（Rust + React）で既に完成しているため、React Native とコード共有するメリットは限定的。

## Consequences

- Dart の学習コストがある（ただし TypeScript 経験者には親和性が高い）
- Flutter 固有のウィジェットシステムの習得が必要
- Android/iOS で同一 UI を実現できる
- supabase_flutter で認証・CRUD・Realtime が統一的に扱える

## References

- [Flutter 公式](https://flutter.dev/)
- [supabase_flutter パッケージ](https://pub.dev/packages/supabase_flutter)
