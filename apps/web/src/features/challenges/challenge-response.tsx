"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { respondToChallenge } from "./actions";

export function useSecondsLeft(expiresAt: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  return Math.max(0, Math.ceil((expiresAt - now) / 1000));
}

export function ChallengeResponse({
  id,
  expiresAt,
  compact,
  onDone,
}: {
  id: string;
  expiresAt: number;
  compact?: boolean;
  onDone?: () => void;
}) {
  const router = useRouter();
  const left = useSecondsLeft(expiresAt);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    if (left === 0) onDone?.();
  }, [left, onDone]);

  if (left === 0) return <span className="text-sm text-muted">This challenge expired.</span>;

  const answer = (accept: boolean) =>
    start(async () => {
      const res = await respondToChallenge(id, accept);
      if (!res.ok) return setError(res.error);
      onDone?.();
      if (accept) router.push(`/race/${res.roomId}`);
    });

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button size="sm" disabled={pending} onClick={() => answer(true)}>
        Accept{compact ? "" : " and race"} ({left}s)
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={() => answer(false)}>
        Decline
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </span>
  );
}
