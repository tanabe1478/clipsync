# ClipSync - Implementation Plan

## Phase 1: Desktop (Mac + Windows) ✅

- [x] Tauri v2 + React + TypeScript scaffold
- [x] Supabase: clips table, RLS, Realtime, Google OAuth
- [x] Clipboard save/paste via global hotkeys (customizable)
- [x] Spotlight-style floating picker with fuzzy search + auto-paste
- [x] Settings panel, shortcut customization
- [x] Dark mode, toast notifications
- [x] E2E tests (Playwright), unit tests (vitest + cargo test)
- [x] 3-tier documentation infrastructure (ADR-004)

## Phase 2: Android ✅

- [x] Flutter app with Riverpod + go_router
- [x] Google OAuth via supabase_flutter
- [x] Clip CRUD + Realtime sync
- [x] Share sheet (ShareReceiverActivity → direct Supabase REST)
- [x] FAB clipboard save, auto-refresh on foreground
- [x] Settings screen

## Phase 3: iOS (planned)

- [ ] Flutter iOS build
- [ ] Universal Links for OAuth
- [ ] Share extension
- [ ] App Store submission

## Remaining improvements

- [ ] E2E encryption (client-side encrypt before Supabase)
- [ ] Image/file clipboard support
- [ ] Search in main clip list
- [ ] Auto-expiry (24h auto-delete)
- [ ] System tray icon (desktop)
- [ ] Auto-start on login (desktop)
