"use client";

import type { RoomSnapshot } from "@race-key/shared";
import { useEffect, useState } from "react";

export function StripOverlay({
  room,
  place,
  serverNow,
}: {
  room: RoomSnapshot;
  place: number | null;
  serverNow: () => number;
}) {
  const [now, setNow] = useState(serverNow);

  useEffect(() => {
    if (room.phase !== "countdown" && room.phase !== "racing") return;
    const id = setInterval(() => setNow(serverNow()), 100);
    return () => clearInterval(id);
  }, [room.phase, serverNow]);

  let label: string | null = null;
  if (room.phase === "lobby") label = "Waiting for the race to start";
  if (room.phase === "countdown" && room.startsAt) {
    const left = Math.ceil((room.startsAt - now) / 1000);
    label = left > 0 ? String(left) : "Go!";
  }
  if (room.phase === "racing" && room.startsAt && now - room.startsAt < 800) label = "Go!";
  if (room.phase === "racing" && place) label = `You finished ${place}${suffix(place)}`;
  if (room.phase === "done") label = "Race over";
  if (!label) return null;

  const big = /^\d$|Go!/.test(label);
  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-0 grid place-items-center bg-track/70"
    >
      <span
        key={label}
        className={big ? "strip-pop font-mono text-4xl font-bold text-text" : "text-sm text-muted"}
      >
        {label}
      </span>
    </div>
  );
}

function suffix(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] ?? s[v] ?? s[0]!;
}
