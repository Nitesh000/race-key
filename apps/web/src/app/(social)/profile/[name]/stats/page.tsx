import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { getProfileByName } from "@/features/profile/queries";
import { ActivityCalendar, HourChart } from "@/features/stats/activity-calendar";
import { KeyboardHeatmap } from "@/features/stats/keyboard-heatmap";
import { PrivacySwitch } from "@/features/stats/privacy-switch";
import { getStats, type Period } from "@/features/stats/queries";
import { TrendChart } from "@/features/stats/trend-chart";
import { formatTime } from "@/features/typing/live-stats";
import { cn } from "@/lib/cn";
import { hasDb } from "@/lib/db";
import { getViewer } from "@/lib/session";

type Props = {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ period?: string; real?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `${decodeURIComponent((await params).name)} stats` };
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted uppercase">{label}</dt>
      <dd className="font-mono text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const ratio = (a: number, b: number) => (b ? pct(a / b) : "—");

export default async function StatsPage({ params, searchParams }: Props) {
  if (!hasDb()) notFound();
  const name = decodeURIComponent((await params).name);
  const row = await getProfileByName(name);
  if (!row) notFound();
  const { profile } = row;
  const viewer = await getViewer();
  const own = viewer?.id === profile.userId;
  const sp = await searchParams;
  const period: Period = sp.period === "7d" || sp.period === "30d" ? sp.period : "all";
  const realOnly = sp.real === "1";

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <Link href={`/profile/${profile.username}`} className="text-sm text-accent hover:underline">
          ← {profile.username}
        </Link>
        <h1 className="text-3xl font-bold">Stats</h1>
      </div>
      {own && <PrivacySwitch value={profile.statsPrivate} />}
    </div>
  );

  if (profile.statsPrivate && !own) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        {header}
        <Card>
          <p className="text-muted">{profile.username} keeps their detailed stats private.</p>
        </Card>
      </main>
    );
  }

  const s = await getStats(profile.userId, { period, realOnly });
  const link = (p: Period, r: boolean) => {
    const q = new URLSearchParams();
    if (p !== "all") q.set("period", p);
    if (r) q.set("real", "1");
    const qs = q.toString();
    return `/profile/${profile.username}/stats${qs ? `?${qs}` : ""}`;
  };
  const chip = (href: string, active: boolean, label: string) => (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-3 py-1 text-sm",
        active ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text",
      )}
    >
      {label}
    </Link>
  );
  const pairs = s.keys
    .filter((k) => k.kind === "pair" && k.hits >= 5 && !k.key.includes(" "))
    .sort((a, b) => b.avgMs - a.avgMs)
    .slice(0, 10);
  const words = s.keys
    .filter((k) => k.kind === "word")
    .sort((a, b) => b.misses - a.misses)
    .slice(0, 10);
  const singles = s.keys.filter((k) => k.kind === "key");
  const classSpeed = (test: (c: string) => boolean) => {
    const ks = singles.filter((k) => test(k.key) && k.hits > 0);
    const hits = ks.reduce((a, k) => a + k.hits, 0);
    const ms = ks.reduce((a, k) => a + k.avgMs * k.hits, 0);
    return hits ? `${Math.round(ms / hits)} ms` : "—";
  };
  const bestHour = s.habits.hours.indexOf(Math.max(...s.habits.hours));

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      {header}
      <div className="flex flex-wrap gap-3">
        <nav aria-label="Period" className="inline-flex rounded-lg bg-surface-2 p-1">
          {chip(link("7d", realOnly), period === "7d", "7 days")}
          {chip(link("30d", realOnly), period === "30d", "30 days")}
          {chip(link("all", realOnly), period === "all", "All time")}
        </nav>
        <nav aria-label="Opponents" className="inline-flex rounded-lg bg-surface-2 p-1">
          {chip(link(period, false), !realOnly, "All races")}
          {chip(link(period, true), realOnly, "Real players only")}
        </nav>
      </div>

      <Card>
        <CardTitle>Speed</CardTitle>
        <dl className="mb-5 grid grid-cols-2 gap-6 sm:grid-cols-6">
          <Stat label="Last 10" value={Math.round(s.speed.last10)} />
          <Stat label="Last 100" value={Math.round(s.speed.last100)} />
          <Stat label="Average" value={Math.round(s.speed.avg)} />
          <Stat label="Median" value={Math.round(s.speed.median)} />
          <Stat label="Best" value={Math.round(s.speed.best)} />
          <Stat label="Consistency" value={s.speed.consistency ? pct(s.speed.consistency) : "—"} />
        </dl>
        <TrendChart points={s.trend} />
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardTitle>Accuracy</CardTitle>
          <dl className="grid grid-cols-3 gap-6">
            <Stat label="Overall" value={s.accuracy.overall ? pct(s.accuracy.overall) : "—"} />
            <Stat label="Errors / 100 chars" value={s.accuracy.errorsPer100.toFixed(1)} />
            <Stat
              label="Time to fix"
              value={s.accuracy.fixMs === null ? "—" : `${(s.accuracy.fixMs / 1000).toFixed(2)} s`}
            />
          </dl>
        </Card>
        <Card>
          <CardTitle>Races</CardTitle>
          <dl className="grid grid-cols-3 gap-6">
            <Stat label="Races" value={s.races.races} />
            <Stat label="Wins" value={s.races.wins} />
            <Stat label="Podium rate" value={ratio(s.races.podiums, s.races.races)} />
            <Stat label="Win rate vs real" value={ratio(s.races.realWins, s.races.realRaces)} />
            <Stat
              label="Win rate vs bots"
              value={ratio(s.races.wins - s.races.realWins, s.races.races - s.races.realRaces)}
            />
            <Stat label="Best streak" value={profile.bestWinStreak} />
            <Stat label="Time typed" value={formatTime(s.races.timeMs)} />
            <Stat label="Characters" value={s.races.chars.toLocaleString("en")} />
            <Stat label="Words" value={Math.round(s.races.chars / 5).toLocaleString("en")} />
          </dl>
        </Card>
      </div>

      <Card>
        <CardTitle>Keys</CardTitle>
        <KeyboardHeatmap keys={singles} />
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted">Slowest letter pairs</h3>
            <ol className="space-y-1 font-mono text-sm">
              {pairs.map((p) => (
                <li key={p.key} className="flex justify-between">
                  <span>{p.key}</span>
                  <span className="text-muted">{Math.round(p.avgMs)} ms</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium text-muted">Most missed words</h3>
            <ol className="space-y-1 text-sm">
              {words.map((w) => (
                <li key={w.key} className="flex justify-between">
                  <span>{w.key}</span>
                  <span className="text-muted">{w.misses}×</span>
                </li>
              ))}
            </ol>
          </div>
          <dl className="space-y-3">
            <Stat label="Lowercase" value={classSpeed((c) => /\p{Ll}/u.test(c))} />
            <Stat label="Capitals" value={classSpeed((c) => /\p{Lu}/u.test(c))} />
            <Stat label="Numbers" value={classSpeed((c) => /\d/.test(c))} />
            <Stat label="Punctuation" value={classSpeed((c) => /[^\p{L}\d\s]/u.test(c))} />
          </dl>
        </div>
      </Card>

      <Card>
        <CardTitle>Habits</CardTitle>
        <ActivityCalendar days={s.habits.days} />
        <div className="mt-6 grid gap-6 md:grid-cols-[2fr_1fr]">
          <HourChart hours={s.habits.hours} />
          <dl className="space-y-3">
            <Stat label="Best time of day" value={s.races.races ? `${bestHour}:00` : "—"} />
            <Stat
              label="Races per active day"
              value={s.habits.activeDays ? (s.races.races / s.habits.activeDays).toFixed(1) : "—"}
            />
          </dl>
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardTitle>Favourite authors</CardTitle>
          <ol className="space-y-1 text-sm">
            {s.books.favouriteAuthors.map((a) => (
              <li key={a.name} className="flex justify-between gap-2">
                <span>{a.name}</span>
                <span className="text-muted">{a.races}</span>
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <CardTitle>Books raced most</CardTitle>
          <ol className="space-y-1 text-sm">
            {s.books.favouriteBooks.map((b) => (
              <li key={b.title} className="flex justify-between gap-2">
                <span className="italic">{b.title}</span>
                <span className="text-muted">{b.races}</span>
              </li>
            ))}
          </ol>
        </Card>
        <Card>
          <CardTitle>Best by difficulty</CardTitle>
          <ol className="space-y-1 font-mono text-sm">
            {s.books.byDifficulty.map((d) => (
              <li key={d.difficulty} className="flex justify-between">
                <span>Level {d.difficulty}</span>
                <span className="text-muted">
                  {Math.round(d.best)} best · {Math.round(d.avg)} avg
                </span>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      {s.headToHead.length > 0 && (
        <Card>
          <CardTitle>Head to head</CardTitle>
          <ul className="divide-y divide-border">
            {s.headToHead.map((h) => (
              <li key={h.username} className="flex justify-between py-2">
                <Link href={`/profile/${h.username}`} className="hover:underline">
                  {h.username}
                </Link>
                <span className="font-mono tabular-nums">
                  {h.wins} – {h.losses}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </main>
  );
}
