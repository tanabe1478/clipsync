# Spec: Mobile App (Flutter)

> Trigger: clip.dart, clips_repository.dart, clips_notifier.dart, realtime_clips.dart, auth_notifier.dart, auth_provider.dart, share_handler.dart, app_router.dart
> Last updated: 2026-03-24

## 概要

Flutter によるモバイルアプリ（Phase 2: Android, Phase 3: iOS）。デスクトップと同じ Supabase バックエンドを共有。

## アーキテクチャ（ADR-007）

Feature-First + Clean Architecture。機能単位で独立、共有モデルは `shared/` に配置。

```
mobile/lib/
├── app/          # router, theme
├── core/         # supabase_client, logger, constants
├── shared/       # models (Clip), widgets (toast)
├── features/
│   ├── auth/     # Google OAuth via supabase_flutter
│   ├── clips/    # CRUD + Realtime + UI
│   ├── share/    # Android 共有シート受信
│   └── settings/ # デバイス名、サインアウト
└── router/       # go_router
```

## 状態管理（ADR-006）

Riverpod 3.x。`@riverpod` マクロで AsyncNotifier を生成。

## データモデル

`@freezed class Clip` — デスクトップの `types.ts` と完全一致:

```dart
@freezed
class Clip with _$Clip {
  const factory Clip({
    required String id,
    required String userId,      // JSON: user_id
    required String content,
    required String deviceName,  // JSON: device_name
    required bool pinned,
    required String createdAt,   // JSON: created_at
  }) = _Clip;

  factory Clip.fromJson(Map<String, dynamic> json) => _$ClipFromJson(json);
}
```

## CRUD（desktop useClips.ts と同一ロジック）

| 操作 | クエリ | バリデーション |
|------|--------|-------------|
| fetch | `SELECT ... ORDER BY pinned DESC, created_at DESC LIMIT 50` | |
| save | `INSERT ... RETURNING *` | 空文字拒否、100KB 切り詰め、重複スキップ |
| togglePin | `UPDATE SET pinned = !pinned WHERE id = ?` | |
| delete | `DELETE WHERE id = ?` | 確認ダイアログ |

## Realtime（desktop useRealtimeClips.ts と同一パターン）

- チャネル: `clips:{userId}`
- INSERT: ID 重複チェック後に先頭追加（BUG-004 対策）
- UPDATE: 該当クリップ置換
- DELETE: フィルタ除外

## 認証（desktop と異なる）

モバイルでは `supabase_flutter` がネイティブの Custom Tabs/ASWebAuthenticationSession で OAuth を処理。desktop の localhost サーバー（auth_server.rs）は不要。

## 共有シート（Android 固有）

`receive_sharing_intent` で他アプリからテキストを受信 → 確認画面 → clips テーブルに保存。

## デバイス名

`device_info_plus` で Android モデル名を取得（例: "Pixel 8"）。desktop は `hostname` crate。
