# fotonoza

`fotonoza` is a Linux-first desktop photo workflow app built with Tauri + React + TypeScript.
It targets engaged amateurs and freelancers who want fast, focused editing without heavyweight pro-tool complexity.

## Stack

- Tauri 2 (Rust backend + desktop shell)
- React + TypeScript + Vite
- Tailwind CSS 4
- Zustand for app state and undo/redo timeline
- Darktable CLI adapter (backend command boundary)

## Current architecture

- Lightroom-inspired layout foundation: `Import`, `View`, `Edit` modes
- Central Zustand store with `present/past/future` snapshots
- History list capped to the last 100 operations
- Sidecar persistence boundaries:
  - app state: `.fotonoza`
  - per-photo state: `.{photo_filename}.fotonoza`
- Typed localization JSON files:
  - `src/locales/en.json`
  - `src/locales/pl.json`

## Run in development

Prerequisites:

- Node.js + npm
- Rust toolchain (`cargo`, `rustc`)
- Tauri Linux dependencies

Install dependencies:

```bash
npm install
```

Run desktop app (Tauri + Vite):

```bash
npm run dev
```

Optional web-only frontend dev server:

```bash
npm run dev:web
```

## Build

Build frontend:

```bash
npm run build
```

Build desktop bundles:

```bash
npm run tauri build
```

## Notes

- This repository intentionally uses exact dependency versions (pinned in `package.json`).
- Darktable integration is scaffolded through backend commands and can be expanded into full import/edit/export pipelines.
