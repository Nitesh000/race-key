import type { TypingStats } from "./engine";

export function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function LiveStats({ stats }: { stats: TypingStats }) {
  return (
    <dl className="flex gap-6 font-mono text-sm tabular-nums text-muted">
      <div>
        <dt className="sr-only">Speed</dt>
        <dd>
          <span className="text-2xl font-semibold text-text">{Math.round(stats.wpm)}</span> wpm
        </dd>
      </div>
      <div>
        <dt className="sr-only">Accuracy</dt>
        <dd>
          <span className="text-2xl font-semibold text-text">
            {Math.round(stats.accuracy * 100)}
          </span>
          %
        </dd>
      </div>
      <div>
        <dt className="sr-only">Time</dt>
        <dd>
          <span className="text-2xl font-semibold text-text">{formatTime(stats.elapsed)}</span>
        </dd>
      </div>
    </dl>
  );
}
