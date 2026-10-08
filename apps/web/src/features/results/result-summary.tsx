import { formatTime } from "@/features/typing/live-stats";

export type ResultNumbers = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  elapsed: number;
  errors: number;
  placement?: number;
  racers?: number;
};

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-4 py-3">
      <dt className="text-xs tracking-wide text-muted uppercase">{label}</dt>
      <dd className="font-mono text-2xl font-semibold tabular-nums">
        {value}
        {sub && <span className="ml-1 text-sm font-normal text-muted">{sub}</span>}
      </dd>
    </div>
  );
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!);
}

export function ResultSummary({ result }: { result: ResultNumbers }) {
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {result.placement !== undefined && (
        <Stat label="Place" value={ordinal(result.placement)} sub={`of ${result.racers}`} />
      )}
      <Stat label="Speed" value={String(Math.round(result.wpm))} sub="wpm" />
      <Stat label="Accuracy" value={(result.accuracy * 100).toFixed(1)} sub="%" />
      <Stat label="Raw" value={String(Math.round(result.rawWpm))} sub="wpm" />
      <Stat label="Time" value={formatTime(result.elapsed)} />
      {result.placement === undefined && <Stat label="Errors" value={String(result.errors)} />}
    </dl>
  );
}
