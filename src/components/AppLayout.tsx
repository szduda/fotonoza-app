import { useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { useAppStore } from "../store/appStore";
import { t } from "../lib/i18n";
import { HistogramCanvas } from "./HistogramCanvas";
import { ExportModal } from "./ExportModal";
import { HistoryPanel } from "./HistoryPanel";

export function AppLayout(): JSX.Element {
  const [exportOpen, setExportOpen] = useState(false);
  const { mode, photos, selectedPhotoId, locale } = useAppStore((state) => state.present);
  const actions = useAppStore((state) => state.actions);

  const selectedCount = useMemo(() => photos.filter((p) => p.selected).length, [photos]);
  const selectedPhoto = useMemo(
    () => photos.find((photo) => photo.id === selectedPhotoId),
    [photos, selectedPhotoId]
  );

  const pickImportFiles = async () => {
    const picked = await open({ multiple: true, filters: [{ name: "Images", extensions: ["jpg", "jpeg", "png", "raw"] }] });
    if (Array.isArray(picked) && picked.length) {
      actions.importPreviewPhotos(picked);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-zinc-900 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <div className="text-lg font-semibold">{t(locale, (m) => m.appTitle)}</div>
        <div className="flex items-center gap-2 text-sm">
          <button className="rounded bg-zinc-700 px-2 py-1" onClick={actions.undo}>
            {t(locale, (m) => m.actions.undo)}
          </button>
          <button className="rounded bg-zinc-700 px-2 py-1" onClick={actions.redo}>
            {t(locale, (m) => m.actions.redo)}
          </button>
          <button className="rounded bg-emerald-700 px-2 py-1" onClick={pickImportFiles}>
            {t(locale, (m) => m.actions.importFromDevice)}
          </button>
          <button className="rounded bg-sky-700 px-2 py-1" onClick={() => setExportOpen(true)}>
            {t(locale, (m) => m.actions.export)}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-zinc-800 px-4 py-2 text-sm text-zinc-300">
            {t(locale, (m) => m.labels.selectedCount)}: {selectedCount}
          </div>

          {mode === "import" && (
            <section className="grid flex-1 place-items-center">
              <div className="text-center text-zinc-300">{t(locale, (m) => m.actions.importFromDevice)}</div>
            </section>
          )}

          {mode === "view" && (
            <section className="grid flex-1 grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 overflow-auto p-4">
              {photos.length === 0 && <p className="text-zinc-500">{t(locale, (m) => m.labels.noPhotos)}</p>}
              {photos.map((photo) => (
                <button
                  key={photo.id}
                  className={`rounded border p-2 text-left text-xs ${
                    photo.selected ? "border-sky-500 bg-zinc-800" : "border-zinc-700 bg-zinc-900"
                  }`}
                  onClick={() => actions.toggleSelectPhoto(photo.id)}
                  onDoubleClick={() => actions.openInEditor(photo.id)}
                >
                  <div className="aspect-video rounded bg-zinc-800" />
                  <div className="mt-2 truncate">{photo.fileName}</div>
                  <div className="mt-1 flex gap-1">
                    <span className={`rounded px-1 ${photo.approved ? "bg-emerald-700" : "bg-zinc-700"}`}>
                      {photo.approved ? "approved" : "pending"}
                    </span>
                  </div>
                </button>
              ))}
            </section>
          )}

          {mode === "edit" && (
            <section className="flex min-h-0 flex-1">
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="grid flex-1 place-items-center border-b border-zinc-800">
                  <div className="h-[420px] w-[680px] rounded border border-zinc-700 bg-zinc-950" />
                </div>
                <div className="h-28 overflow-x-auto border-t border-zinc-800 p-2">
                  <p className="mb-2 text-xs uppercase text-zinc-400">{t(locale, (m) => m.labels.filmstrip)}</p>
                  <div className="flex gap-2">
                    {photos.map((photo) => (
                      <button
                        key={photo.id}
                        className={`w-24 shrink-0 rounded border p-1 text-xs ${
                          photo.id === selectedPhotoId ? "border-sky-500" : "border-zinc-700"
                        }`}
                        onClick={() => actions.openInEditor(photo.id)}
                      >
                        <div className="mb-1 h-10 rounded bg-zinc-800" />
                        <span className="block truncate">{photo.fileName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <aside className="w-80 border-l border-zinc-800 bg-zinc-900 p-3">
                <h3 className="mb-2 text-sm font-semibold">{t(locale, (m) => m.labels.histogram)}</h3>
                <HistogramCanvas />
                <h3 className="mb-2 mt-4 text-sm font-semibold">{t(locale, (m) => m.labels.effects)}</h3>
                <div className="space-y-2 text-sm">
                  <button
                    className="w-full rounded bg-zinc-700 px-2 py-1 text-left"
                    onClick={() => selectedPhotoId && actions.addAdjustment(selectedPhotoId, "exposure")}
                  >
                    + Exposure
                  </button>
                  {selectedPhoto?.adjustments.map((adj) => (
                    <label key={adj.id} className="flex items-center gap-2 rounded bg-zinc-800 px-2 py-1">
                      <input
                        type="checkbox"
                        checked={adj.enabled}
                        onChange={() => selectedPhotoId && actions.toggleAdjustment(selectedPhotoId, adj.id)}
                      />
                      {adj.name}
                    </label>
                  ))}
                </div>
              </aside>
            </section>
          )}
        </main>
        <HistoryPanel />
      </div>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
