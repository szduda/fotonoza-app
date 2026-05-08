import { useEffect, useState } from "react"
import { getPhotoExif } from "@/lib/persistence"
import type { PhotoExifSummary } from "@/types/domain"

export const usePhotoExif = (sourcePath: string | undefined): PhotoExifSummary | null => {
  const [data, setData] = useState<PhotoExifSummary | null>(null)

  useEffect(() => {
    if (!sourcePath) {
      setData(null)
      return
    }
    let cancelled = false
    void getPhotoExif(sourcePath).then((summary) => {
      if (!cancelled) setData(summary)
    })
    return () => {
      cancelled = true
    }
  }, [sourcePath])

  return data
}
