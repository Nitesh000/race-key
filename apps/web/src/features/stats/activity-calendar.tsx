const DAY = 86_400_000;

export function ActivityCalendar({ days }: { days: { day: string; races: number }[] }) {
  const counts = new Map(days.map((d) => [d.day, d.races]));
  const max = Math.max(1, ...days.map((d) => d.races));
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = new Date(today.getTime() - 52 * 7 * DAY);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const weeks: { day: string; races: number }[][] = [];
  for (let t = start.getTime(); t <= today.getTime(); t += DAY) {
    const day = new Date(t).toISOString().slice(0, 10);
    const w = Math.floor((t - start.getTime()) / (7 * DAY));
    (weeks[w] ??= []).push({ day, races: counts.get(day) ?? 0 });
  }
  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px]" role="img" aria-label="Races per day over the past year">
        {weeks.map((week, i) => (
          <div key={i} className="flex flex-col gap-[3px]">
            {week.map((d) => (
              <div
                key={d.day}
                title={`${d.day}: ${d.races} race${d.races === 1 ? "" : "s"}`}
                className="size-[11px] rounded-[2px]"
                style={{
                  background:
                    d.races === 0
                      ? "var(--surface-2)"
                      : `color-mix(in srgb, var(--accent) ${25 + Math.round((d.races / max) * 75)}%, var(--surface-2))`,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function HourChart({ hours }: { hours: number[] }) {
  const max = Math.max(1, ...hours);
  return (
    <div>
      <div className="flex h-24 items-end gap-0.5" role="img" aria-label="Races by hour of day">
        {hours.map((n, h) => (
          <div
            key={h}
            title={`${h}:00 - ${n} race${n === 1 ? "" : "s"}`}
            className="flex-1 rounded-t bg-accent"
            style={{ height: `${Math.max(2, (n / max) * 100)}%`, opacity: n ? 1 : 0.2 }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted">
        <span>0:00</span>
        <span>6:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  );
}
