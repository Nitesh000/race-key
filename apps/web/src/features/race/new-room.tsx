"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function NewRoom() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    fetch("/api/race/rooms", { method: "POST" })
      .then(async (res) => {
        const body = (await res.json()) as { roomId?: string; error?: string };
        if (!res.ok || !body.roomId) throw new Error(body.error ?? "Could not create a room.");
        router.replace(`/race/${body.roomId}`);
      })
      .catch((e: Error) => setError(e.message));
  }, [router]);

  return (
    <p className={`py-24 text-center ${error ? "text-danger" : "text-muted"}`}>
      {error ?? "Opening a race room…"}
    </p>
  );
}
