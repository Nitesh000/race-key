import { createDb } from "@race-key/db";
import { pickRacePassage } from "@race-key/passages/race";
import {
  PROGRESS_INTERVAL_MS,
  parseClientMessage,
  ticketSchema,
  type ServerMessage,
  type Ticket,
} from "@race-key/shared";
import { Server, type Connection, type ConnectionContext, type WSMessage } from "partyserver";
import { z } from "zod";
import type { Secrets } from "./env";
import { persistRace } from "./persist";
import { RaceState, type RoomData } from "./room/state";

type ConnState = { sub: string };

const IDLE_TTL_MS = 60 * 60 * 1000;

const initSchema = z.object({
  kind: z.enum(["public", "private"]),
  wpm: z.number().positive().optional(),
});

export class RaceRoom extends Server<Env & Secrets> {
  static override options = { hibernate: true };

  room: RaceState | null = null;
  private clock: ReturnType<typeof setInterval> | null = null;
  private sentPos = new Map<string, number>();

  override async onStart() {
    const data = await this.ctx.storage.get<RoomData>("room");
    if (data) this.room = new RaceState(data);
    this.schedule();
  }

  override async onRequest(req: Request) {
    const url = new URL(req.url);
    if (req.method === "POST" && url.pathname.endsWith("/init")) {
      if (this.room) return Response.json({ error: "exists" }, { status: 409 });
      const body = initSchema.parse(await req.json());
      this.room = RaceState.create({
        roomId: this.name,
        raceId: crypto.randomUUID(),
        kind: body.kind,
        passage: pickRacePassage({ wpm: body.wpm }),
      });
      await this.save();
      return Response.json({ roomId: this.name });
    }
    return new Response("not found", { status: 404 });
  }

  override onConnect(conn: Connection<ConnState>, ctx: ConnectionContext) {
    const parsed = ticketSchema.safeParse(
      JSON.parse(ctx.request.headers.get("x-rk-player") ?? "null"),
    );
    if (!parsed.success) return this.reject(conn, "unauthorized", "Missing player ticket.");
    if (!this.room) return this.reject(conn, "not_found", "This room does not exist.");
    const ticket: Ticket = parsed.data;
    const now = Date.now();
    const res = this.room.join(ticket, now);
    if (!res.ok) return this.reject(conn, res.code, res.message);

    for (const other of this.getConnections<ConnState>()) {
      if (other.id !== conn.id && other.state?.sub === ticket.sub) other.close(4000, "replaced");
    }
    conn.setState({ sub: ticket.sub });
    this.send(conn, { t: "welcome", you: ticket.sub, room: this.room.snapshot(now), now });
    this.broadcastRoom([conn.id]);
    void this.save();
    this.schedule();
  }

  override onMessage(conn: Connection<ConnState>, raw: WSMessage) {
    const msg = parseClientMessage(raw);
    const sub = conn.state?.sub;
    if (!msg || !sub || !this.room) return;
    const now = Date.now();
    switch (msg.t) {
      case "ping":
        this.send(conn, { t: "pong", at: msg.at, now });
        return;
      case "progress":
        this.room.progress(sub, msg.pos);
        return;
      case "finish":
        if (this.room.finish(sub, msg.stats, now)) this.changed();
        return;
      case "start":
        if (this.room.start(sub, now)) this.changed();
        return;
      case "again":
        if (
          this.room.again(
            pickRacePassage({ exclude: new Set([this.room.data.passage.id]) }),
            crypto.randomUUID(),
          )
        ) {
          this.sentPos.clear();
          this.changed();
        }
        return;
    }
  }

  override onClose(conn: Connection<ConnState>) {
    const sub = conn.state?.sub;
    if (!sub || !this.room) return;
    const stillHere = [...this.getConnections<ConnState>()].some(
      (c) => c.id !== conn.id && c.state?.sub === sub,
    );
    if (!stillHere && this.room.disconnect(sub, Date.now())) this.changed();
  }

  override async onAlarm() {
    if ([...this.getConnections()].length > 0) {
      await this.ctx.storage.setAlarm(Date.now() + IDLE_TTL_MS);
      return;
    }
    await this.ctx.storage.deleteAll();
    this.room = null;
  }

  private loop() {
    if (!this.room) return;
    const now = Date.now();
    const { changed, ended } = this.room.tick(now);
    if (changed) this.changed();
    if (this.room.phase === "racing" || ended) this.broadcastTick(now);
    if (ended) this.onEnded();
  }

  private onEnded() {
    const room = this.room;
    const url = this.env.DATABASE_URL;
    if (!room || !url || room.data.persisted) return;
    room.data.persisted = true;
    const data = structuredClone(room.data);
    this.ctx.waitUntil(
      persistRace(createDb(url), data).catch((e) => {
        console.error(`could not save race ${data.raceId}`, e);
      }),
    );
  }

  private broadcastTick(now: number) {
    const entries = this.room!.tickEntries(now);
    const moved = entries.filter(([id, pos]) => this.sentPos.get(id) !== pos);
    if (moved.length === 0) return;
    for (const [id, pos] of moved) this.sentPos.set(id, pos);
    this.broadcast(JSON.stringify({ t: "tick", p: entries } satisfies ServerMessage));
  }

  private changed() {
    this.broadcastRoom();
    void this.save();
    this.schedule();
  }

  private broadcastRoom(without?: string[]) {
    if (!this.room) return;
    const now = Date.now();
    const msg: ServerMessage = { t: "room", room: this.room.snapshot(now), now };
    this.broadcast(JSON.stringify(msg), without);
  }

  private schedule() {
    const needs = !!this.room?.needsClock();
    if (needs && !this.clock) this.clock = setInterval(() => this.loop(), PROGRESS_INTERVAL_MS);
    if (!needs && this.clock) {
      clearInterval(this.clock);
      this.clock = null;
    }
  }

  private async save() {
    if (!this.room) return;
    await this.ctx.storage.put("room", this.room.data);
    await this.ctx.storage.setAlarm(Date.now() + IDLE_TTL_MS);
  }

  private send(conn: Connection, msg: ServerMessage) {
    conn.send(JSON.stringify(msg));
  }

  private reject(conn: Connection, code: string, message: string) {
    this.send(conn, { t: "error", code, message });
    conn.close(4400, code);
  }
}
