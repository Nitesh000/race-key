import "server-only";
import { randomName, type Ticket } from "@race-key/shared";
import { cookies } from "next/headers";
import { getProfileSummary } from "@/features/profile/queries";
import { authEnabled } from "@/lib/auth";
import { getViewer } from "@/lib/session";

const GUEST_ID = "rk-guest-id";
const GUEST_NAME = "rk-guest-name";

export type Identity = Omit<Ticket, "exp">;

export async function raceIdentity(): Promise<Identity | null> {
  if (authEnabled()) {
    const viewer = await getViewer();
    if (!viewer) return null;
    const { last10 } = await getProfileSummary(viewer.id);
    return {
      sub: viewer.id,
      uid: viewer.id,
      name: viewer.profile.username,
      level: viewer.profile.level,
      skin: viewer.profile.equippedSkinId,
      wpm: Math.round(last10),
    };
  }
  const jar = await cookies();
  let sub = jar.get(GUEST_ID)?.value;
  let name = jar.get(GUEST_NAME)?.value;
  if (!sub || !name) {
    sub = `g_${crypto.randomUUID()}`;
    name = randomName();
    const opts = {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax" as const,
      httpOnly: true,
    };
    jar.set(GUEST_ID, sub, opts);
    jar.set(GUEST_NAME, name, opts);
  }
  return { sub, uid: null, name, level: 1, skin: "hatchback", wpm: 0 };
}
