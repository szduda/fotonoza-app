import { type CSSProperties, type MouseEvent, type ReactElement } from "react"
import { localImageSrc } from "@/lib/localImageSrc"
import { useAppStore } from "@/store/appStore"
import { chrome } from "./layout/chromeTheme"

export const PhotoThumbnail = ({
  photoId,
  thumbnailPath,
  thumbnailNonce,
  className,
  style,
  alt,
  fit = "cover",
  heightDriven = false,
  onClick,
}: {
  photoId: string
  thumbnailPath?: string | null
  thumbnailNonce?: number
  className?: string
  style?: CSSProperties
  alt: string
  /** `contain` preserves aspect ratio inside the box; `cover` fills it (default). */
  fit?: "cover" | "contain"
  /** When true, image height fills container and width follows aspect ratio. */
  heightDriven?: boolean
  onClick?: (event: MouseEvent<HTMLImageElement>) => void
}): ReactElement => {
  const enqueueRepair = useAppStore((s) => s.actions.ensurePhotoThumbnail)
  const hasThumb = !!(thumbnailPath && thumbnailPath.length > 0)
  const src = hasThumb ? localImageSrc(thumbnailPath, thumbnailNonce) : ""

  if (!hasThumb) {
    return (
      <div
        className={`flex h-full min-h-0 w-full min-w-0 items-center justify-center overflow-hidden rounded bg-neutral-950/80 text-[10px] leading-tight ${chrome.mutedText} ${className ?? ""}`}
        style={style}
      >
        —
      </div>
    )
  }

  const fitClass = heightDriven
    ? "block h-full w-auto max-w-none object-contain object-center"
    : fit === "contain"
      ? "block h-full w-full min-h-0 min-w-0 object-contain object-center"
      : "block h-full w-full object-cover"

  return (
    <div
      className={`h-full shrink-0 min-h-0 aspect-3/2 overflow-hidden rounded ${className ?? ""}`}
      style={style}
    >
      <img
        src={src}
        alt={alt}
        className={`${fitClass} h-full w-full`}
        draggable={false}
        onClick={onClick}
        onError={() => {
          enqueueRepair(photoId)
        }}
      />
    </div>
  )
}
