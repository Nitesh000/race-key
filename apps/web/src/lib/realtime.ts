import "server-only";
import { DEV_SECRET, type PresenceMessage, type PresenceStatus } from "@race-key/shared";
import { env, realtimeUrl } from "./env";

export function realtimeSecret() {
  return (
    env("REALTIME_SHARED_SECRET") ?? (process.env.NODE_ENV === "production" ? null : DEV_SECRET)
  );
}

async function post<T = { roomId: string }>(path: string, body: unknown): Promise<T> {
  const secret = realtimeSecret();
  if (!secret) throw new Error("REALTIME_SHARED_SECRET is not set");
  const res = await fetch(`${realtimeUrl}${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`realtime ${path} returned ${res.status}`);
  return (await res.json()) as T;
}

export function createPrivateRoom(wpm?: number) {
  return post("/rooms", { wpm });
}

export function findPublicRoom(sub: string, wpm: number) {
  return post("/match", { sub, wpm });
}

export async function presenceStatus(ids: string[]): Promise<Record<string, PresenceStatus>> {
  if (ids.length === 0) return {};
  try {
    return await post<Record<string, PresenceStatus>>("/presence/status", { ids });
  } catch (e) {
    console.error("presence lookup failed", e);
    return Object.fromEntries(ids.map((id) => [id, "offline" as const]));
  }
}

export async function notifyUser(uid: string, message: PresenceMessage) {
  try {
    await post("/presence/notify", { uid, message });
  } catch (e) {
    console.error("notify failed", e);
  }
}
