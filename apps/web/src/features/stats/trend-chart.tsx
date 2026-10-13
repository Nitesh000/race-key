"use client";

import { useEffect, useRef } from "react";
import uPlot from "uplot";
import "uplot/dist/uPlot.min.css";

function cssVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function TrendChart({ points }: { points: { day: string; wpm: number }[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || points.length < 2) return;
    const xs = points.map((p) => Date.parse(`${p.day}T12:00:00Z`) / 1000);
    const ys = points.map((p) => Math.round(p.wpm));
    const accent = cssVar("--accent");
    const muted = cssVar("--text-muted");
    const grid = cssVar("--border");
    const make = () =>
      new uPlot(
        {
          width: el.clientWidth,
          height: 200,
          legend: { show: false },
          cursor: { y: false },
          scales: { x: { time: true } },
          axes: [
            { stroke: muted, grid: { stroke: grid, width: 1 }, ticks: { stroke: grid } },
            { stroke: muted, grid: { stroke: grid, width: 1 }, ticks: { stroke: grid }, size: 40 },
          ],
          series: [
            {},
            {
              label: "wpm",
              stroke: accent,
              width: 2,
              fill: `color-mix(in srgb, ${accent} 12%, transparent)`,
              points: { show: points.length < 40, size: 5, fill: accent },
            },
          ],
        },
        [xs, ys],
        el,
      );
    let plot = make();
    const observer = new ResizeObserver(() => plot.setSize({ width: el.clientWidth, height: 200 }));
    observer.observe(el);
    const themeObserver = new MutationObserver(() => {
      plot.destroy();
      plot = make();
    });
    themeObserver.observe(document.documentElement, { attributes: true });
    return () => {
      observer.disconnect();
      themeObserver.disconnect();
      plot.destroy();
    };
  }, [points]);

  if (points.length < 2) {
    return <p className="text-sm text-muted">Race on two different days to see a trend.</p>;
  }
  return (
    <div
      ref={ref}
      role="img"
      aria-label={`Average speed per day, from ${Math.round(points[0]!.wpm)} to ${Math.round(points.at(-1)!.wpm)} wpm`}
    />
  );
}
