import { signTicket } from "@race-key/shared";
import { raceIdentity } from "@/features/race/player-identity";
import { realtimeSecret } from "@/lib/realtime";

export async function GET() {
  const secret = realtimeSecret();
  if (!secret) return Response.json({ error: "racing is not configured" }, { status: 503 });
  const identity = await raceIdentity();
  if (!identity)
    return Response.json({ error: "sign in or play as a guest first" }, { status: 401 });
  const ticket = await signTicket(identity, secret);
  return Response.json({ ticket }, { headers: { "cache-control": "no-store" } });
}
