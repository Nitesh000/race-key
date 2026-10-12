"use client";

import {
  defaultLoadout,
  type ChatMessage,
  type ClientMessage,
  type RewardSummary,
  type RoomSnapshot,
} from "@race-key/shared";
import { getSettings } from "@/features/settings/store";
import { TauntStore } from "@/features/taunts/taunt-store";
import { useEffect, useRef, useState } from "react";
import { RaceConnection, type ConnectionStatus } from "./connection";
import { ProgressStore } from "./progress-store";

export type RoomError = { code: string; message: string };

export function useRaceRoom(host: string, roomId: string) {
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [you, setYou] = useState<string | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [error, setError] = useState<RoomError | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [reported, setReported] = useState<Set<string>>(new Set());
  const [emojis, setEmojis] = useState<string[]>(defaultLoadout);
  const [rewards, setRewards] = useState<{ raceId: string; r: RewardSummary } | null>(null);
  const progress = useRef(new ProgressStore()).current;
  const taunts = useRef(new TauntStore()).current;
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
        if (msg.t === "taunt") {
          if (msg.from === youRef.current || !getSettings().muteTaunts)
            taunts.show(msg.from, msg.emoji);
          return;
        }
        if (msg.t === "chat") {
          setChat((c) => [...c.slice(-49), msg.m]);
          return;
        }
        if (msg.t === "rewards") {
          setRewards({ raceId: msg.raceId, r: msg.r });
          return;
        }
        if (msg.t === "reported") {
          setReported((r) => new Set(r).add(msg.id));
          return;
        }
        if (msg.t === "welcome") {
          youRef.current = msg.you;
          setYou(msg.you);
          setEmojis(msg.emojis);
          setChat(msg.chat);
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
  }, [host, roomId, progress, taunts]);

  return {
    room,
    you,
    status,
    error,
    progress,
    taunts,
    chat,
    reported,
    emojis,
    rewards: rewards && rewards.raceId === room?.raceId ? rewards.r : null,
    send: (msg: ClientMessage) => connRef.current?.send(msg),
    serverNow: () => connRef.current?.serverNow() ?? Date.now(),
    toPerf: (t: number) => connRef.current?.toPerf(t) ?? performance.now(),
  };
}
