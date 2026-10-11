import { NEW_PLAYER_WPM } from "./bots/speed";
import { JOIN_CUTOFF_MS } from "./room/state";

export const BRACKET_WIDTH = 20;
export const WIDEN_PER_SECOND = 3;

export type OpenRoom = {
  id: string;
  wpm: number;
  seated: number;
  createdAt: number;
  closesAt: number;
};

export function effectiveWpm(wpm: number) {
  return wpm > 0 ? wpm : NEW_PLAYER_WPM;
}

export function bracketHalfWidth(ageMs: number) {
  return BRACKET_WIDTH / 2 + (Math.max(0, ageMs) / 1000) * (WIDEN_PER_SECOND / 2);
}

export function stillOpen(room: OpenRoom, now: number) {
  return now < room.closesAt - JOIN_CUTOFF_MS;
}

export function candidates(rooms: OpenRoom[], wpm: number, now: number) {
  const w = effectiveWpm(wpm);
  return rooms
    .filter((r) => stillOpen(r, now) && Math.abs(r.wpm - w) <= bracketHalfWidth(now - r.createdAt))
    .sort((a, b) => b.seated - a.seated || Math.abs(a.wpm - w) - Math.abs(b.wpm - w));
}

export function addToRoom(room: OpenRoom, wpm: number): OpenRoom {
  const n = room.seated + 1;
  return { ...room, seated: n, wpm: (room.wpm * room.seated + effectiveWpm(wpm)) / n };
}
