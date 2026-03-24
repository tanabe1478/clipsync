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

### BUG-004: クリップ保存時に同じクリップが2つ表示される

- **発見日**: 2026-03-24
- **影響**: ⌘+Shift+C でクリップ保存すると、リストに同じ内容のクリップが2つ表示される
- **原因**: `saveClip` がローカル state に即追加（楽観的更新）し、その直後に Supabase Realtime の INSERT イベントが到着して `useRealtimeClips` が同じクリップを再度追加
- **修正**: `useRealtimeClips` の INSERT ハンドラで `prev.some((c) => c.id === payload.new.id)` による重複チェックを追加
- **教訓**: 楽観的更新と Realtime を併用する場合、Realtime 側で既存 ID をスキップする重複排除が必須

### BUG-005: enigo による Cmd+V シミュレーションが macOS でクラッシュ

- **発見日**: 2026-03-24
- **影響**: ピッカーからクリップ選択後、IME 候補確定の Enter でアプリがクラッシュ
- **原因**: `enigo` の `keycode_to_string` が `TSMGetInputSourceProperty` を呼ぶが、これはメインスレッド必須の macOS API。`std::thread::spawn` 内から呼ばれてスレッド違反
- **修正**: macOS では enigo を使わず `core-graphics` の `CGEvent` API で直接キーイベントを生成。CGEvent はスレッドセーフ
- **教訓**: macOS のキーボードシミュレーションには CGEvent API を使うこと。enigo は内部で TSM API を呼ぶためメインスレッド外で使えない

### BUG-006: ピッカー選択後にメインウィンドウにフォーカスが移る

- **発見日**: 2026-03-24
- **影響**: ピッカーからクリップ選択すると ClipSync のメインウィンドウが前に出て、ペーストが ClipSync にされてしまう
- **原因**: picker ウィンドウを hide すると macOS が同一アプリの別ウィンドウ（メインウィンドウ）にフォーカスを移す
- **修正**: Raycast/Alfred 方式を採用。ピッカー表示前に NSWorkspace で前のアプリの PID を記録し、選択後に NSRunningApplication で明示的に activate
- **教訓**: macOS でフローティングウィンドウから前のアプリに戻すには、個別ウィンドウの hide ではなくアプリレベルの activate が必要

## パターン集

### パターン: macOS でのキーボードシミュレーション

CGEvent API を使う。enigo はメインスレッド制約で使えない場合がある:
```rust
use core_graphics::event::{CGEvent, CGEventFlags, CGEventTapLocation};
let key_down = CGEvent::new_keyboard_event(source, V_KEY, true)?;
key_down.set_flags(CGEventFlags::CGEventFlagCommand);
key_down.post(CGEventTapLocation::HID);
```

### パターン: Raycast 方式のフォーカス管理

フローティングピッカーから前のアプリに戻る:
1. 表示前: `NSWorkspace::sharedWorkspace().frontmostApplication()` で PID を記録
2. 選択後: `NSRunningApplication::runningApplicationWithProcessIdentifier(pid).activate()`
3. 待機後: CGEvent でキーシミュレート

### パターン: Tauri プラグインの dev モード対応

バンドルされていない dev モードではネイティブ機能の一部が使えない。`register()` 系は `if let Err` でグレースフルに処理し、代替フロー（localhost HTTP サーバーなど）を用意する。

### パターン: Supabase RLS + DEFAULT

RLS で `auth.uid()` を参照するカラムには必ず `DEFAULT auth.uid()` を設定する。これによりフロントエンドから `user_id` を明示的に送る必要がなくなり、RLS ポリシーとの整合性が自然に保たれる。

### パターン: 楽観的更新 + Realtime の重複排除

楽観的更新（ローカル即反映）と Realtime（サーバーからの通知）を併用する場合、Realtime の INSERT ハンドラで `id` の重複チェックが必須。同じデバイスからの操作は楽観的更新で即表示し、他デバイスからの操作は Realtime で受信する設計。

### パターン: フロントエンドエラーの可視化

`catch` ブロックでエラーを握り潰さず、`logger.error()` で Rust 側のログに転送する。これにより `/tmp/tauri-dev.log` でフロントエンドのエラーも一元的に確認できる。
