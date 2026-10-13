import "server-only";
import { friendships, profiles } from "@race-key/db";
import { and, eq, or, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { presenceStatus } from "@/lib/realtime";

export type FriendRelation = "none" | "friends" | "outgoing" | "incoming" | "self";

export async function relationTo(viewerId: string, otherId: string): Promise<FriendRelation> {
  if (viewerId === otherId) return "self";
  const [row] = await getDb()
    .select()
    .from(friendships)
    .where(
      or(
        and(eq(friendships.requesterId, viewerId), eq(friendships.addresseeId, otherId)),
        and(eq(friendships.requesterId, otherId), eq(friendships.addresseeId, viewerId)),
      ),
    );
  if (!row) return "none";
  if (row.status === "accepted") return "friends";
  return row.requesterId === viewerId ? "outgoing" : "incoming";
}

export async function getFriends(viewerId: string) {
  const db = getDb();
  const other = sql<string>`case when ${friendships.requesterId} = ${viewerId} then ${friendships.addresseeId} else ${friendships.requesterId} end`;
  const rows = await db
    .select({
      id: profiles.userId,
      username: profiles.username,
      level: profiles.level,
      skin: profiles.equippedSkinId,
      bestWpm: profiles.bestWpm,
      status: friendships.status,
      requesterId: friendships.requesterId,
    })
    .from(friendships)
    .innerJoin(profiles, eq(profiles.userId, other))
    .where(or(eq(friendships.requesterId, viewerId), eq(friendships.addresseeId, viewerId)))
    .orderBy(profiles.username);

  const friends = rows.filter((r) => r.status === "accepted");
  const presence = await presenceStatus(friends.map((f) => f.id));
  const rank = { racing: 0, online: 1, offline: 2 } as const;
  return {
    friends: friends
      .map((f) => ({ ...f, presence: presence[f.id] ?? "offline" }))
      .sort((a, b) => rank[a.presence] - rank[b.presence]),
    incoming: rows.filter((r) => r.status === "pending" && r.requesterId !== viewerId),
    outgoing: rows.filter((r) => r.status === "pending" && r.requesterId === viewerId),
  };
}
