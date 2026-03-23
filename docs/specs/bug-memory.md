# Spec: バグメモリ

> Trigger: 全ファイル（デバッグ時に参照）
> Last updated: 2026-03-24

## 概要

過去に発生したバグとその修正パターンを記録する。AI がデバッグ時にこのファイルを参照することで、同じ問題の再発を防ぐ。

## バグ記録

### BUG-001: dev モードでディープリンク登録がクラッシュ

- **発見日**: 2026-03-24
- **影響**: `cargo tauri dev` でアプリが起動直後にパニック
- **原因**: `app.deep_link().register("clipsync")` が非バンドル状態で `unsupported platform` エラーを返し、`?` で即座にパニック
- **修正**: `if let Err(e)` でエラーを補足し、`log::warn!` でログ出力のみに変更
- **教訓**: Tauri プラグインの `register()` 系メソッドは dev モードで失敗する可能性がある。`?` で伝播せずグレースフルに処理すること
- **関連 ADR**: ADR-003

### BUG-002: クリップ保存時に RLS ポリシー違反

- **発見日**: 2026-03-24
- **影響**: `⌘+Shift+C` でクリップ保存が「Failed to save clip」エラー
- **原因**: `clips` テーブルの `user_id` カラムにデフォルト値がなく、フロントエンドから `user_id` を明示的に渡していなかったため `NULL` で INSERT → RLS の `auth.uid() = user_id` チェックに失敗
- **修正**: マイグレーション `00002_clips_user_id_default.sql` で `ALTER TABLE clips ALTER COLUMN user_id SET DEFAULT auth.uid()` を追加
- **教訓**: Supabase RLS で `auth.uid() = user_id` を使う場合、`user_id` カラムに `DEFAULT auth.uid()` を設定しないとフロントエンドから明示的に `user_id` を渡す必要がある
- **関連マイグレーション**: 00002_clips_user_id_default.sql

### BUG-003: 削除ボタンの文字化け

- **発見日**: 2026-03-24
- **影響**: 削除ボタンに `\u{2715}` という文字列がそのまま表示される
- **原因**: JSX テキストノードに Rust 形式の Unicode エスケープ `\u{2715}` を書いていた。JS では `{"\u2715"}` と中括弧で囲む必要がある
- **修正**: `\u{2715}` → `{"\u2715"}` に変更
- **教訓**: JSX でUnicode 文字を表示する場合は `{"\uXXXX"}` 形式にすること。テキストノードに直接 `\u{XXXX}` と書くと文字列リテラルとして表示される

## パターン集

### パターン: Tauri プラグインの dev モード対応

バンドルされていない dev モードではネイティブ機能の一部が使えない。`register()` 系は `if let Err` でグレースフルに処理し、代替フロー（localhost HTTP サーバーなど）を用意する。

### パターン: Supabase RLS + DEFAULT

RLS で `auth.uid()` を参照するカラムには必ず `DEFAULT auth.uid()` を設定する。これによりフロントエンドから `user_id` を明示的に送る必要がなくなり、RLS ポリシーとの整合性が自然に保たれる。

### パターン: フロントエンドエラーの可視化

`catch` ブロックでエラーを握り潰さず、`logger.error()` で Rust 側のログに転送する。これにより `/tmp/tauri-dev.log` でフロントエンドのエラーも一元的に確認できる。
