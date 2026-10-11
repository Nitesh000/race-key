import { raceIdentity } from "@/features/race/player-identity";
import { findPublicRoom } from "@/lib/realtime";

export async function POST() {
  const identity = await raceIdentity();
  if (!identity)
    return Response.json({ error: "Sign in or play as a guest first." }, { status: 401 });
  try {
    return Response.json(await findPublicRoom(identity.sub, identity.wpm));
  } catch (e) {
    console.error("matchmaking failed", e);
    return Response.json({ error: "The race server is not reachable." }, { status: 502 });
  }
}
