# ADR-001: デスクトップフレームワークに Tauri v2 を採用

## Status

Accepted

## Decision

クロスプラットフォームデスクトップアプリのフレームワークとして Tauri v2 を採用する。

## Context

ClipSync は Mac と Windows で動作するデスクトップアプリが必要。クリップボード操作、グローバルホットキー、システムトレイなどの OS ネイティブ機能を使う。選択肢として Electron と Tauri が候補。

## Consideration

| 項目 | Tauri v2 | Electron |
|------|----------|----------|
| バイナリサイズ | ~10MB | ~150MB |
| メモリ使用量 | 低い（OS WebView利用） | 高い（Chromium同梱） |
| バックエンド言語 | Rust | Node.js |
| クリップボード | プラグインあり | API あり |
| グローバルホットキー | プラグインあり | globalShortcut API |
| ディープリンク | プラグインあり | protocol handler |
| クロスプラットフォーム | Mac/Windows/Linux | Mac/Windows/Linux |

Rust バックエンドにより、クリップボード操作やシステム連携がネイティブに近いパフォーマンスで実現できる。バイナリサイズとメモリ消費の差が大きい。

## Consequences

- Rust の学習コストがある
- Tauri v2 のプラグインエコシステムは v1 から移行途中のものがある
- macOS では WebView(WKWebView) を使うため、ブラウザ間の差異は少ない
- フロントエンドは React + TypeScript + Vite で、Web 開発の知見がそのまま使える

## References

- [Tauri v2 公式ドキュメント](https://v2.tauri.app/)
- [Tauri vs Electron 比較](https://tauri.app/blog/tauri-vs-electron/)
