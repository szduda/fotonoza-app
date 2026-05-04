import { useEffect, useRef, useState, type RefObject } from "react";
import { useAppStore } from "../../../store/appStore";

export type ViewGridMeasure = {
  viewGridHeight: number;
  viewGridRef: RefObject<HTMLDivElement | null>;
};

export function useViewGridLayout(): ViewGridMeasure {
  const mode = useAppStore((s) => s.present.mode);
  const [viewGridHeight, setViewGridHeight] = useState(0);
  const viewGridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = viewGridRef.current;
    if (!node || mode !== "view") return;
    const measure = () => {
      const rect = node.getBoundingClientRect();
      setViewGridHeight(rect.height);
    };
    measure();
    const obs = new ResizeObserver(measure);
    obs.observe(node);
    return () => obs.disconnect();
  }, [mode]);

  return { viewGridHeight, viewGridRef };
}
