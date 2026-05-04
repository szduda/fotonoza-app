# fotonoza

`fotonoza` is a cross-platform desktop photo workflow app built with Tauri + React + TypeScript (developed primarily on Linux, also usable on macOS and Windows where the same stack is installed).
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
- **Linux:** Tauri system dependencies for your distro (see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)).

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

## macOS

### Prerequisites

- **Xcode Command Line Tools** (compiler toolchain for Rust crates with native code): run `xcode-select --install` and complete the installer.
- **Rust** (`cargo`, `rustc`): install via [rustup](https://rustup.rs/) or Homebrew’s `rustup-init`.
- **Node.js 20+** and npm: from [nodejs.org](https://nodejs.org/), [nvm](https://github.com/nvm-sh/nvm), or `brew install node`.
- **Darktable** (optional but recommended): histogram and export use `darktable-cli`. Install the app, then ensure `darktable-cli` is on your `PATH` (see below).

### One-time setup (copy-paste)

Adjust the shell config file if you use bash (`~/.bash_profile`) instead of zsh.

```bash
# 1) Xcode CLT (opens a GUI installer — skip if already installed)
xcode-select --install

# 2) Rust (non-interactive default profile)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
rustc --version

# 3) Node (pick one)
#    Homebrew:
#    brew install node
#    Or install from https://nodejs.org/ — then:
node --version
npm --version

# 4) Clone / enter repo (if you have not already)
# git clone <your-fork-or-remote> fotonoza-app && cd fotonoza-app

# 5) JS dependencies
npm install

# 6) Homebrew (optional; skip if you already use brew)
# /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 7) Darktable + CLI on PATH (Homebrew cask installs darktable.app under /Applications)
brew install --cask darktable
echo 'export PATH="/Applications/darktable.app/Contents/MacOS:$PATH"' >> ~/.zshrc
source ~/.zshrc
command -v darktable-cli
```

If `command -v darktable-cli` prints nothing, locate `darktable-cli` inside the app bundle (**Finder → Applications → darktable.app → Show Package Contents → Contents/MacOS**) and add that folder to `PATH` as in step 7.

The first time you open a locally built `.app`, macOS may block it until you allow it under **Privacy & Security** or use **Right‑click → Open** in Finder.

### Run dev (macOS)

From the repository root:

```bash
npm run dev
```

This runs the Tauri dev shell with Vite on `http://localhost:1420` (see `src-tauri/tauri.conf.json`).

### Production build and run (macOS)

```bash
npm run tauri:build
```

Artifacts (paths vary slightly by Apple Silicon vs Intel):

- **Application bundle:** `src-tauri/target/release/bundle/macos/fotonoza.app` — open it from Finder or run `open src-tauri/target/release/bundle/macos/fotonoza.app`.
- **DMG / other bundle targets:** under `src-tauri/target/release/bundle/` (e.g. `dmg/`) when enabled in Tauri bundle settings.

To run the unsigned dev bundle from Terminal without Finder:

```bash
open "src-tauri/target/release/bundle/macos/fotonoza.app"
```

## Build

Build frontend:

```bash
npm run build
```

Build desktop bundles:

```bash
npm run tauri:build
```

Equivalent if you prefer invoking the CLI through the local npm script entry:

```bash
npm run tauri -- build
```

## Notes

- This repository intentionally uses exact dependency versions (pinned in `package.json`).
- Darktable integration is scaffolded through backend commands and can be expanded into full import/edit/export pipelines.
