import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactElement,
} from "react"
import { localImageSrc } from "@/lib/localImageSrc"
import { chrome } from "./layout/chromeTheme"

export const PhotoThumbnail = ({
  sourcePath,
  className,
  style,
  alt,
  fit = "cover",
  heightDriven = false,
  onClick,
}: {
  sourcePath: string
  className?: string
  style?: CSSProperties
  alt: string
  /** `contain` preserves aspect ratio inside the box; `cover` fills it (default). */
  fit?: "cover" | "contain"
  /** When true, image height fills container and width follows aspect ratio. */
  heightDriven?: boolean
  onClick?: (event: MouseEvent<HTMLImageElement>) => void
}): ReactElement => {
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  const src = useMemo(() => {
    const base = localImageSrc(sourcePath)
    if (!base) return ""
    const isThumbPath = sourcePath.includes("/thumbs/") || sourcePath.includes("\\thumbs\\")
    if (!isThumbPath) return base
    const join = base.includes("?") ? "&" : "?"
    return `${base}${join}v=${retry}`
  }, [sourcePath, retry])
  const isThumb = sourcePath.includes("/thumbs/") || sourcePath.includes("\\thumbs\\")

  useEffect(() => {
    setFailed(false)
    setRetry(0)
  }, [sourcePath])

  useEffect(() => {
    if (!failed || !isThumb || retry >= 20) return
    const id = window.setTimeout(() => {
      setFailed(false)
      setRetry((n) => n + 1)
    }, 300)
    return () => window.clearTimeout(id)
  }, [failed, isThumb, retry])

  if (!src || failed) {
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
      className={`h-full shrink-0 min-h-0 min-w-28 overflow-hidden rounded shrink-0 ${className}`}
      style={style}
    >
      <img
        src={src}
        alt={alt}
        className={`${fitClass} h-full w-full`}
        draggable={false}
        onClick={onClick}
        onError={() => {
          setFailed(true)
        }}
        onLoad={() => {
          setFailed(false)
        }}
      />
    </div>
  )
}
