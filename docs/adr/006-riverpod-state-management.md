# ADR-006: Flutter 状態管理に Riverpod を採用

## Status

Accepted

## Decision

Flutter アプリの状態管理に Riverpod 3.x を採用する。

## Context

Flutter の状態管理ライブラリは多数存在する。Supabase の非同期 CRUD と Realtime サブスクリプションを扱うため、非同期ファーストな設計が求められる。

## Consideration

| 項目 | Riverpod 3.x | BLoC | Provider |
|------|-------------|------|---------|
| 非同期対応 | ネイティブ（AsyncNotifier） | Stream ベース | 手動 |
| DI | 内蔵 | 別途必要 | 手動 |
| コード生成 | @riverpod マクロ | Event/State クラス必要 | なし |
| ボイラープレート | 少ない | 多い | 少ない |
| テスタビリティ | ProviderContainer で完結 | MockBloc | 手動 |
| 型安全 | コンパイル時チェック | 実行時 | 実行時 |

Riverpod は DI を内蔵しており、GetIt 等の追加パッケージが不要。`@riverpod` マクロでボイラープレートを最小化しつつ、AsyncNotifier で Supabase の非同期操作を自然に扱える。

## Consequences

- `riverpod_generator` と `build_runner` の codegen が必要
- Provider の命名規約（`xxxProvider`, `xxxNotifier`）を統一する必要がある
- BLoC と比べてコミュニティの事例は少ないが急速に増加中
- テスト時は `ProviderContainer` でオーバーライドが簡潔

## References

- [Riverpod 公式](https://riverpod.dev/)
- [Flutter State Management 2025 比較](https://nurobyte.medium.com/flutter-state-management-in-2025-riverpod-vs-bloc-vs-signals-8569cbbef26f)
