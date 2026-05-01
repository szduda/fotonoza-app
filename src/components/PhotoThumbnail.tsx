import { useState, type CSSProperties, type ReactElement } from "react";
import { localImageSrc } from "../lib/localImageSrc";
import { chrome } from "./layout/chromeTheme";

export function PhotoThumbnail({
  sourcePath,
  className,
  style,
  alt,
  fit = "cover"
}: {
  sourcePath: string;
  className?: string;
  style?: CSSProperties;
  alt: string;
  /** `contain` preserves aspect ratio inside the box; `cover` fills it (default). */
  fit?: "cover" | "contain";
}): ReactElement {
  const [failed, setFailed] = useState(false);
  const src = localImageSrc(sourcePath);

  if (!src || failed) {
    return (
      <div
        className={`flex h-full min-h-0 w-full min-w-0 items-center justify-center rounded bg-neutral-950/80 text-[10px] leading-tight ${chrome.mutedText} ${className ?? ""}`}
        style={style}
      >
        —
      </div>
    );
  }

  const fitClass =
    fit === "contain" ? "max-h-full max-w-full object-contain" : "h-full w-full object-cover";

  return (
    <img
      src={src}
      alt={alt}
      className={`rounded ${fitClass} ${className ?? ""}`}
      style={style}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
