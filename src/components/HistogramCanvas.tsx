import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Stage, Layer, Line } from "react-konva";
import { useHistogramForEdit } from "../hooks/useHistogramForEdit";

interface HistogramCanvasProps {
  width?: number;
  height?: number;
}

function seriesToPolyline(
  series: number[],
  width: number,
  height: number,
  maxValue: number,
): number[] {
  if (series.length === 0) return [];
  return series.flatMap((value, i) => {
    const x = (i / (series.length - 1)) * width;
    const y = height - (value / Math.max(1, maxValue)) * (height - 8);
    return [x, y];
  });
}

function seriesToArea(
  series: number[],
  width: number,
  height: number,
  maxValue: number,
): number[] {
  const line = seriesToPolyline(series, width, height, maxValue);
  if (line.length === 0) return [];
  return [0, height, ...line, width, height];
}

export function HistogramCanvas({
  width = 280,
  height = 160,
}: HistogramCanvasProps): ReactElement {
  const { data, loading } = useHistogramForEdit();

  const hostRef = useRef<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = useState(width);
  const stageHeight = height;

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;
    const measure = () => {
      const next = Math.floor(node.getBoundingClientRect().width);
      setStageWidth((prev) => {
        if (next > 1) return next;
        return prev > 1 ? prev : width;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [width]);

  const rgbMax = useMemo(
    () =>
      Math.max(
        ...(data?.red ?? []),
        ...(data?.green ?? []),
        ...(data?.blue ?? []),
        1,
      ),
    [data],
  );
  const lumaMax = useMemo(() => Math.max(...(data?.luma ?? []), 1), [data]);
  const overlapSeries = useMemo(() => {
    const r = data?.red ?? [];
    const g = data?.green ?? [];
    const b = data?.blue ?? [];
    const n = Math.min(r.length, g.length, b.length);
    if (n === 0) return [];
    return Array.from({ length: n }, (_, i) => Math.min(r[i], g[i], b[i]));
  }, [data]);

  const redPoints = useMemo(
    () => seriesToPolyline(data?.red ?? [], stageWidth, stageHeight, rgbMax),
    [data, stageWidth, stageHeight, rgbMax],
  );
  const greenPoints = useMemo(
    () => seriesToPolyline(data?.green ?? [], stageWidth, stageHeight, rgbMax),
    [data, stageWidth, stageHeight, rgbMax],
  );
  const bluePoints = useMemo(
    () => seriesToPolyline(data?.blue ?? [], stageWidth, stageHeight, rgbMax),
    [data, stageWidth, stageHeight, rgbMax],
  );

  const lumaArea = useMemo(
    () => seriesToArea(data?.luma ?? [], stageWidth, stageHeight, lumaMax),
    [data, stageWidth, stageHeight, lumaMax],
  );
  const redArea = useMemo(
    () => seriesToArea(data?.red ?? [], stageWidth, stageHeight, rgbMax),
    [data, stageWidth, stageHeight, rgbMax],
  );
  const greenArea = useMemo(
    () => seriesToArea(data?.green ?? [], stageWidth, stageHeight, rgbMax),
    [data, stageWidth, stageHeight, rgbMax],
  );
  const blueArea = useMemo(
    () => seriesToArea(data?.blue ?? [], stageWidth, stageHeight, rgbMax),
    [data, stageWidth, stageHeight, rgbMax],
  );
  const overlapArea = useMemo(
    () => seriesToArea(overlapSeries, stageWidth, stageHeight, rgbMax),
    [overlapSeries, stageWidth, stageHeight, rgbMax],
  );

  const showSkeleton = loading && !data;

  return (
    <div
      className="rounded-md border border-neutral-600/50 bg-neutral-500/20 overflow-hidden"
      style={{ height: `${stageHeight}px` }}>
      <div ref={hostRef} className="w-full overflow-hidden" style={{ height: `${stageHeight}px` }}>
        {showSkeleton ? (
          <div className="h-full w-full animate-pulse rounded bg-neutral-700/30">
            <div className="h-full w-full bg-[linear-gradient(120deg,transparent_25%,rgba(255,255,255,0.08)_50%,transparent_75%)] bg-[length:200%_100%] animate-[pulse_1.3s_ease-in-out_infinite]" />
          </div>
        ) : (
          <Stage width={stageWidth} height={stageHeight}>
            <Layer>
              <Line points={redArea} closed fill="#ef4444" opacity={0.6} />
              <Line points={greenArea} closed fill="#22c55e" opacity={0.75} />
              <Line points={blueArea} closed fill="#3b82f6" opacity={0.7} />
              <Line points={overlapArea} closed fill="#afafaf" opacity={0.9} />
              <Line points={lumaArea} closed fill="#ccc" opacity={0.4} />
              <Line
                points={redPoints}
                stroke="#ef4444"
                strokeWidth={1}
                tension={0.2}
              />
              <Line
                points={greenPoints}
                stroke="#22c55e"
                strokeWidth={1}
                tension={0.2}
              />
              <Line
                points={bluePoints}
                stroke="#3b82f6"
                strokeWidth={1}
                tension={0.2}
              />
            </Layer>
          </Stage>
        )}
      </div>
    </div>
  );
}
