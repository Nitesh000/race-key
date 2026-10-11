"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function FindRoom({ kind }: { kind: "public" | "private" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetch(kind === "public" ? "/api/race/quick" : "/api/race/rooms", { method: "POST" })
      .then(async (res) => {
        const body = (await res.json()) as { roomId?: string; error?: string };
        if (!res.ok || !body.roomId) throw new Error(body.error ?? "Could not find a race.");
        router.replace(`/race/${body.roomId}`);
      })
      .catch((e: Error) => setError(e.message));
  }, [kind, router]);

  return (
    <p className={`py-24 text-center ${error ? "text-danger" : "text-muted"}`}>
      {error ?? (kind === "public" ? "Finding a race…" : "Opening a private room…")}
    </p>
  );
}
