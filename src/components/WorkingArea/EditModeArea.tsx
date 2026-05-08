import type { ReactElement } from "react"
import { t } from "@/lib/i18n"
import { useAppStore } from "@/store/appStore"
import { Spinner } from "@/components/generic/Spinner"
import { chrome } from "@/components/layout/chromeTheme"
import { useEditMode } from "./hooks/useEditMode"
import { EditModePreviewLayers } from "./EditModePreviewLayers"

export const EditModeArea = (): ReactElement => {
  const { locale } = useAppStore((s) => s.present)
  const editPreviewPending = useAppStore((s) => s.editPreviewPending)
  const edit = useEditMode()

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div
        ref={edit.viewportRef}
        className={`relative min-h-0 flex-1 overflow-hidden ${
          edit.isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onWheel={edit.onEditWheel}
        onPointerDown={edit.onEditPointerDown}
        onPointerMove={edit.onEditPointerMove}
        onPointerUp={edit.endDrag}
        onPointerCancel={edit.endDrag}
      >
        {!edit.selectedPhoto && (
          <div className={`grid h-full w-full place-items-center text-sm ${chrome.mutedText}`}>
            {t(locale, (m) => m.labels.noPhotos)}
          </div>
        )}

        {edit.selectedPhoto && edit.editImageSrc && !edit.imageFailed ? (
          <EditModePreviewLayers edit={edit} selectedPhoto={edit.selectedPhoto} />
        ) : (
          <div className={`grid h-full w-full place-items-center text-sm ${chrome.mutedText}`}>
            {edit.selectedPhoto?.fileName || <p>"Select photo to edit."</p>}
            {edit.editImageSrc || <p>"Photo not found."</p>}
            {edit.imageFailed && <p>"Photo failed to load."</p>}
          </div>
        )}
        {editPreviewPending > 0 && <Spinner />}
      </div>
    </section>
  )
}
