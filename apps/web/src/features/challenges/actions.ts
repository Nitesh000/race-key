"use server";

import { challenges, profiles } from "@race-key/db";
import { and, eq, gt, isNull, ne, or } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { createPrivateRoom, notifyUser } from "@/lib/realtime";
import { getViewer } from "@/lib/session";

const CHALLENGE_TTL_MS = 60_000;

export type ChallengeResult =
  { ok: true; roomId: string; id: string } | { ok: false; error: string };

export async function createChallenge(toUserId: string | null): Promise<ChallengeResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Play a race first or sign in." };
  const to = toUserId === null ? null : z.string().min(1).parse(toUserId);
  if (to === viewer.id) return { ok: false, error: "You can't challenge yourself." };
  const db = getDb();
  if (to) {
    const [target] = await db.select().from(profiles).where(eq(profiles.userId, to));
    if (!target) return { ok: false, error: "That player doesn't exist." };
  }
  let roomId: string;
  try {
    ({ roomId } = await createPrivateRoom());
  } catch {
    return { ok: false, error: "The race server is not reachable." };
  }
  const id = crypto.randomUUID().slice(0, 12);
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  await db
    .insert(challenges)
    .values({ id, fromUserId: viewer.id, toUserId: to, roomId, expiresAt });
  if (to) {
    await notifyUser(to, {
      t: "challenge",
      c: { id, from: viewer.profile.username, roomId, expiresAt: expiresAt.getTime() },
    });
  }
  return { ok: true, roomId, id };
}

export async function respondToChallenge(id: string, accept: boolean): Promise<ChallengeResult> {
  const viewer = await getViewer();
  if (!viewer) return { ok: false, error: "Play a race first or sign in." };
  const db = getDb();
  const [row] = await db
    .update(challenges)
    .set({ status: accept ? "accepted" : "declined" })
    .where(
      and(
        eq(challenges.id, z.string().min(1).parse(id)),
        eq(challenges.status, "pending"),
        gt(challenges.expiresAt, new Date()),
        or(eq(challenges.toUserId, viewer.id), isNull(challenges.toUserId)),
        ne(challenges.fromUserId, viewer.id),
      ),
    )
    .returning();
  if (!row) return { ok: false, error: "This challenge has expired or was already answered." };
  await notifyUser(row.fromUserId, { t: "challenge-closed", id: row.id });
  return { ok: true, roomId: row.roomId, id: row.id };
}
