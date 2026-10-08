export function SpeedChart({
  samples,
  average,
  height = 140,
}: {
  samples: number[];
  average?: number;
  height?: number;
}) {
  const width = 600;
  if (samples.length < 2) return null;
  const max = Math.max(...samples, average ?? 0, 20) * 1.1;
  const x = (i: number) => (i / (samples.length - 1)) * width;
  const y = (v: number) => height - (v / max) * height;
  const line = samples
    .map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join("");
  const area = `${line}L${width},${height}L0,${height}Z`;
  return (
    <figure>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-36 w-full overflow-visible"
        role="img"
        aria-label={`Speed over time, ending at ${Math.round(samples.at(-1)!)} wpm`}
      >
        <path d={area} fill="var(--accent)" opacity={0.12} />
        <path
          d={line}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
        {average !== undefined && (
          <line
            x1={0}
            x2={width}
            y1={y(average)}
            y2={y(average)}
            stroke="var(--text-muted)"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-muted">
        <span>0s</span>
        {average !== undefined && (
          <span>dashed line: your average ({Math.round(average)} wpm)</span>
        )}
        <span>{samples.length}s</span>
      </figcaption>
    </figure>
  );
}
