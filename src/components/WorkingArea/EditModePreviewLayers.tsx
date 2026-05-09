import { useCallback, useLayoutEffect, useState, type ReactElement } from "react"
import { localImageSrc } from "@/lib/localImageSrc"
import type { Photo } from "@/types/domain"
import {
  defaultBasicEffects,
  defaultColorEffects,
  defaultShadowsHighlights,
} from "@/types/domain"
import { GpuPreviewCanvas } from "@/components/WorkingArea/components/GpuPreviewCanvas"
import { useAppStore } from "@/store/appStore"
import type { EditModeModel } from "@/components/WorkingArea/hooks/useEditMode"
import type { Size } from "@/components/WorkingArea/geometry"

type Props = {
  edit: EditModeModel
  selectedPhoto: Photo
}

const canvasFrame =
  "pointer-events-none absolute left-1/2 top-1/2 max-h-none max-w-none select-none"

export const EditModePreviewLayers = ({ edit, selectedPhoto }: Props): ReactElement => {
  const gpuAssist = useAppStore((s) => s.gpuPreviewAssist)
  const previewKey = `${edit.editImageSrc}-${edit.previewEpoch}`
  const [mainDecoded, setMainDecoded] = useState(false)

  useLayoutEffect(() => {
    setMainDecoded(false)
  }, [previewKey])

  const thumbSrc =
    selectedPhoto.thumbnailPath && selectedPhoto.thumbnailPath.length > 0
      ? localImageSrc(selectedPhoto.thumbnailPath, selectedPhoto.thumbnailNonce)
      : ""

  const onImageNatural = useCallback(
    (size: Size) => {
      edit.setImageNatural(size)
      if (size.width > 0 && size.height > 0) setMainDecoded(true)
    },
    [edit],
  )

  const liveStyle = {
    width: edit.rendered.width,
    height: edit.rendered.height,
    transform: `translate(calc(-50% + ${edit.pan.x}px), calc(-50% + ${edit.pan.y}px))`,
  } as const

  const showThumb = thumbSrc?.length > 0 && !mainDecoded

  return (
    <>
      {showThumb && (
        <img
          key={`thumb:${previewKey}`}
          src={thumbSrc}
          alt=""
          aria-hidden
          className={`${canvasFrame} object-contain`}
          style={liveStyle}
          draggable={false}
          onLoad={(e) => {
            const el = e.currentTarget
            edit.setThumbNatural({ width: el.naturalWidth, height: el.naturalHeight })
          }}
        />
      )}

      <GpuPreviewCanvas
        key={`gpu:${previewKey}`}
        photoId={selectedPhoto.id}
        src={edit.editImageSrc}
        diskSourcePath={edit.diskSourcePath}
        alt={selectedPhoto.fileName}
        rendered={edit.rendered}
        pan={edit.pan}
        basicEffects={{ ...defaultBasicEffects(), ...selectedPhoto.basicEffects }}
        colorEffects={{ ...defaultColorEffects(), ...selectedPhoto.colorEffects }}
        sh={{ ...defaultShadowsHighlights(), ...selectedPhoto.shadowsHighlights }}
        focusPeaking={gpuAssist.focusPeaking}
        highlightClipping={gpuAssist.highlightClipping}
        onImageNatural={onImageNatural}
        onImageError={() => edit.setImageFailed(true)}
      />
    </>
  )
}
