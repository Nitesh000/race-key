"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SourceCard } from "@/features/passages/source-card";
import { SourceLine } from "@/features/passages/source-line";
import type { ClientPassage } from "@/features/passages/types";
import { MistakesView } from "@/features/results/mistakes-view";
import { ResultSummary, type ResultNumbers } from "@/features/results/result-summary";
import { SpeedChart } from "@/features/results/speed-chart";
import type { TypingEngine } from "@/features/typing/engine";
import { LiveStats } from "@/features/typing/live-stats";
import { RaceScreenLayout } from "@/features/typing/race-screen-layout";
import { TypingArea } from "@/features/typing/typing-area";
import { useTypingSession } from "@/features/typing/use-typing-session";
import { averageWpm, pushRecent } from "./history";

type Finished = {
  result: ResultNumbers;
  samples: number[];
  missed: Set<number>;
  average?: number;
};

export function PracticeSession({ initial }: { initial: ClientPassage }) {
  const [passage, setPassage] = useState(initial);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [loading, setLoading] = useState(false);

  const onFinish = useCallback((e: TypingEngine) => {
    const s = e.stats(e.finishedAt ?? performance.now());
    const average = averageWpm();
    pushRecent({ wpm: s.wpm, accuracy: s.accuracy, at: Date.now() });
    setFinished({
      result: s,
      samples: [...e.samples],
      missed: new Set(e.missed),
      average,
    });
  }, []);

  const session = useTypingSession({ text: passage.text, onFinish });

  const next = useCallback(async () => {
    setLoading(true);
    const wpm = averageWpm();
    const params = new URLSearchParams({ exclude: passage.id });
    if (wpm) params.set("wpm", String(Math.round(wpm)));
    const res = await fetch(`/api/passages/random?${params}`);
    setPassage((await res.json()) as ClientPassage);
    setFinished(null);
    setLoading(false);
  }, [passage.id]);

  const retry = useCallback(() => {
    setFinished(null);
    session.reset();
    requestAnimationFrame(session.focus);
  }, [session]);

  useEffect(() => {
    if (!finished) requestAnimationFrame(session.focus);
  }, [passage, finished, session.focus]);

  useEffect(() => {
    if (!finished) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) void next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finished, next]);

  return (
    <RaceScreenLayout
      stats={
        <>
          <LiveStats stats={session.stats} />
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={retry}>
              Restart
            </Button>
            <Button variant="secondary" size="sm" onClick={next} disabled={loading}>
              New passage
            </Button>
          </div>
        </>
      }
      passage={<TypingArea key={passage.id} text={passage.text} session={session} />}
      source={<SourceLine passage={passage} />}
      below={
        finished && (
          <div className="space-y-4">
            <Card>
              <CardTitle>Result</CardTitle>
              <ResultSummary result={finished.result} />
              {finished.average !== undefined && (
                <p className="mt-3 text-sm text-muted">
                  {finished.result.wpm >= finished.average ? "Faster" : "Slower"} than your recent
                  average by {Math.abs(Math.round(finished.result.wpm - finished.average))} wpm.
                </p>
              )}
              <div className="mt-4">
                <SpeedChart samples={finished.samples} average={finished.average} />
              </div>
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-medium text-muted">Mistakes</h3>
                <MistakesView text={passage.text} missed={finished.missed} />
              </div>
              <div className="mt-5 flex gap-2">
                <Button onClick={next} disabled={loading}>
                  Next passage <kbd className="text-xs opacity-70">Ctrl+Enter</kbd>
                </Button>
                <Button variant="secondary" onClick={retry}>
                  Try again
                </Button>
              </div>
            </Card>
            <SourceCard passage={passage} />
          </div>
        )
      }
    />
  );
}
