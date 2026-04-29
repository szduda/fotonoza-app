import { Stage, Layer, Line } from "react-konva";

interface HistogramCanvasProps {
  width?: number;
  height?: number;
}

export function HistogramCanvas({ width = 280, height = 120 }: HistogramCanvasProps): JSX.Element {
  const points = new Array(36).fill(0).flatMap((_, i) => {
    const x = (i / 35) * width;
    const y = height - Math.round((Math.sin(i / 3) * 0.35 + 0.5) * (height - 16));
    return [x, y];
  });

  return (
    <div className="rounded-md border border-zinc-700 bg-zinc-950 p-2">
      <Stage width={width} height={height}>
        <Layer>
          <Line points={points} stroke="#f59e0b" strokeWidth={2} tension={0.2} />
        </Layer>
      </Stage>
    </div>
  );
}
