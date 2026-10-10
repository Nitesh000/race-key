import { getProfileSummary } from "@/features/profile/queries";
import { getViewer } from "@/lib/session";
import { createRoom } from "@/lib/realtime";

export async function POST() {
  const viewer = await getViewer();
  const wpm = viewer ? (await getProfileSummary(viewer.id)).last10 || undefined : undefined;
  try {
    return Response.json(await createRoom({ kind: "private", wpm }));
  } catch (e) {
    console.error("could not create a room", e);
    return Response.json({ error: "The race server is not reachable." }, { status: 502 });
  }
}
