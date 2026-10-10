"use client";

import type { ClientMessage, RoomSnapshot } from "@race-key/shared";
import { useEffect, useRef, useState } from "react";
import { RaceConnection, type ConnectionStatus } from "./connection";
import { ProgressStore } from "./progress-store";

export type RoomError = { code: string; message: string };

export function useRaceRoom(host: string, roomId: string) {
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [you, setYou] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<RoomError | null>(null);
  const progress = useRef(new ProgressStore()).current;
  const connRef = useRef<RaceConnection | null>(null);
  const youRef = useRef<string | null>(null);
  const raceIdRef = useRef<string | null>(null);

  useEffect(() => {
    const conn = new RaceConnection(host, roomId, {
      onStatus: setStatus,
      onMessage: (msg) => {
        if (msg.t === "error") {
          setError({ code: msg.code, message: msg.message });
          conn.close();
          return;
        }
        if (msg.t === "tick") {
          progress.apply(msg.p, youRef.current ?? undefined);
          return;
        }
        if (msg.t === "welcome") {
          youRef.current = msg.you;
          setYou(msg.you);
        }
        if (msg.t === "welcome" || msg.t === "room") {
          if (raceIdRef.current !== msg.room.raceId) {
            raceIdRef.current = msg.room.raceId;
            progress.clear();
          }
          for (const p of msg.room.players) {
            if (p.id !== youRef.current) progress.set(p.id, p);
          }
          setRoom(msg.room);
        }
      },
    });
    connRef.current = conn;
    return () => {
      conn.close();
      connRef.current = null;
    };
  }, [host, roomId, progress]);

  return {
    room,
    you,
    status,
    error,
    progress,
    send: (msg: ClientMessage) => connRef.current?.send(msg),
    serverNow: () => connRef.current?.serverNow() ?? Date.now(),
    toPerf: (t: number) => connRef.current?.toPerf(t) ?? performance.now(),
  };
}
