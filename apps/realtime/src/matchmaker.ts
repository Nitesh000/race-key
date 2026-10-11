import { DurableObject } from "cloudflare:workers";
import type { Secrets } from "./env";
import { addToRoom, candidates, effectiveWpm, stillOpen, type OpenRoom } from "./matching";
import { initRoom, newRoomId, reserveSeat } from "./rooms";

export class Matchmaker extends DurableObject<Env & Secrets> {
  private rooms: OpenRoom[] = [];
  private queue: Promise<unknown> = Promise.resolve();

  match(sub: string, wpm: number): Promise<{ roomId: string }> {
    const next = this.queue.then(() => this.place(sub, wpm));
    this.queue = next.catch(() => {});
    return next;
  }

  private async place(sub: string, wpm: number) {
    const now = Date.now();
    this.rooms = this.rooms.filter((r) => stillOpen(r, now));

    for (const room of candidates(this.rooms, wpm, now)) {
      const res = await reserveSeat(this.env, room.id, sub).catch(() => null);
      if (res?.ok) {
        this.rooms = this.rooms.map((r) => (r.id === room.id ? addToRoom(r, wpm) : r));
        return { roomId: room.id };
      }
      this.rooms = this.rooms.filter((r) => r.id !== room.id);
    }

    const id = newRoomId();
    const { autoStartAt } = await initRoom(this.env, id, "public", effectiveWpm(wpm));
    await reserveSeat(this.env, id, sub);
    this.rooms.push({
      id,
      wpm: effectiveWpm(wpm),
      seated: 1,
      createdAt: now,
      closesAt: autoStartAt ?? now,
    });
    return { roomId: id };
  }
}
