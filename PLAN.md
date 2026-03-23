# ClipSync - Implementation Plan

## Current: Phase 1 (Mac + Windows Desktop)

### Architecture
```
Tauri App (Rust + React)
  ├── Global Hotkey (⌘⇧C / ⌘⇧V)
  ├── Clipboard Read/Write (Rust)
  ├── Supabase Client (TypeScript)
  │   ├── Auth (Google Sign-In via deep link)
  │   ├── CRUD (clips table)
  │   └── Realtime (Postgres Changes)
  └── UI (React)
      ├── AuthScreen
      ├── ClipList
      └── HistoryPicker
```

### Steps
1. [x] Project scaffolding (Tauri v2 + Vite + React)
2. [x] Supabase migration (clips table + RLS + Realtime)
3. [ ] Tauri Rust side (clipboard, hotkeys, deep link, IPC commands)
4. [ ] Frontend data layer (types, hooks, Supabase client)
5. [ ] UI components (AuthScreen, ClipList, HistoryPicker)
6. [ ] Integration & polish
