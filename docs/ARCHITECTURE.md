# fotonoza architecture

## Principles

- Keep feature files small and composable; avoid over-fragmenting trivial constants.
- Use one main store (`useAppStore`) as the source of truth and route all mutations through actions.
- Persist every mutation to `.fotonoza` and persist photo-level edits to `.{photo_filename}.fotonoza`.
- Maintain a capped operation timeline (100 entries) with explicit undo/redo and jump-to-state.

## UI composition

- `AppLayout` defines a Lightroom-like shell:
  - top toolbar for import/undo/redo/export
  - center workspace with mode-specific content (`import`, `view`, `edit`)
  - right edit sidebar (histogram + effects)
  - bottom filmstrip in edit mode
  - history panel on the side
- Reusable components:
  - `HistogramCanvas` encapsulates canvas rendering backend
  - `ExportModal` centralizes export form and settings
  - `HistoryPanel` centralizes operation navigation

## State and history

- `present` keeps the active state.
- `past` and `future` keep undo/redo snapshots (both capped).
- Each mutating action uses one helper (`withUndo`) so:
  - history is appended uniformly
  - future is cleared on new actions
  - persistence is triggered in one place

## Backend adapters

- Rust `tauri::command`s are the adapter boundary:
  - `save_app_state` / `load_app_state`
  - `save_photo_state`
  - `run_darktable_operation`
- JS/TS calls backend through `src/lib/persistence.ts`; UI and store do not know Rust details.
- This creates flexibility to evolve Darktable integration or file formats without touching UI code.

## Localization

- All labels come from `src/locales/en.json` and `src/locales/pl.json`.
- `TranslationSchema` is shared type contract that keeps locale files structurally aligned.
