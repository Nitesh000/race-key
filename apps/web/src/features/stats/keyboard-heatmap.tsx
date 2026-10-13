"use client";

import { useState } from "react";
import { Segmented } from "@/components/ui/segmented";

const rows = ["`1234567890-=", "qwertyuiop[]\\", "asdfghjkl;'", "zxcvbnm,./"];

type KeyStat = { key: string; hits: number; misses: number; avgMs: number };

export function KeyboardHeatmap({ keys }: { keys: KeyStat[] }) {
  const [mode, setMode] = useState<"accuracy" | "speed">("accuracy");
  const merged = new Map<string, { hits: number; misses: number; totalMs: number }>();
  for (const k of keys) {
    const id = k.key.toLowerCase();
    const m = merged.get(id) ?? { hits: 0, misses: 0, totalMs: 0 };
    m.hits += k.hits;
    m.misses += k.misses;
    m.totalMs += k.avgMs * k.hits;
    merged.set(id, m);
  }
  const speeds = [...merged.values()].filter((m) => m.hits >= 3).map((m) => m.totalMs / m.hits);
  const fastest = Math.min(...speeds);
  const slowest = Math.max(...speeds);

  const score = (id: string) => {
    const m = merged.get(id);
    if (!m || m.hits + m.misses < 3) return null;
    if (mode === "accuracy") {
      const acc = m.hits / (m.hits + m.misses);
      return { bad: Math.min(1, (1 - acc) * 5), label: `${(acc * 100).toFixed(1)}% accurate` };
    }
    const ms = m.totalMs / Math.max(1, m.hits);
    return {
      bad: slowest > fastest ? (ms - fastest) / (slowest - fastest) : 0,
      label: `${Math.round(ms)} ms average`,
    };
  };

  const cell = (id: string, label: string, width = "2.5rem") => {
    const s = score(id);
    return (
      <div
        key={id}
        title={s ? `${label}: ${s.label}` : `${label}: not enough data`}
        className="grid h-10 place-items-center rounded-md border border-border font-mono text-sm"
        style={{
          width,
          background: s
            ? `color-mix(in srgb, var(--danger) ${Math.round(s.bad * 100)}%, color-mix(in srgb, var(--success) 35%, var(--surface)))`
            : "var(--surface-2)",
          color: s && s.bad > 0.5 ? "var(--bg)" : "var(--text)",
        }}
      >
        {label}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <Segmented
        label="Heatmap shows"
        value={mode}
        onChange={setMode}
        options={[
          { value: "accuracy", label: "Accuracy" },
          { value: "speed", label: "Speed" },
        ]}
      />
      <div className="space-y-1 overflow-x-auto pb-1">
        {rows.map((row, i) => (
          <div key={row} className="flex gap-1" style={{ paddingLeft: `${i * 1.1}rem` }}>
            {Array.from(row).map((c) => cell(c, c))}
          </div>
        ))}
        <div className="flex gap-1" style={{ paddingLeft: "6rem" }}>
          {cell(" ", "space", "16rem")}
        </div>
      </div>
      <p className="text-xs text-muted">
        Greener is better, redder needs work. Hover a key for numbers. Counts every race, all time.
      </p>
    </div>
  );
}
