# Spec: UI Components

> Trigger: AuthScreen.tsx, ClipList.tsx, ClipItem.tsx, HistoryPicker.tsx, SettingsPanel.tsx, ShortcutRecorder.tsx, App.tsx, index.css
> Last updated: 2026-03-24

## 概要

React コンポーネント構成と UX パターン。

## コンポーネントツリー

```
App
├── (loading) → "Loading..."
├── (未認証) → AuthScreen
└── (認証済み)
    ├── header (ClipSync + Sign out)
    ├── ClipList
    │   └── ClipItem × N
    ├── HistoryPicker (⌘⇧V で表示)
    ├── SettingsPanel (⌘, で表示)
    │   └── ShortcutRecorder × 2
    └── Toast (操作フィードバック)
```

## コンポーネント仕様

### AuthScreen
- Props: `onSignIn: () => void`
- 表示: アプリ名 + 説明 + "Sign in with Google" ボタン

### ClipList
- Props: `clips`, `onCopy`, `onTogglePin`, `onDelete`
- 空状態: 「No clips yet」+ ショートカットヒント表示
- ピン留めクリップは Supabase 側でソート済み（`ORDER BY pinned DESC`）

### ClipItem
- Props: `clip`, `onCopy`, `onTogglePin`, `onDelete`
- コンテンツクリック → `onCopy(clip)`
- ホバーでアクションボタン表示（CSS `opacity` トランジション）
- ピンボタン: 📋 (未ピン) / 📌 (ピン済み)
- 削除ボタン: ✕（2段階確認: 1回目で「Delete?」表示、2回目で実行、3秒で自動キャンセル）
- メタ情報: デバイス名 + 相対時間（`timeAgo()`）

### HistoryPicker
- Props: `clips`, `onSelect`, `onDismiss`
- モーダルオーバーレイ（背景クリックで閉じる）
- キーボード操作: ↑↓ で巡回、Enter で選択、Escape で閉じる
- `⌘⇧V` 連打でも次の候補に移動

### SettingsPanel
- Props: `onClose`, `showToast`
- モーダルオーバーレイ（HistoryPicker と同じパターン）
- `⌘+,` またはヘッダーの歯車アイコンで開く
- `useShortcuts` フックで Rust 側の設定を読み書き
- 「Reset to Defaults」ボタン

### ShortcutRecorder
- Props: `label`, `currentShortcut`, `onRecord`
- クリックで録音モード（「Press keys...」表示、パルスアニメーション）
- キー入力を `keyEventToShortcutString()` で Tauri 形式に変換
- Escape でキャンセル、修飾キーのみは無視
- `shortcutKeys.ts`: キーイベント → ショートカット文字列変換ユーティリティ

### Toast (useToast)
- 1800ms で自動消滅
- CSS アニメーション: slideUp → fadeOut
- 画面下部中央に表示

## スタイリング

- 全スタイルは `index.css` に集約（CSS-in-JS 不使用）
- CSS カスタムプロパティでテーマ定義
- `prefers-color-scheme: dark` でダークモード自動対応
- フォント: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- コードフォント: `"SF Mono", "Fira Code", "Cascadia Code", monospace`

## ウィンドウ設定

- サイズ: 420 × 640
- リサイズ可能
- タイトル: "ClipSync"
- ヘッダー: `-webkit-app-region: drag` でドラッグ移動対応
