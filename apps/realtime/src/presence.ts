import { ticketSchema, type PresenceMessage, type PresenceStatus } from "@race-key/shared";
import { Server, type Connection, type ConnectionContext } from "partyserver";
import { z } from "zod";
import { readPlayer, type Secrets } from "./env";

type ConnState = { uid: string };

export const RACING_TTL_MS = 15 * 60 * 1000;

const statusSchema = z.object({ ids: z.array(z.string().min(1)).max(500) });
const notifySchema = z.object({ uid: z.string().min(1), message: z.unknown() });
const activitySchema = z.object({ uids: z.array(z.string().min(1)).max(10), racing: z.boolean() });

export class Presence extends Server<Env & Secrets> {
  static override options = { hibernate: true };

  override onStart() {
    this.ctx.storage.sql.exec(
      "create table if not exists racing (uid text primary key, until integer not null)",
    );
  }

  override onConnect(conn: Connection<ConnState>, ctx: ConnectionContext) {
    const parsed = ticketSchema.safeParse(readPlayer(ctx.request));
    if (!parsed.success || !parsed.data.uid) {
      conn.close(4401, "unauthorized");
      return;
    }
    conn.setState({ uid: parsed.data.uid });
  }

  override onMessage() {}

  override async onRequest(req: Request) {
    const url = new URL(req.url);
    const body = await req.json().catch(() => null);
    if (url.pathname.endsWith("/status")) {
      const { ids } = statusSchema.parse(body);
      return Response.json(this.statuses(ids));
    }
    if (url.pathname.endsWith("/notify")) {
      const { uid, message } = notifySchema.parse(body);
      let delivered = 0;
      for (const conn of this.getConnections<ConnState>()) {
        if (conn.state?.uid !== uid) continue;
        conn.send(JSON.stringify(message as PresenceMessage));
        delivered++;
      }
      return Response.json({ delivered });
    }
    if (url.pathname.endsWith("/activity")) {
      const { uids, racing } = activitySchema.parse(body);
      for (const uid of uids) {
        if (racing) {
          this.ctx.storage.sql.exec(
            "insert into racing (uid, until) values (?, ?) on conflict (uid) do update set until = excluded.until",
            uid,
            Date.now() + RACING_TTL_MS,
          );
        } else {
          this.ctx.storage.sql.exec("delete from racing where uid = ?", uid);
        }
      }
      return Response.json({ ok: true });
    }
    return new Response("not found", { status: 404 });
  }

  private statuses(ids: string[]): Record<string, PresenceStatus> {
    const online = new Set<string>();
    for (const conn of this.getConnections<ConnState>()) {
      if (conn.state?.uid) online.add(conn.state.uid);
    }
    const now = Date.now();
    this.ctx.storage.sql.exec("delete from racing where until < ?", now);
    const racing = new Set(
      this.ctx.storage.sql
        .exec<{ uid: string }>("select uid from racing")
        .toArray()
        .map((r) => r.uid),
    );
    return Object.fromEntries(
      ids.map((id) => [id, racing.has(id) ? "racing" : online.has(id) ? "online" : "offline"]),
    );
  }
}
