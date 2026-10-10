import "server-only";
import { DEV_SECRET } from "@race-key/shared";
import { env, realtimeUrl } from "./env";

export function realtimeSecret() {
  return (
    env("REALTIME_SHARED_SECRET") ?? (process.env.NODE_ENV === "production" ? null : DEV_SECRET)
  );
}

export async function createRoom(opts: { kind: "public" | "private"; wpm?: number }) {
  const secret = realtimeSecret();
  if (!secret) throw new Error("REALTIME_SHARED_SECRET is not set");
  const res = await fetch(`${realtimeUrl}/rooms`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify(opts),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`realtime returned ${res.status}`);
  return (await res.json()) as { roomId: string };
}
