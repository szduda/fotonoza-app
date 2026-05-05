import { useCallback } from "react"
import { open } from "@tauri-apps/plugin-dialog"
import { useAppStore } from "@/store/appStore"

const isMacClient = (): boolean => {
  if (typeof navigator === "undefined") return false
  if (/mac os x/i.test(navigator.userAgent)) return true
  const p = navigator.platform
  return typeof p === "string" && p.toLowerCase().includes("mac")
}

const IMPORT_EXT_DEFAULT = ["jpg", "jpeg", "png", "raw"] as const

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
  "dcr",
] as const

export const useImport = (): { pickImportFiles: () => Promise<void> } => {
  const importPreviewPhotos = useAppStore((s) => s.actions.importPreviewPhotos)

  const pickImportFiles = useCallback(async () => {
    const exts = isMacClient() ? IMPORT_EXT_MAC : IMPORT_EXT_DEFAULT
    const picked = await open({
      multiple: true,
      filters: [{ name: "Images", extensions: [...exts] }],
    })
    if (Array.isArray(picked) && picked.length) {
      importPreviewPhotos(picked)
    }
  }, [importPreviewPhotos])

  return { pickImportFiles }
}
