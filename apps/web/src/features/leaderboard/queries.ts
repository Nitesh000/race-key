import "server-only";
import { profiles, raceResults, users } from "@race-key/db";
import { and, eq, gte, isNotNull, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { getDb } from "@/lib/db";

export type Board = "daily" | "weekly" | "all";

export type LeaderboardRow = {
  username: string;
  level: number;
  skin: string;
  guest: boolean;
  wpm: number;
  accuracy: number;
  races: number;
};

function windowStart(board: Board) {
  if (board === "all") return null;
  return new Date(Date.now() - (board === "daily" ? 1 : 7) * 86_400_000);
}

function clean(from: Date | null) {
  return and(
    isNotNull(raceResults.userId),
    eq(raceResults.isBot, false),
    eq(raceResults.finished, true),
    eq(raceResults.flagged, false),
    from ? gte(raceResults.createdAt, from) : undefined,
  );
}

async function load(board: Board, limit: number): Promise<LeaderboardRow[]> {
  const db = getDb();
  const ranked = db
    .select({
      userId: raceResults.userId,
      wpm: raceResults.wpm,
      accuracy: raceResults.accuracy,
      rank: sql<number>`row_number() over (partition by ${raceResults.userId} order by ${raceResults.wpm} desc)`.as(
        "rank",
      ),
      raceCount: sql<number>`count(*) over (partition by ${raceResults.userId})`.as("race_count"),
    })
    .from(raceResults)
    .where(clean(windowStart(board)))
    .as("ranked");
  const rows = await db
    .select({
      username: profiles.username,
      level: profiles.level,
      skin: profiles.equippedSkinId,
      guest: users.isAnonymous,
      wpm: ranked.wpm,
      accuracy: ranked.accuracy,
      races: ranked.raceCount,
    })
    .from(ranked)
    .innerJoin(profiles, eq(profiles.userId, ranked.userId))
    .innerJoin(users, eq(users.id, ranked.userId))
    .where(eq(ranked.rank, 1))
    .orderBy(sql`${ranked.wpm} desc`)
    .limit(limit);
  return rows.map((r) => ({ ...r, guest: !!r.guest, races: Number(r.races) }));
}

export const getLeaderboard = unstable_cache(load, ["leaderboard"], { revalidate: 60 });

async function loadPassageBest(passageId: string): Promise<LeaderboardRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      username: profiles.username,
      level: profiles.level,
      skin: profiles.equippedSkinId,
      guest: users.isAnonymous,
      wpm: sql<number>`max(${raceResults.wpm})::real`,
      accuracy: sql<number>`max(${raceResults.accuracy})::real`,
      races: sql<number>`count(*)::int`,
    })
    .from(raceResults)
    .innerJoin(profiles, eq(profiles.userId, raceResults.userId))
    .innerJoin(users, eq(users.id, raceResults.userId))
    .where(and(clean(null), eq(raceResults.passageId, passageId)))
    .groupBy(profiles.username, profiles.level, profiles.equippedSkinId, users.isAnonymous)
    .orderBy(sql`max(${raceResults.wpm}) desc`)
    .limit(10);
  return rows.map((r) => ({ ...r, guest: !!r.guest }));
}

export const getPassageBest = unstable_cache(loadPassageBest, ["passage-best"], { revalidate: 60 });
