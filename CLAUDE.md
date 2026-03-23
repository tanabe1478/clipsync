# ClipSync

Cross-platform cloud clipboard sync app.

## Tech Stack

- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Desktop**: Tauri v2 (Rust + React + TypeScript + Vite)
- **Auth**: Google Sign-In via Supabase Auth

## Project Structure

```
clipsync/
├── src/                  # React frontend
│   ├── components/       # UI components
│   ├── hooks/            # React hooks (useAuth, useClips, etc.)
│   └── lib/              # Supabase client, types
├── src-tauri/            # Tauri Rust backend
│   └── src/              # Rust source (clipboard, hotkeys, commands)
├── supabase/migrations/  # SQL migrations
└── docs/                 # Documentation
```

## Build & Run

```bash
pnpm install              # Install frontend dependencies
cargo tauri dev           # Run in dev mode (builds Rust + starts Vite)
```

## Test

```bash
pnpm test                 # Frontend tests (vitest)
cargo test --manifest-path src-tauri/Cargo.toml  # Rust tests
```

## Conventions

- **Immutability**: Never mutate state; always create new objects
- **Rust**: rustfmt + clippy with -D warnings
- **TypeScript**: Strict mode, readonly types
- **TDD**: Write tests first

## Data Model

- `clips` table: id, user_id, content, device_name, pinned, created_at
- RLS enforced: users can only access their own clips
- Realtime enabled for cross-device sync

## Phase Plan

- Phase 1: Mac + Windows desktop (current)
- Phase 2: Android
- Phase 3: iPhone
