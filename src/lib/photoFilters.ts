import type { Photo, PhotoExifSummary, PhotoFiltersState } from "@/types/domain"
import { defaultPhotoFilters } from "@/types/domain"

const joinClean = (a?: string, b?: string): string => {
  const out = [a?.trim(), b?.trim()].filter((x) => x && x.length > 0).join(" ")
  return out.length > 0 ? out : ""
}

const fieldContains = (haystack: string | undefined, needle: string): boolean => {
  const n = needle.trim().toLowerCase()
  if (!n) return true
  return (haystack ?? "").toLowerCase().includes(n)
}

/** Substring match on each non-empty filter; EXIF filters require cached summary when active. */
export const photoMatchesFilters = (
  photo: Photo,
  filters: PhotoFiltersState | undefined,
  exif?: PhotoExifSummary,
): boolean => {
  const f = filters ?? defaultPhotoFilters()

  if (!fieldContains(photo.fileName, f.fileName)) return false

  if (f.ratingAtLeast > 0 && (photo.rating ?? 0) < f.ratingAtLeast) return false

  const exifActive =
    f.dateTaken.trim() !== "" ||
    f.exposure.trim() !== "" ||
    f.camera.trim() !== "" ||
    f.lens.trim() !== ""

  if (!exifActive) return true

  if (!exif) return false

  if (!fieldContains(exif.dateTimeOriginal, f.dateTaken)) return false
  if (!fieldContains(exif.exposureSummary, f.exposure)) return false

  const cam = joinClean(exif.cameraMake, exif.cameraModel)
  if (!fieldContains(cam || undefined, f.camera)) return false

  const lens = joinClean(exif.lensMake, exif.lensModel)
  if (!fieldContains(lens || undefined, f.lens)) return false

  return true
}
