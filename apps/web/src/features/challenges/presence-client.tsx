"use client";

import type { ChallengeNotice, PresenceMessage } from "@race-key/shared";
import { usePathname } from "next/navigation";
import PartySocket from "partysocket";
import { useCallback, useEffect, useState } from "react";
import { ChallengeResponse } from "./challenge-response";

async function ticket() {
  const res = await fetch("/api/race/ticket", { cache: "no-store" });
  if (!res.ok) throw new Error("no ticket");
  return ((await res.json()) as { ticket: string }).ticket;
}

export function PresenceClient({ host }: { host: string }) {
  const pathname = usePathname();
  const [challenge, setChallenge] = useState<ChallengeNotice | null>(null);

  useEffect(() => {
    const url = new URL(host);
    const socket = new PartySocket({
      host: url.host,
      protocol: url.protocol === "https:" ? "wss" : "ws",
      party: "presence",
      room: "global",
      query: async () => ({ ticket: await ticket() }),
      maxReconnectionDelay: 30_000,
      shouldReconnectOnClose: (e) => e.code < 4000,
    });
    socket.addEventListener("message", (e) => {
      const msg = JSON.parse(String(e.data)) as PresenceMessage;
      if (msg.t === "challenge") setChallenge(msg.c);
      if (msg.t === "challenge-closed") setChallenge((c) => (c?.id === msg.id ? null : c));
    });
    return () => socket.close();
  }, [host]);

  const clear = useCallback(() => setChallenge(null), []);

  if (!challenge || /^\/race\/[a-z0-9]+$/.test(pathname)) return null;
  return (
    <div
      role="alert"
      className="fixed right-4 bottom-4 z-50 max-w-sm space-y-2 rounded-2xl border border-border bg-surface p-4 shadow-lg"
    >
      <p>
        <span className="font-semibold">{challenge.from}</span> challenged you to a race.
      </p>
      <ChallengeResponse id={challenge.id} expiresAt={challenge.expiresAt} compact onDone={clear} />
    </div>
  );
}
