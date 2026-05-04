import { useEffect, useState } from "react";
import { loadCachedHistogram, peekHistogramCache } from "../lib/histogramCache";
import { useAppStore } from "../store/appStore";
import type { HistogramData } from "../types/domain";

export function useHistogramForEdit(): {
  data: HistogramData | undefined;
  loading: boolean;
} {
  const { mode, photos, currentPhotoId } = useAppStore((s) => s.present);
  const selectedPhoto = photos.find((p) => p.id === currentPhotoId);
  const [histogram, setHistogram] = useState<HistogramData | undefined>(undefined);
  const [histLoading, setHistLoading] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !selectedPhoto?.sourcePath) {
      setHistogram(undefined);
      setHistLoading(false);
      return;
    }
    const path = selectedPhoto.sourcePath;
    const cached = peekHistogramCache(path);
    if (cached) {
      setHistogram(cached);
      setHistLoading(false);
      return;
    }
    let active = true;
    setHistogram(undefined);
    setHistLoading(true);
    void loadCachedHistogram(path)
      .then((data) => {
        if (!active) return;
        setHistogram(data);
        setHistLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.warn("Histogram unavailable", err);
        setHistogram(undefined);
        setHistLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mode, selectedPhoto?.id, selectedPhoto?.sourcePath]);

  return { data: histogram, loading: histLoading };
}
