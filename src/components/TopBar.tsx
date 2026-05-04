import type { ReactElement } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useAppStore } from "../store/appStore";
import { t } from "../lib/i18n";
import { chrome } from "./layout/chromeTheme";
import { SelectedCount } from "./SelectedCount";
import logoUrl from "../assets/fotonoza-logo.svg";

/** WebKit on macOS; avoids extra Tauri OS plugin for import dialog filters only. */
function isMacClient(): boolean {
  if (typeof navigator === "undefined") return false;
  if (/mac os x/i.test(navigator.userAgent)) return true;
  const p = navigator.platform;
  return typeof p === "string" && p.toLowerCase().includes("mac");
}

const IMPORT_EXT_DEFAULT = ["jpg", "jpeg", "png", "raw"] as const;
/** Common camera / Photos / screenshot extensions on macOS (lowercase for dialog API). */
const IMPORT_EXT_MAC = [
  ...IMPORT_EXT_DEFAULT,
  "webp",
  "tif",
  "tiff",
  "heic",
  "heif",
  "dng",
  "cr2",
  "cr3",
  "nef",
  "nrw",
  "arw",
  "orf",
  "rw2",
  "raf",
  "pef",
  "srw",
  "3fr",
  "fff",
  "mef",
  "mrw",
  "x3f",
  "kdc",
  "dcr"
] as const;

export function TopBar({ onOpenExport }: { onOpenExport: () => void }): ReactElement {
  const { locale, mode } = useAppStore((s) => s.present);
  const actions = useAppStore((s) => s.actions);

  const pickImportFiles = async () => {
    const exts = isMacClient() ? IMPORT_EXT_MAC : IMPORT_EXT_DEFAULT;
    const picked = await open({
      multiple: true,
      filters: [{ name: "Images", extensions: [...exts] }]
    });
    if (Array.isArray(picked) && picked.length) {
      actions.importPreviewPhotos(picked);
    }
  };

  const iconBtn = `inline-flex h-8 px-2 items-center justify-center rounded border border-neutral-600/45 text-sm transition-colors ${chrome.panelBg} ${chrome.panelText} hover:bg-neutral-400/40`;

  const modeBtnBase =
    "px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide transition-colors";
  const modeBtnActive = `${chrome.panelBg} ${chrome.panelText}`;
  const modeBtnInactive = `${chrome.mutedText} hover:bg-neutral-800/90 cursor-pointer`;

  return (
    <div className="grid h-full w-full grid-cols-[1fr_auto_1fr] items-center gap-3 pl-1 pr-4 py-2">
      <div className="flex min-w-0 items-center gap-2 ">
        <img src={logoUrl} alt={t(locale, (m) => m.appTitle)} className="h-8 w-8 shrink-0 select-none" />

        <div className="hidden shrink-0 items-center overflow-hidden rounded sm:flex">
          <button
            className={`${modeBtnBase} ${mode === "view" ? modeBtnActive : modeBtnInactive}`}
            disabled={mode === "view"}
            onClick={() => actions.setMode("view")}
          >
            {t(locale, (m) => m.mode.view)}
          </button>
          <span className="h-4 border-l border-neutral-600/70" />
          <button
            className={`${modeBtnBase} ${mode === "edit" ? modeBtnActive : modeBtnInactive}`}
            disabled={mode === "edit"}
            onClick={() => actions.setMode("edit")}
          >
            {t(locale, (m) => m.mode.edit)}
          </button>
        </div>
      </div>

      <SelectedCount />

      <div className={`flex flex-wrap items-center justify-end gap-2 text-sm ${chrome.mutedText}`}>
        <button
          className={iconBtn}
          aria-label={t(locale, (m) => m.actions.undo)}
          title={t(locale, (m) => m.actions.undo)}
          onClick={actions.undo}
        >
          <UndoIcon />
        </button>
        <button
          className={iconBtn}
          aria-label={t(locale, (m) => m.actions.redo)}
          title={t(locale, (m) => m.actions.redo)}
          onClick={actions.redo}
        >
          <RedoIcon />
        </button>
        <button
          className={iconBtn}
          aria-label={t(locale, (m) => m.actions.importFromDevice)}
          title={t(locale, (m) => m.actions.importFromDevice)}
          onClick={() => void pickImportFiles()}
        >
          Import
        </button>
        <button
          className={iconBtn}
          aria-label={t(locale, (m) => m.actions.export)}
          title={t(locale, (m) => m.actions.export)}
          onClick={onOpenExport}
        >
          <ExportIcon />
        </button>
      </div>
    </div>
  );
}

function UndoIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M9 7 5 11l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 11h7a6 6 0 1 1 0 12h-1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RedoIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="m15 7 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 11h-7a6 6 0 1 0 0 12h1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExportIcon(): ReactElement {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 16V5" strokeLinecap="round" />
      <path d="m8 9 4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 19h14" strokeLinecap="round" />
    </svg>
  );
}
