import type { ReactElement } from "react"
import { t } from "@/lib/i18n"
import { useAppStore } from "@/store/appStore"
import { Spinner } from "@/components/generic/Spinner"
import { chrome } from "@/components/layout/chromeTheme"
import type { EditModeModel } from "./hooks/useEditMode"
import { GpuPreviewCanvas } from "./components/GpuPreviewCanvas"
import { defaultBasicEffects, defaultShadowsHighlights } from "@/types/domain"

export const EditModeArea = (props: EditModeModel): ReactElement => {
  const { locale } = useAppStore((s) => s.present)
  const editPreviewPending = useAppStore((s) => s.editPreviewPending)
  const {
    selectedPhoto,
    editImageSrc,
    diskSourcePath,
    previewEpoch,
    imageFailed,
    setImageNatural,
    setImageFailed,
    viewportRef,
    isDragging,
    rendered,
    pan,
    onEditWheel,
    onEditPointerDown,
    onEditPointerMove,
    endDrag,
  } = props

  return (
    <section className="flex min-h-0 flex-1 flex-col">
      <div
        ref={viewportRef}
        className={`relative min-h-0 flex-1 overflow-hidden ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onWheel={onEditWheel}
        onPointerDown={onEditPointerDown}
        onPointerMove={onEditPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {!selectedPhoto && (
          <div className={`grid h-full w-full place-items-center text-sm ${chrome.mutedText}`}>
            {t(locale, (m) => m.labels.noPhotos)}
          </div>
        )}
        {selectedPhoto && (!editImageSrc || imageFailed) && (
          <div className={`grid h-full w-full place-items-center text-sm ${chrome.mutedText}`}>
            {selectedPhoto.fileName}
          </div>
        )}
        {selectedPhoto && editImageSrc && !imageFailed && (
          <GpuPreviewCanvas
            key={`${editImageSrc}-${previewEpoch}`}
            photoId={selectedPhoto.id}
            src={editImageSrc}
            diskSourcePath={diskSourcePath}
            alt={selectedPhoto.fileName}
            rendered={rendered}
            pan={pan}
            effects={{ ...defaultBasicEffects(), ...selectedPhoto.basicEffects }}
            sh={{ ...defaultShadowsHighlights(), ...selectedPhoto.shadowsHighlights }}
            onImageNatural={setImageNatural}
            onImageError={() => setImageFailed(true)}
          />
        )}
        {editPreviewPending > 0 && <Spinner />}
      </div>
    </section>
  )
}
