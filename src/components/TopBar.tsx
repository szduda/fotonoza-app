import type { ReactElement } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useAppStore } from "../store/appStore";
import { t } from "../lib/i18n";
import { chrome } from "./layout/chromeTheme";

export function TopBar({ onOpenExport }: { onOpenExport: () => void }): ReactElement {
  const { locale, mode } = useAppStore((s) => s.present);
  const actions = useAppStore((s) => s.actions);

  const pickImportFiles = async () => {
    const picked = await open({
      multiple: true,
      filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "raw"] }]
    });
    if (Array.isArray(picked) && picked.length) {
      actions.importPreviewPhotos(picked);
    }
  };

  const btn = `rounded border border-neutral-600/45 px-2.5 py-1 text-sm transition-colors ${chrome.panelBg} ${chrome.panelText} hover:bg-neutral-400/40`;
  const btnPrimary = `${btn} font-medium`;

  const modeBtnBase =
    "px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide transition-colors";
  const modeBtnActive = `${chrome.panelBg} ${chrome.panelText}`;
  const modeBtnInactive = `${chrome.mutedText} hover:bg-neutral-900`;

  return (
    <div className="flex h-full w-full items-center justify-between gap-3 px-4 py-2">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className={`shrink-0 text-lg font-medium tracking-tight ${chrome.panelText}`}>
          {t(locale, (m) => m.appTitle)}
        </div>
        <div className="hidden shrink-0 items-center overflow-hidden rounded border border-neutral-600/50 sm:flex">
          <button
            type="button"
            className={`${modeBtnBase} ${mode === "view" ? modeBtnActive : modeBtnInactive}`}
            onClick={() => actions.setMode("view")}
          >
            {t(locale, (m) => m.mode.view)}
          </button>
          <span className="text-neutral-600">|</span>
          <button
            type="button"
            className={`${modeBtnBase} ${mode === "edit" ? modeBtnActive : modeBtnInactive}`}
            onClick={() => actions.setMode("edit")}
          >
            {t(locale, (m) => m.mode.edit)}
          </button>
        </div>
      </div>
      <div className={`flex flex-wrap items-center justify-end gap-2 text-sm ${chrome.mutedText}`}>
        <button type="button" className={btn} onClick={actions.undo}>
          {t(locale, (m) => m.actions.undo)}
        </button>
        <button type="button" className={btn} onClick={actions.redo}>
          {t(locale, (m) => m.actions.redo)}
        </button>
        <button type="button" className={btnPrimary} onClick={() => void pickImportFiles()}>
          {t(locale, (m) => m.actions.importFromDevice)}
        </button>
        <button type="button" className={btnPrimary} onClick={onOpenExport}>
          {t(locale, (m) => m.actions.export)}
        </button>
      </div>
    </div>
  );
}
