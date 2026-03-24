# Session Log

## 2026-03-24

### Session 1: Initial scaffold
- Created project scaffold: Vite + React + TypeScript + Tauri v2
- Supabase migration: clips table with RLS, indexes, Realtime
- Rust: clipboard commands, global hotkeys, IPC, OAuth deep link
- Hooks: useAuth, useClips, useRealtimeClips (TDD)
- Components: AuthScreen, ClipList, ClipItem, HistoryPicker
- CSS dark mode, toast, edge cases (empty/truncation)
- E2E tests (Playwright 7), unit tests (28), clippy clean

### Session 2: Supabase setup + features
- Supabase project created, migration pushed, Google OAuth configured
- Dev mode OAuth: localhost:54321 HTTP server for callback
- Frontend logger (Rust log forwarding), RLS fix (DEFAULT auth.uid())
- Realtime dedup fix (BUG-004), duplicate clip prevention
- Shortcut customization (issue #5): tauri-plugin-store, SettingsPanel, ShortcutRecorder
- Delete confirmation dialog (issue #4)
- 3-tier documentation infrastructure (ADR-004): specs, ADRs, hooks
- verify-docs skill for automated infrastructure checks

### Session 3: Android + Floating Picker
- Flutter mobile app (Phase 2): scaffold, auth, CRUD, Realtime, share sheet, settings
- Android: Google OAuth (PKCE), ShareReceiverActivity (direct Supabase REST), FAB clipboard save
- Auto-refresh on foreground resume, BuildConfig for Supabase keys
- Security: DB direct connection blocked, audit passed (no secrets in git)
- README (English + Japanese)
- Spotlight-style floating picker: separate Tauri window, fuse.js fuzzy search
- Raycast-style auto-paste: NSWorkspace PID tracking → NSRunningApplication activate → CGEvent Cmd+V
- Fixed: enigo TSM crash (BUG-005), focus management (BUG-006)
- Removed HistoryPicker overlay (replaced by floating picker)
- mad-agents-skills git submodule for Flutter development skills
- ADR 005-007: Flutter, Riverpod, Feature-First architecture
