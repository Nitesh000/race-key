import { verifyTicket } from "@race-key/shared";
import { getServerByName, routePartykitRequest } from "partyserver";
import { sharedSecret, type Secrets } from "./env";

export { RaceRoom } from "./race-room";

type WorkerEnv = Env & Secrets;

function roomId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("");
}

async function createRoom(req: Request, env: WorkerEnv, secret: string) {
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { kind?: string; wpm?: number };
  const id = roomId();
  const stub = await getServerByName(env.RaceRoom, id);
  return stub.fetch("https://room/init", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind: body.kind ?? "private", wpm: body.wpm }),
  });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/health") return Response.json({ ok: true });

    const secret = sharedSecret(env);
    if (!secret) return Response.json({ error: "server is not configured" }, { status: 503 });

    if (url.pathname === "/rooms" && req.method === "POST") return createRoom(req, env, secret);

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
