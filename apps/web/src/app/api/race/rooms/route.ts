import { raceIdentity } from "@/features/race/player-identity";
import { createPrivateRoom } from "@/lib/realtime";

export async function POST() {
  const identity = await raceIdentity();
  try {
    return Response.json(await createPrivateRoom(identity?.wpm || undefined));
  } catch (e) {
    console.error("could not create a room", e);
    return Response.json({ error: "The race server is not reachable." }, { status: 502 });
  }
}
