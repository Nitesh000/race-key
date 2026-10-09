import "server-only";
import { profiles, raceResults, users } from "@race-key/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";

export async function getProfileByName(name: string) {
  const db = getDb();
  const [row] = await db
    .select({ profile: profiles, isAnonymous: users.isAnonymous, joined: users.createdAt })
    .from(profiles)
    .innerJoin(users, eq(users.id, profiles.userId))
    .where(sql`lower(${profiles.username}) = lower(${name})`)
    .limit(1);
  return row ?? null;
}

export async function getProfileSummary(userId: string) {
  const db = getDb();
  const mine = and(eq(raceResults.userId, userId), eq(raceResults.finished, true));
  const [all] = await db
    .select({
      races: sql<number>`count(*)::int`,
      avgWpm: sql<number>`coalesce(avg(${raceResults.wpm}), 0)::real`,
      bestWpm: sql<number>`coalesce(max(${raceResults.wpm}), 0)::real`,
      accuracy: sql<number>`coalesce(avg(${raceResults.accuracy}), 0)::real`,
      wins: sql<number>`count(*) filter (where ${raceResults.placement} = 1)::int`,
    })
    .from(raceResults)
    .where(mine);
  const recent = await db
    .select({ wpm: raceResults.wpm, accuracy: raceResults.accuracy, at: raceResults.createdAt })
    .from(raceResults)
    .where(mine)
    .orderBy(desc(raceResults.createdAt))
    .limit(10);
  const last10 = recent.length ? recent.reduce((a, r) => a + r.wpm, 0) / recent.length : 0;
  return { ...all!, last10, recent };
}
