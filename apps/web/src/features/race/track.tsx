"use client";

import { MAX_PLAYERS, type PublicPlayer } from "@race-key/shared";
import { memo, useEffect, useRef, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import type { TrackDisplay } from "@/features/settings/store";
import { Emoji } from "@/features/taunts/emoji";
import type { Bubble, TauntStore } from "@/features/taunts/taunt-store";
import { Car } from "./car";
import type { ProgressStore } from "./progress-store";

const LANE = { full: 24, minimal: 14 } as const;
const GAP = 4;
const PAD = 8;

export function trackHeight(display: TrackDisplay) {
  if (display === "hidden") return 40;
  return MAX_PLAYERS * LANE[display] + (MAX_PLAYERS - 1) * GAP + PAD * 2;
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!);
}

type Props = {
  players: PublicPlayer[];
  you: string | null;
  length: number;
  store: ProgressStore;
  taunts: TauntStore;
  display: TrackDisplay;
  overlay?: React.ReactNode;
};

function TauntBubble({ bubble }: { bubble: Bubble | undefined }) {
  if (!bubble) return null;
  return (
    <span
      key={bubble.key}
      className="taunt-bubble pointer-events-none absolute top-1/2 grid aspect-square h-[calc(100%-2px)] -translate-y-1/2 place-items-center rounded-full bg-surface shadow-sm"
    >
      <Emoji char={bubble.emoji} className="size-[75%]" />
    </span>
  );
}

export const Track = memo(function Track({
  players,
  you,
  length,
  store,
  taunts,
  display,
  overlay,
}: Props) {
  const bubbles = useSyncExternalStore(taunts.subscribe, taunts.get, taunts.get);
  const others = players.filter((p) => p.id !== you);
  const me = players.find((p) => p.id === you);
  const ordered = me ? [...others, me] : others;
  const empty = Math.max(0, MAX_PLAYERS - ordered.length);

  const racerRefs = useRef(new Map<string, HTMLElement>());
  const wpmRefs = useRef(new Map<string, HTMLElement>());

  useEffect(() => {
    const paint = () => {
      for (const [id, el] of racerRefs.current) {
        const { pos } = store.get(id);
        const p = length ? Math.min(1, pos / length) : 0;
        el.style.transform = display === "minimal" ? `scaleX(${p})` : `translateX(${p * 100}%)`;
      }
      for (const [id, el] of wpmRefs.current) {
        el.textContent = String(Math.round(store.get(id).wpm));
      }
    };
    paint();
    return store.subscribe(paint);
  }, [store, length, display, players]);

  if (display === "hidden") {
    const place = me?.place;
    return (
      <div className="flex h-full items-center justify-between px-4 font-mono text-sm text-muted">
        <span>{place ? `You finished ${ordinal(place)}` : `${players.length} racing`}</span>
        <span>
          <span ref={(el) => void (el && you ? wpmRefs.current.set(you, el) : null)}>0</span> wpm
        </span>
        {overlay}
      </div>
    );
  }

  const laneH = LANE[display];
  return (
    <div className="relative flex h-full flex-col justify-end" style={{ padding: PAD, gap: GAP }}>
      {Array.from({ length: empty }, (_, i) => (
        <div key={`empty-${i}`} style={{ height: laneH }} />
      ))}
      {ordered.map((p) => {
        const isYou = p.id === you;
        return (
          <div
            key={p.id}
            className="grid items-center gap-2 text-xs"
            style={{ height: laneH, gridTemplateColumns: "7rem 1fr 3.5rem" }}
          >
            <span
              className={cn(
                "truncate",
                isYou ? "font-semibold text-text" : "text-muted",
                (p.left || !p.connected) && "line-through opacity-60",
              )}
              title={p.name}
            >
              {p.place ? `${ordinal(p.place)} ` : ""}
              {p.name}
            </span>
            <div
              className={cn(
                "relative h-full overflow-hidden rounded-full",
                isYou ? "bg-lane-you" : "bg-lane",
              )}
            >
              {display === "minimal" ? (
                <>
                  <div
                    ref={(el) =>
                      void (el ? racerRefs.current.set(p.id, el) : racerRefs.current.delete(p.id))
                    }
                    className={cn(
                      "racer-bar absolute inset-0 origin-left",
                      isYou ? "bg-accent" : "bg-racer",
                    )}
                  />
                  <span className="absolute inset-y-0 right-1">
                    <TauntBubble bubble={bubbles.get(p.id)} />
                  </span>
                </>
              ) : (
                <div className="absolute inset-y-0 left-0" style={{ right: laneH * 2 }}>
                  <div
                    ref={(el) =>
                      void (el ? racerRefs.current.set(p.id, el) : racerRefs.current.delete(p.id))
                    }
                    className="racer absolute inset-0"
                  >
                    <div
                      className={cn("relative h-full py-0.5", !p.place && "racer-moving")}
                      style={{ width: laneH * 2 }}
                    >
                      <Car you={isYou} />
                      <span className="absolute inset-y-0" style={{ left: laneH * 2 + 2 }}>
                        <TauntBubble bubble={bubbles.get(p.id)} />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <span className="text-right font-mono text-muted tabular-nums">
              <span
                ref={(el) =>
                  void (el ? wpmRefs.current.set(p.id, el) : wpmRefs.current.delete(p.id))
                }
              >
                0
              </span>{" "}
              wpm
            </span>
          </div>
        );
      })}
      {overlay}
    </div>
  );
});
