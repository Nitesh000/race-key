"use server";

import { friendships, profiles } from "@race-key/db";
import { and, eq, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getViewer } from "@/lib/session";

export type FriendResult = { ok: true } | { ok: false; error: string };

async function requireAccount() {
  const viewer = await getViewer();
  if (!viewer || viewer.isGuest) throw new Error("Sign up to add friends.");
  return viewer;
}

function pair(a: string, b: string) {
  return or(
    and(eq(friendships.requesterId, a), eq(friendships.addresseeId, b)),
    and(eq(friendships.requesterId, b), eq(friendships.addresseeId, a)),
  );
}

export async function sendFriendRequest(username: string): Promise<FriendResult> {
  const viewer = await requireAccount();
  const name = z.string().min(1).max(32).parse(username.trim());
  const db = getDb();
  const [target] = await db
    .select({ id: profiles.userId })
    .from(profiles)
    .where(sql`lower(${profiles.username}) = lower(${name})`);
  if (!target) return { ok: false, error: `No player called ${name}.` };
  if (target.id === viewer.id) return { ok: false, error: "That's you." };

  const [existing] = await db.select().from(friendships).where(pair(viewer.id, target.id));
  if (existing?.status === "accepted") return { ok: false, error: "You're already friends." };
  if (existing && existing.requesterId === target.id) {
    await db
      .update(friendships)
      .set({ status: "accepted", acceptedAt: new Date() })
      .where(pair(viewer.id, target.id));
  } else if (!existing) {
    await db.insert(friendships).values({ requesterId: viewer.id, addresseeId: target.id });
  }
  revalidatePath("/friends");
  return { ok: true };
}

export async function acceptFriend(requesterId: string): Promise<FriendResult> {
  const viewer = await requireAccount();
  await getDb()
    .update(friendships)
    .set({ status: "accepted", acceptedAt: new Date() })
    .where(
      and(
        eq(friendships.requesterId, z.string().parse(requesterId)),
        eq(friendships.addresseeId, viewer.id),
        eq(friendships.status, "pending"),
      ),
    );
  revalidatePath("/friends");
  return { ok: true };
}

export async function removeFriend(otherId: string): Promise<FriendResult> {
  const viewer = await requireAccount();
  await getDb()
    .delete(friendships)
    .where(pair(viewer.id, z.string().parse(otherId)));
  revalidatePath("/friends");
  return { ok: true };
}
