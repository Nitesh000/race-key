"use client";

import type { RoomSnapshot } from "@race-key/shared";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export function LobbyPanel({
  room,
  you,
  onStart,
}: {
  room: RoomSnapshot;
  you: string | null;
  onStart: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === you;
  const isPublic = room.kind === "public";

  async function copy() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle className="mb-0">Lobby</CardTitle>
        {isPublic ? (
          <span className="text-sm text-muted">
            Racers matched to your speed join until the countdown starts.
          </span>
        ) : (
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={copy}>
              {copied ? "Link copied" : "Copy invite link"}
            </Button>
            {isHost ? (
              <Button size="sm" onClick={onStart} disabled={room.phase !== "lobby"}>
                Start race
              </Button>
            ) : (
              <span className="self-center text-sm text-muted">Waiting for the host to start</span>
            )}
          </div>
        )}
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {room.players.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2"
          >
            <span className={p.connected ? "" : "text-muted"}>
              {p.name}
              {p.id === you && <span className="text-muted"> (you)</span>}
            </span>
            <span className="text-xs text-muted">
              {!isPublic && p.id === room.hostId ? "host · " : ""}Lv {p.level}
            </span>
          </li>
        ))}
      </ul>
      {!isPublic && (
        <p className="text-xs text-muted">
          Up to 5 racers. The race starts on its own when the room is full.
        </p>
      )}
    </Card>
  );
}
