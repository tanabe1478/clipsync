# Spec: Supabase Data Layer

> Trigger: useClips.ts, useRealtimeClips.ts, supabase.ts, types.ts, 00001_create_clips.sql, 00002_clips_user_id_default.sql
> Last updated: 2026-03-24

## 概要

Supabase PostgreSQL によるクリップデータの永続化・同期。

## テーブルスキーマ: `clips`

| カラム | 型 | デフォルト | 備考 |
|--------|-----|----------|------|
| `id` | UUID | `gen_random_uuid()` | PK |
| `user_id` | UUID | `auth.uid()` | FK → auth.users, ON DELETE CASCADE |
| `content` | TEXT | - | NOT NULL |
| `device_name` | TEXT | `'Unknown'` | NOT NULL |
| `pinned` | BOOLEAN | `false` | NOT NULL |
| `created_at` | TIMESTAMPTZ | `now()` | NOT NULL |

## インデックス

- `idx_clips_user_id_created_at`: `(user_id, created_at DESC)` — 最新クリップ取得用
- `idx_clips_user_id_pinned`: `(user_id, pinned) WHERE pinned = true` — ピン留めクリップ取得用（部分インデックス）

## RLS ポリシー

4ポリシー全て `auth.uid() = user_id` で制限:
- SELECT: 自分のクリップのみ読み取り
- INSERT: `user_id` が自分のもののみ挿入（`DEFAULT auth.uid()` で自動設定）
- UPDATE: 自分のクリップのみ更新
- DELETE: 自分のクリップのみ削除

## Realtime

- `REPLICA IDENTITY FULL` 設定済み（UPDATE/DELETE で全カラムをブロードキャスト）
- `supabase_realtime` publication に `clips` テーブルを追加済み
- フロント: `useRealtimeClips` が `clips:{userId}` チャネルを購読
- INSERT → リストの先頭に追加、UPDATE → 該当クリップを置換、DELETE → フィルタで除外

## TypeScript 型

```typescript
interface Clip {
  readonly id: string;
  readonly user_id: string;
  readonly content: string;
  readonly device_name: string;
  readonly pinned: boolean;
  readonly created_at: string;
}

interface NewClip {
  readonly content: string;
  readonly device_name: string;
  readonly pinned?: boolean;
  // user_id は省略（DB デフォルト auth.uid()）
}
```

## CRUD 操作 (`useClips`)

| 操作 | クエリ | 備考 |
|------|--------|------|
| fetchClips | `SELECT ... ORDER BY pinned DESC, created_at DESC LIMIT 50` | ピン留め優先 |
| saveClip | `INSERT ... RETURNING *` | 空文字拒否、100KB 切り詰め |
| togglePin | `UPDATE SET pinned = !pinned WHERE id = ?` | |
| deleteClip | `DELETE WHERE id = ?` | |

## 不変性パターン

全ての状態更新は新しい配列を返す:
- `setClips((prev) => [newClip, ...prev])` — 先頭追加
- `setClips((prev) => prev.map(...))` — 更新
- `setClips((prev) => prev.filter(...))` — 削除
