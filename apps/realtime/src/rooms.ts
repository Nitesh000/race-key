import { getServerByName } from "partyserver";
import type { Secrets } from "./env";

type WorkerEnv = Env & Secrets;

export function newRoomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("");
}

async function call<T>(env: WorkerEnv, roomId: string, path: string, body: unknown) {
  const stub = await getServerByName(env.RaceRoom, roomId);
  const res = await stub.fetch(`https://room/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`room ${roomId} ${path} returned ${res.status}`);
  return (await res.json()) as T;
}

export function initRoom(env: WorkerEnv, roomId: string, kind: "public" | "private", wpm?: number) {
  return call<{ roomId: string; autoStartAt: number | null }>(env, roomId, "init", { kind, wpm });
}

export function reserveSeat(env: WorkerEnv, roomId: string, sub: string) {
  return call<{ ok: boolean; players: number }>(env, roomId, "reserve", { sub });
}
