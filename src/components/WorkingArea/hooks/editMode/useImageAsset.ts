import { useEffect, useRef, useState } from "react"
import type { Dispatch, RefObject, SetStateAction } from "react"
import type { Size } from "@/components/WorkingArea/geometry"
import { useAppStore } from "@/store/appStore"

export type ImageAssetModel = {
  viewportRef: RefObject<HTMLDivElement | null>
  viewport: Size
  imageNatural: Size
  setImageNatural: Dispatch<SetStateAction<Size>>
  imageFailed: boolean
  setImageFailed: Dispatch<SetStateAction<boolean>>
}

export const useImageAsset = (
  editImageSrc: string,
): ImageAssetModel => {
  const mode = useAppStore((s) => s.present.mode)
  const previewEpoch = useAppStore((s) => s.editPreviewEpoch)
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 })
  const [imageNatural, setImageNatural] = useState<Size>({ width: 0, height: 0 })
  const [imageFailed, setImageFailed] = useState(false)
  const viewportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = viewportRef.current
    if (!node || mode !== "edit") return
    const measure = () => {
      const rect = node.getBoundingClientRect()
      const w = Math.round(rect.width)
      const h = Math.round(rect.height)
      setViewport((prev) => (prev.width === w && prev.height === h ? prev : { width: w, height: h }))
    }
    measure()
    const obs = new ResizeObserver(measure)
    obs.observe(node)
    return () => obs.disconnect()
  }, [mode])

  useEffect(() => {
    setImageFailed(false)
  }, [editImageSrc, previewEpoch])

  return {
    viewportRef,
    viewport,
    imageNatural,
    setImageNatural,
    imageFailed,
    setImageFailed,
  }
}
