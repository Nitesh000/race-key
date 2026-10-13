import { verifyTicket } from "@race-key/shared";
import { getServerByName, routePartykitRequest } from "partyserver";
import { z } from "zod";
import { sharedSecret, type Secrets } from "./env";
import { initRoom, newRoomId } from "./rooms";

export { Matchmaker } from "./matchmaker";
export { Presence } from "./presence";
export { RaceRoom } from "./race-room";

type WorkerEnv = Env & Secrets;

const createSchema = z.object({ wpm: z.number().positive().optional() });
const matchSchema = z.object({ sub: z.string().min(1).max(64), wpm: z.number().nonnegative() });

function authorized(req: Request, secret: string) {
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/health") return Response.json({ ok: true });

    const secret = sharedSecret(env);
    if (!secret) return Response.json({ error: "server is not configured" }, { status: 503 });

    if (req.method === "POST" && url.pathname.startsWith("/presence/")) {
      if (!authorized(req, secret))
        return Response.json({ error: "unauthorized" }, { status: 401 });
      const stub = await getServerByName(env.Presence, "global");
      return stub.fetch(new Request(`https://presence${url.pathname}`, req));
    }

    if (req.method === "POST" && (url.pathname === "/rooms" || url.pathname === "/match")) {
      if (!authorized(req, secret))
        return Response.json({ error: "unauthorized" }, { status: 401 });
      const body = await req.json().catch(() => ({}));
      if (url.pathname === "/rooms") {
        const { wpm } = createSchema.parse(body);
        return Response.json(await initRoom(env, newRoomId(), "private", wpm));
      }
      const parsed = matchSchema.safeParse(body);
      if (!parsed.success) return Response.json({ error: "bad request" }, { status: 400 });
      const mm = env.Matchmaker.get(env.Matchmaker.idFromName("global"));
      return Response.json(await mm.match(parsed.data.sub, parsed.data.wpm));
    }

    const res = await routePartykitRequest(req, env, {
      onBeforeConnect: async (r) => {
        const token = new URL(r.url).searchParams.get("ticket") ?? "";
        const ticket = await verifyTicket(token, secret);
        if (!ticket) return new Response("unauthorized", { status: 401 });
        const headers = new Headers(r.headers);
        headers.set("x-rk-player", JSON.stringify(ticket));
        return new Request(r, { headers });
      },
      onBeforeRequest: () => new Response("not found", { status: 404 }),
    });
    return res ?? new Response("not found", { status: 404 });
  },
} satisfies ExportedHandler<WorkerEnv>;
