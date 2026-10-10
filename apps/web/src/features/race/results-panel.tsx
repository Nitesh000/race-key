"use client";

import type { RoomSnapshot } from "@race-key/shared";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SourceCard } from "@/features/passages/source-card";
import type { ClientPassage } from "@/features/passages/types";
import { MistakesView } from "@/features/results/mistakes-view";
import { ResultSummary } from "@/features/results/result-summary";
import { SpeedChart } from "@/features/results/speed-chart";
import { formatTime } from "@/features/typing/live-stats";
import type { TypingStats } from "@/features/typing/engine";
import { cn } from "@/lib/cn";

export type LocalFinish = { stats: TypingStats; samples: number[]; missed: Set<number> };

export function ResultsPanel({
  room,
  you,
  local,
  onAgain,
}: {
  room: RoomSnapshot;
  you: string | null;
  local: LocalFinish | null;
  onAgain: () => void;
}) {
  const [source, setSource] = useState<ClientPassage | null>(null);
  const results = room.results ?? [];
  const mine = results.find((r) => r.id === you);

  useEffect(() => {
    let live = true;
    fetch(`/api/passages/${room.passage.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => live && setSource(p as ClientPassage | null));
    return () => {
      live = false;
    };
  }, [room.passage.id]);

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Results</CardTitle>
        <ol className="divide-y divide-border">
          {results.map((r) => (
            <li
              key={r.id}
              className={cn(
                "grid grid-cols-[2.5rem_1fr_auto_auto_auto] items-center gap-4 py-2 font-mono text-sm tabular-nums",
                r.id === you && "font-semibold",
              )}
            >
              <span>{r.place}.</span>
              <span className="truncate font-sans">{r.name}</span>
              <span>{Math.round(r.wpm)} wpm</span>
              <span className="text-muted">
                {r.finished ? `${(r.accuracy * 100).toFixed(0)}%` : "—"}
              </span>
              <span className="text-muted">{r.finished ? formatTime(r.timeMs) : "DNF"}</span>
            </li>
          ))}
        </ol>
        {mine && local && (
          <div className="mt-5 space-y-4">
            <ResultSummary
              result={{
                ...local.stats,
                wpm: mine.wpm,
                elapsed: mine.timeMs,
                placement: mine.place,
                racers: results.length,
              }}
            />
            <SpeedChart samples={local.samples} />
            <div>
              <h3 className="mb-2 text-sm font-medium text-muted">Mistakes</h3>
              <MistakesView text={room.passage.text} missed={local.missed} />
            </div>
          </div>
        )}
        <div className="mt-5 flex gap-2">
          <Button onClick={onAgain}>Race again</Button>
          <Link href="/race" className={buttonClass("secondary")}>
            New room
          </Link>
        </div>
      </Card>
      {source && <SourceCard passage={source} />}
    </div>
  );
}
