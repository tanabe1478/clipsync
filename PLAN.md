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
      ├── ClipList + ClipItem
      └── HistoryPicker
```

### Steps
1. [x] Project scaffolding (Tauri v2 + Vite + React)
2. [x] Supabase migration (clips table + RLS + Realtime)
3. [x] Tauri Rust side (clipboard, hotkeys, deep link, IPC commands)
4. [x] Frontend data layer (types, hooks, Supabase client)
5. [x] UI components (AuthScreen, ClipList, HistoryPicker)
6. [x] OAuth deep link flow (clipsync:// scheme)
7. [x] UI styling (dark mode, animations, toast)
8. [x] Edge cases (empty content, content truncation)
9. [x] Build verification (tsc, vite build, cargo tauri build)

### Remaining
- [ ] Supabase project setup + Google OAuth config (manual)
- [ ] Live integration test with real Supabase
- [ ] System tray icon
- [ ] Auto-start on login
- [ ] Windows build test
