# ClipSync

Cross-platform cloud clipboard sync. Copy on one device, paste on another.

[日本語ドキュメント](docs/README.ja.md)

## Features

- **Global hotkeys** — Save clipboard with `Cmd+Alt+C` (Mac) / `Ctrl+Alt+C` (Windows), paste from history with `Cmd+Alt+V` / `Ctrl+Alt+V`
- **Realtime sync** — Clips appear instantly across all your devices
- **Pin & organize** — Pin important clips to keep them at the top
- **Share sheet** (Android) — Share text from any app directly to ClipSync
- **Customizable shortcuts** — Change hotkeys in Settings (`Cmd+,`)
- **Dark mode** — Automatic light/dark theme

## Platforms

| Platform | Technology | Status |
|----------|-----------|--------|
| macOS | Tauri v2 (Rust + React) | ✅ |
| Windows | Tauri v2 (Rust + React) | ✅ |
| Android | Flutter (Dart + Riverpod) | ✅ |
| iOS | Flutter | Planned |

## Architecture

```
┌─────────┐     ┌───────────────┐     ┌───────────────┐
│  Mac    │────▶│  Supabase     │◀────│  Android App  │
│ Desktop │     │ (PostgreSQL   │     │ (Flutter)     │
└─────────┘     │  + Realtime)  │     └───────────────┘
      │         └───────────────┘
┌─────────┐           ▲
│ Windows │───────────┘
│ Desktop │
└─────────┘
```

- **Backend**: [Supabase](https://supabase.com) — PostgreSQL + Auth + Realtime
- **Desktop**: [Tauri v2](https://v2.tauri.app) — Rust backend + React/TypeScript frontend
- **Mobile**: [Flutter](https://flutter.dev) — Riverpod + go_router + supabase_flutter

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org) 22+
- [pnpm](https://pnpm.io)
- [Rust](https://rustup.rs)
- [Flutter](https://flutter.dev) 3.22+ (for mobile)

### Desktop

```bash
git clone https://github.com/tanabe1478/clipsync.git
cd clipsync
pnpm install
cp .env.example .env  # Add your Supabase URL and anon key
cargo tauri dev
```

### Mobile (Android)

```bash
cd mobile
cp .env.example .env  # Add your Supabase URL and anon key
flutter run
```

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run the migration: `pnpm db:migrate`
3. Enable Google OAuth in Auth → Providers → Google
4. Add redirect URLs in Auth → URL Configuration

## Testing

```bash
# Desktop
pnpm test              # Unit tests (vitest)
pnpm test:e2e          # E2E tests (Playwright)
cargo test --manifest-path src-tauri/Cargo.toml  # Rust tests

# Mobile
cd mobile && flutter test
```

## Project Structure

```
clipsync/
├── src/                  # React frontend (desktop)
├── src-tauri/            # Rust backend (desktop)
├── mobile/               # Flutter app (Android/iOS)
├── supabase/migrations/  # Database migrations
├── e2e/                  # Playwright E2E tests
├── docs/
│   ├── specs/            # Domain specifications
│   ├── adr/              # Architecture Decision Records
│   └── README.ja.md      # Japanese documentation
└── .claude/              # AI development hooks & skills
```

## Documentation

This project uses a [3-tier documentation system](docs/adr/004-three-tier-context-infrastructure.md) based on [arXiv:2602.20478](https://arxiv.org/pdf/2602.20478):

- **Tier 1**: [CLAUDE.md](CLAUDE.md) — Always-loaded project context
- **Tier 2**: [docs/specs/](docs/specs/) — Domain-specific specifications
- **Tier 3**: [docs/adr/](docs/adr/) — Architecture Decision Records

## License

MIT
