# Spec: Clipboard Flow

> Trigger: commands.rs, lib.rs, shortcuts.rs, picker.rs, App.tsx
> Last updated: 2026-03-24

## 概要

グローバルホットキーによるクリップボードの保存・呼び出しフロー。

## IPC コマンド

| コマンド | ファイル | 機能 |
|---------|---------|------|
| `read_clipboard` | commands.rs | システムクリップボードからテキスト読み取り |
| `write_clipboard` | commands.rs | システムクリップボードにテキスト書き込み |
| `get_device_name` | commands.rs | ホスト名を返す |
| `log_from_frontend` | commands.rs | フロントエンドのログを Rust logger に転送 |
| `get_auth_redirect_url` | lib.rs | dev/release の OAuth リダイレクト URL を返す |

## グローバルホットキー

| ショートカット | イベント | 動作 |
|-------------|---------|------|
| `CmdOrCtrl+Alt+C` | `save-clip` | クリップボード内容を Supabase に保存 |
| `CmdOrCtrl+Alt+V` | `show-history` | HistoryPicker を表示 |

> Note: Alt修飾キーを使用することで、Windowsの画面キャプチャツールやDevToolsとの競合を回避。

登録: `lib.rs` の `register_hotkeys()` で `tauri_plugin_global_shortcut` を使用。

## 保存フロー

1. ユーザーが `⌘+Alt+C` (Mac) / `Ctrl+Alt+C` (Windows) を押す
2. Rust: `global_shortcut` → `emit("save-clip", ())`
3. Frontend (App.tsx): `listen("save-clip")` でキャッチ
4. `invoke("read_clipboard")` → クリップボードテキスト取得
5. 空文字チェック（空なら無視）
6. `invoke("get_device_name")` → デバイス名取得
7. `saveClip({ content, device_name })` → Supabase INSERT
8. 成功: `logger.info()` + トースト表示

## ペーストフロー（Spotlight 風フローティングピッカー）

1. ユーザーが `⌘+Alt+V` を押す（どのアプリからでも）
2. Rust `shortcuts.rs`: `show-history` イベント emit + `picker::show_picker()` 呼び出し
3. `picker.rs`: NSWorkspace で前のアプリの PID を記録
4. フローティングウィンドウ（`picker.html`）を画面中央に表示（always_on_top）
5. main window が `request-clips` を受けて `clips-for-picker` で clips データを push
6. PickerApp: fuse.js で曖昧検索、↑↓ で選択
7. Enter: `invoke("paste_from_picker", { text })` を呼び出し
8. Rust `picker.rs`:
   a. クリップボードに書き込み
   b. ピッカーウィンドウを hide
   c. NSRunningApplication で前のアプリを activate
   d. 150ms 待機後、CGEvent で ⌘+V をシミュレート
9. 前のアプリにペーストされる

## エッジケース

- **空クリップボード**: `content.trim() === ""` の場合スキップ
- **100KB 超**: `MAX_CONTENT_LENGTH = 100_000` で切り詰め
- **連打**: 同一内容の重複保存は現在未対応（将来検討）

## ショートカットカスタマイズ

`shortcuts.rs` モジュールで管理。`tauri-plugin-store` で永続化。

| コマンド | 機能 |
|---------|------|
| `get_shortcuts` | 現在のショートカット設定を取得 |
| `update_shortcut` | 指定アクションのショートカットを変更（検証 + 再登録 + 永続化） |
| `reset_shortcuts` | デフォルトにリセット |

- 設定画面: `⌘+,` またはヘッダーの歯車アイコンで開く
- キーキャプチャ: `ShortcutRecorder` コンポーネントでキー入力を検出
- 競合検出: 同一ショートカットの重複割り当てを拒否
- 永続化先: `tauri-plugin-store` → アプリデータディレクトリの `shortcuts.json`
- デフォルト: `CmdOrCtrl+Alt+C` (save), `CmdOrCtrl+Alt+V` (history)

## プラグイン依存

- `tauri-plugin-clipboard-manager`: クリップボード R/W
- `tauri-plugin-global-shortcut`: ホットキー登録
- `tauri-plugin-shell`: ブラウザ URL オープン
- `tauri-plugin-deep-link`: OAuth コールバック（release モード）
- `tauri-plugin-store`: ショートカット設定永続化
