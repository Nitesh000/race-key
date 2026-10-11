import "server-only";
import { DEV_SECRET } from "@race-key/shared";
import { env, realtimeUrl } from "./env";

export function realtimeSecret() {
  return (
    env("REALTIME_SHARED_SECRET") ?? (process.env.NODE_ENV === "production" ? null : DEV_SECRET)
  );
}

async function post(path: string, body: unknown) {
  const secret = realtimeSecret();
  if (!secret) throw new Error("REALTIME_SHARED_SECRET is not set");
  const res = await fetch(`${realtimeUrl}${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`realtime ${path} returned ${res.status}`);
  return (await res.json()) as { roomId: string };
}

export function createPrivateRoom(wpm?: number) {
  return post("/rooms", { wpm });
}

export function findPublicRoom(sub: string, wpm: number) {
  return post("/match", { sub, wpm });
}
