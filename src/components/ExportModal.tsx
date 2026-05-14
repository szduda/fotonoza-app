import clsx from "clsx"
import { open as openDialog } from "@tauri-apps/plugin-dialog"
import { useEffect, useState, type ReactElement } from "react"
import { useAppStore } from "@/store/appStore"
import { t } from "@/lib/i18n"
import { Button } from "./generic/Button"
import { SelectMenu } from "./generic/SelectMenu"
import { SwitchToggle } from "./generic/SwitchToggle"
import { chrome, chromeFieldBase } from "./layout/chromeTheme"
import { presetExportCollectionName } from "@/lib/dirNameSanitize"
import { getDefaultExportDirectory } from "@/lib/persistence"
import { useExportMonitor } from "@/hooks/useExportMonitor"

interface ExportModalProps {
  open: boolean
  onClose: () => void
}

const field = `mt-1 ${chromeFieldBase}`

export const ExportModal = ({ open, onClose }: ExportModalProps): ReactElement | null => {
  const { exportSettings, locale, photos } = useAppStore((state) => state.present)
  const setExportField = useAppStore((state) => state.actions.setExportField)
  const { start } = useExportMonitor()
  const selectedPhotos = photos.filter((photo) => photo.selected)
  const [collectionName, setCollectionName] = useState("")
  const [directoryAuto, setDirectoryAuto] = useState(true)

  useEffect(() => {
    if (!open) return
    const { collectionFilter, collectionFolders } = useAppStore.getState().present
    setCollectionName(presetExportCollectionName(collectionFilter, collectionFolders ?? []))
  }, [open])

  useEffect(() => {
    if (!open) return
    document.body.dataset.exportModalOpen = "1"
    return () => {
      delete document.body.dataset.exportModalOpen
    }
  }, [open])

  useEffect(() => {
    if (!open || !directoryAuto) return
    void getDefaultExportDirectory(collectionName).then((defaultDir) => {
      setExportField("directory", defaultDir)
    })
  }, [open, setExportField, collectionName, directoryAuto])

  const onPickDirectory = async () => {
    const picked = await openDialog({
      directory: true,
      multiple: false,
      defaultPath: exportSettings.directory || undefined,
    })
    if (typeof picked === "string" && picked.length > 0) {
      setDirectoryAuto(false)
      setExportField("directory", picked)
    }
  }

  const onStartExport = async () => {
    if (selectedPhotos.length === 0) return
    await start(
      selectedPhotos.map((photo) => ({
        sourcePath: photo.sourcePath,
        fileName: photo.fileName,
        basicEffects: photo.basicEffects,
        colorEffects: photo.colorEffects,
        shadowsHighlights: photo.shadowsHighlights,
      })),
      exportSettings,
    )
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35">
      <div
        className={`export-modal-panel w-[560px] rounded-lg border border-neutral-600/50 p-5 shadow-xl ${chrome.panelBg} ${chrome.panelText}`}
      >
        <h2 className={`mb-4 text-lg font-medium ${chrome.panelText}`}>
          {t(locale, (m) => m.exportModal.title)}
        </h2>
        <div className={`grid grid-cols-2 gap-3 text-sm ${chrome.mutedText}`}>
          <label className="col-span-2">
            Collection
            <input
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className={field}
            />
          </label>
          <label className="col-span-2">
            {t(locale, (m) => m.exportModal.directory)}
            <div className="mt-1 flex items-center gap-2">
              <input
                value={exportSettings.directory}
                onChange={(e) => {
                  setDirectoryAuto(false)
                  setExportField("directory", e.target.value)
                }}
                className={clsx(field, "min-h-9 min-w-0 flex-1")}
              />
              <Button
                variant="outlined"
                iconOnly
                size="md"
                className={clsx(
                  chrome.mutedText,
                  "!size-9 shrink-0 font-normal enabled:hover:bg-neutral-400/40 enabled:hover:text-neutral-800",
                )}
                onClick={() => void onPickDirectory()}
              >
                ...
              </Button>
            </div>
          </label>
          <label>
            {t(locale, (m) => m.exportModal.format)}
            <SelectMenu
              value={exportSettings.format}
              options={[
                { value: "jpg", label: "jpg" },
                { value: "png", label: "png" },
              ]}
              onChange={(format) => setExportField("format", format as "jpg" | "png")}
            />
          </label>
          <label>
            {t(locale, (m) => m.exportModal.quality)} {exportSettings.quality}%
            <div className="mt-1 flex min-h-9 w-full items-center">
              <input
                type="range"
                min={30}
                max={100}
                value={exportSettings.quality}
                onChange={(e) => setExportField("quality", Number(e.currentTarget.value))}
                className="slider-export-quality"
              />
            </div>
          </label>
          <div className="col-span-2 grid grid-cols-3 gap-3">
            <label className="min-w-0">
              {t(locale, (m) => m.exportModal.maxWidth)}
              <input
                type="number"
                value={exportSettings.maxWidth}
                onChange={(e) => setExportField("maxWidth", Number(e.target.value))}
                className={field}
              />
            </label>
            <label className="min-w-0">
              {t(locale, (m) => m.exportModal.maxHeight)}
              <input
                type="number"
                value={exportSettings.maxHeight}
                onChange={(e) => setExportField("maxHeight", Number(e.target.value))}
                className={field}
              />
            </label>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="block" id="export-dont-enlarge-label">
                {t(locale, (m) => m.exportModal.dontEnlarge)}
              </span>
              <div className="mt-1 flex items-center">
                <SwitchToggle
                  enabled={exportSettings.dontEnlarge}
                  onChange={(v) => setExportField("dontEnlarge", v)}
                  aria-labelledby="export-dont-enlarge-label"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outlined"
            size="md"
            className="px-3 py-1.5 font-normal enabled:hover:bg-neutral-400/40"
            onClick={() => void onStartExport()}
            disabled={selectedPhotos.length === 0}
          >
            Export {selectedPhotos.length} photos
          </Button>
          <Button
            variant="outlined"
            size="md"
            className={clsx(
              chrome.mutedText,
              "px-3 py-1.5 font-normal enabled:hover:bg-neutral-400/40 enabled:hover:text-neutral-800",
            )}
            onClick={onClose}
          >
            {t(locale, (m) => m.actions.close)}
          </Button>
        </div>
      </div>
    </div>
  )
}
