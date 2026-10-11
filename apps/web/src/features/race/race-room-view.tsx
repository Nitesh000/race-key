"use client";

import { PROGRESS_INTERVAL_MS } from "@race-key/shared";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSettings } from "@/features/settings/store";
import type { TypingEngine } from "@/features/typing/engine";
import { LiveStats } from "@/features/typing/live-stats";
import { RaceScreenLayout } from "@/features/typing/race-screen-layout";
import { TypingArea } from "@/features/typing/typing-area";
import { useTypingSession } from "@/features/typing/use-typing-session";
import { useMediaQuery } from "@/lib/use-media-query";
import { LobbyPanel } from "./lobby-panel";
import { ResultsPanel, type LocalFinish } from "./results-panel";
import { StripOverlay } from "./strip-overlay";
import { Track, trackHeight } from "./track";
import { useRaceRoom } from "./use-race-room";

const hints = {
  lobby: "The race starts when the host is ready",
  countdown: "Get ready…",
  racing: "Click here or press any key to focus",
  done: "",
} as const;

const publicLobbyHint = "The race starts on its own in a few seconds";

export function RaceRoomView({ host, roomId }: { host: string; roomId: string }) {
  const { room, you, status, error, progress, send, serverNow, toPerf } = useRaceRoom(host, roomId);
  const settings = useSettings();
  const small = useMediaQuery("(max-width: 640px)");
  const display = small && settings.track === "full" ? "minimal" : settings.track;

  const [go, setGo] = useState(false);
  const [local, setLocal] = useState<LocalFinish | null>(null);
  const pendingPos = useRef(0);
  const sentPos = useRef(0);

  const text = room?.passage.text ?? "";
  const raceId = room?.raceId;
  const me = room?.players.find((p) => p.id === you);

  const onKeystroke = useCallback(
    (e: TypingEngine) => {
      pendingPos.current = e.pos;
      if (you) progress.set(you, { pos: e.pos, wpm: e.stats(performance.now()).wpm });
    },
    [you, progress],
  );

  const onFinish = useCallback(
    (e: TypingEngine) => {
      const s = e.stats(e.finishedAt ?? performance.now());
      send({ t: "progress", pos: e.text.length });
      sentPos.current = e.text.length;
      send({
        t: "finish",
        stats: {
          timeMs: Math.max(1, Math.round(s.elapsed)),
          rawWpm: s.rawWpm,
          accuracy: s.accuracy,
          errors: s.errors,
          samples: e.samples.slice(0, 1200),
        },
      });
      setLocal({ stats: s, samples: [...e.samples], missed: new Set(e.missed) });
    },
    [send],
  );

  const session = useTypingSession({
    text,
    enabled: go && !local && !me?.left,
    onKeystroke,
    onFinish,
  });
  const { start, focus, reset } = session;

  useEffect(() => {
    setGo(false);
    setLocal(null);
    pendingPos.current = 0;
    sentPos.current = 0;
    reset();
  }, [raceId, reset]);

  const startsAt = room?.startsAt;
  const phase = room?.phase;
  useEffect(() => {
    if (go || !startsAt || (phase !== "countdown" && phase !== "racing")) return;
    const id = setTimeout(
      () => {
        setGo(true);
        start(toPerf(startsAt));
        focus();
      },
      Math.max(0, startsAt - serverNow()),
    );
    return () => clearTimeout(id);
  }, [go, phase, startsAt, start, focus, toPerf, serverNow]);

  useEffect(() => {
    if (!go || local) return;
    const id = setInterval(() => {
      if (pendingPos.current > sentPos.current) {
        sentPos.current = pendingPos.current;
        send({ t: "progress", pos: pendingPos.current });
      }
    }, PROGRESS_INTERVAL_MS);
    return () => clearInterval(id);
  }, [go, local, send]);

  if (error) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16">
        <Card className="space-y-4 text-center">
          <p>{error.message}</p>
          <Link href="/race" className={buttonClass()}>
            Find another race
          </Link>
        </Card>
      </main>
    );
  }

  if (!room) {
    return <p className="py-24 text-center text-muted">Connecting to the race…</p>;
  }

  return (
    <main>
      <RaceScreenLayout
        trackHeight={trackHeight(display)}
        track={
          <Track
            players={room.players}
            you={you}
            length={text.length}
            store={progress}
            display={display}
            overlay={<StripOverlay room={room} place={me?.place ?? null} serverNow={serverNow} />}
          />
        }
        stats={
          <>
            <LiveStats stats={session.stats} />
            {status !== "open" && (
              <span className="rounded-full bg-warning/15 px-3 py-1 text-sm text-warning">
                {status === "closed" ? "Disconnected" : "Reconnecting…"}
              </span>
            )}
            {me?.left && (
              <span className="text-sm text-muted">You were away too long and left this race.</span>
            )}
          </>
        }
        passage={
          <TypingArea
            text={text}
            session={session}
            hint={
              room.kind === "public" && room.phase === "lobby" ? publicLobbyHint : hints[room.phase]
            }
          />
        }
        source={
          <p>
            <span className="italic">{room.passage.title}</span> by {room.passage.author}
          </p>
        }
        below={
          room.phase === "lobby" ? (
            <LobbyPanel room={room} you={you} onStart={() => send({ t: "start" })} />
          ) : room.phase === "done" || local ? (
            <ResultsPanel
              room={room}
              you={you}
              local={local}
              onAgain={() => send({ t: "again" })}
            />
          ) : null
        }
      />
    </main>
  );
}
