import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { Stage, Layer, Line } from "react-konva";
import type { HistogramData } from "../types/domain";

interface HistogramCanvasProps {
  width?: number;
  height?: number;
  data?: HistogramData;
  loading?: boolean;
  error?: string | null;
}

function seriesToPolyline(
  series: number[],
  width: number,
  height: number,
  maxValue: number
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
  maxValue: number
): number[] {
  const line = seriesToPolyline(series, width, height, maxValue);
  if (line.length === 0) return [];
  return [0, height, ...line, width, height];
}

export function HistogramCanvas({
  width = 280,
  height = 120,
  data,
  loading = false,
  error = null
}: HistogramCanvasProps): ReactElement {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = useState(width);
  const stageHeight = height;
  const cardHeight = stageHeight + 28;

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;
    const measure = () => setStageWidth(Math.max(1, Math.floor(node.getBoundingClientRect().width)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const rgbMax = useMemo(
    () => Math.max(...(data?.red ?? []), ...(data?.green ?? []), ...(data?.blue ?? []), 1),
    [data]
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

  const lumaPoints = useMemo(
    () => seriesToPolyline(data?.luma ?? [], stageWidth, stageHeight, lumaMax),
    [data, stageWidth, stageHeight, lumaMax]
  );
  const redPoints = useMemo(
    () => seriesToPolyline(data?.red ?? [], stageWidth, stageHeight, rgbMax),
    [data, stageWidth, stageHeight, rgbMax]
  );
  const greenPoints = useMemo(
    () => seriesToPolyline(data?.green ?? [], stageWidth, stageHeight, rgbMax),
    [data, stageWidth, stageHeight, rgbMax]
  );
  const bluePoints = useMemo(
    () => seriesToPolyline(data?.blue ?? [], stageWidth, stageHeight, rgbMax),
    [data, stageWidth, stageHeight, rgbMax]
  );

  const lumaArea = useMemo(
    () => seriesToArea(data?.luma ?? [], stageWidth, stageHeight, lumaMax),
    [data, stageWidth, stageHeight, lumaMax]
  );
  const redArea = useMemo(
    () => seriesToArea(data?.red ?? [], stageWidth, stageHeight, rgbMax),
    [data, stageWidth, stageHeight, rgbMax]
  );
  const greenArea = useMemo(
    () => seriesToArea(data?.green ?? [], stageWidth, stageHeight, rgbMax),
    [data, stageWidth, stageHeight, rgbMax]
  );
  const blueArea = useMemo(
    () => seriesToArea(data?.blue ?? [], stageWidth, stageHeight, rgbMax),
    [data, stageWidth, stageHeight, rgbMax]
  );
  const overlapArea = useMemo(
    () => seriesToArea(overlapSeries, stageWidth, stageHeight, rgbMax),
    [overlapSeries, stageWidth, stageHeight, rgbMax]
  );

  const status = error ? error : loading ? "Loading histogram..." : "";
  const statusClass = error ? "text-red-400" : "text-neutral-500";

  return (
    <div
      className="rounded-md border border-neutral-600/45 bg-neutral-500/20 p-2"
      style={{ height: `${cardHeight}px` }}
    >
      <div className={`mb-1 h-4 truncate text-[10px] ${statusClass}`}>{status}</div>
      <div ref={hostRef} className="h-[120px] w-full overflow-hidden">
        <Stage width={stageWidth} height={stageHeight}>
          <Layer>
            <Line points={redArea} closed fill="#ef4444" opacity={0.6} />
            <Line points={greenArea} closed fill="#22c55e" opacity={0.75} />
            <Line points={blueArea} closed fill="#3b82f6" opacity={0.7} />
            <Line points={overlapArea} closed fill="#afafaf" opacity={0.9} />
            <Line points={lumaArea} closed fill="#ccc" opacity={0.4} />
            {/* <Line points={lumaPoints} stroke="#a3a3a3" strokeWidth={1.5} tension={0.2} /> */}
            <Line points={redPoints} stroke="#ef4444" strokeWidth={1} tension={0.2} />
            <Line points={greenPoints} stroke="#22c55e" strokeWidth={1} tension={0.2} />
            <Line points={bluePoints} stroke="#3b82f6" strokeWidth={1} tension={0.2} />
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
