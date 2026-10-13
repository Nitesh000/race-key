import "server-only";
import {
  authors,
  books,
  friendships,
  passages,
  playerKeyStats,
  playerStatsDaily,
  profiles,
  raceKeystrokes,
  raceResults,
} from "@race-key/db";
import { getPassage } from "@race-key/passages";
import { analyzeKeystrokes, unpackKeystrokes } from "@race-key/shared";
import { and, desc, eq, gt, gte, inArray, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb } from "@/lib/db";

export type Period = "7d" | "30d" | "all";
export type StatsFilter = { period: Period; realOnly: boolean };

function since(period: Period) {
  if (period === "all") return null;
  return new Date(Date.now() - (period === "7d" ? 7 : 30) * 86_400_000);
}

function resultFilter(userId: string, f: StatsFilter) {
  const from = since(f.period);
  return and(
    eq(raceResults.userId, userId),
    eq(raceResults.finished, true),
    eq(raceResults.flagged, false),
    from ? gte(raceResults.createdAt, from) : undefined,
    f.realOnly ? gt(raceResults.realOpponents, 0) : undefined,
  );
}

export async function getStats(userId: string, f: StatsFilter) {
  const db = getDb();
  const where = resultFilter(userId, f);
  const from = since(f.period);
  const dayFrom = from?.toISOString().slice(0, 10);

  const [
    [speed],
    recent,
    trend,
    [errorRate],
    keys,
    daily,
    favouriteBooks,
    favouriteAuthors,
    byDifficulty,
    logs,
    headToHead,
  ] = await Promise.all([
    db
      .select({
        races: sql<number>`count(*)::int`,
        avg: sql<number>`coalesce(avg(${raceResults.wpm}), 0)::real`,
        best: sql<number>`coalesce(max(${raceResults.wpm}), 0)::real`,
        median: sql<number>`coalesce(percentile_cont(0.5) within group (order by ${raceResults.wpm}), 0)::real`,
        consistency: sql<number>`coalesce(avg(${raceResults.consistency}), 0)::real`,
        accuracy: sql<number>`coalesce(avg(${raceResults.accuracy}), 0)::real`,
        wins: sql<number>`count(*) filter (where ${raceResults.placement} = 1 and ${raceResults.roomSize} > 1)::int`,
        podiums: sql<number>`count(*) filter (where ${raceResults.placement} <= 3 and ${raceResults.roomSize} > 1)::int`,
        realRaces: sql<number>`count(*) filter (where ${raceResults.realOpponents} > 0)::int`,
        realWins: sql<number>`count(*) filter (where ${raceResults.placement} = 1 and ${raceResults.realOpponents} > 0)::int`,
        chars: sql<number>`coalesce(sum(${raceResults.chars}), 0)::int`,
        timeMs: sql<number>`coalesce(sum(${raceResults.timeMs}), 0)::bigint`,
      })
      .from(raceResults)
      .where(where),
    db
      .select({ wpm: raceResults.wpm })
      .from(raceResults)
      .where(where)
      .orderBy(desc(raceResults.createdAt))
      .limit(100),
    db
      .select({
        day: sql<string>`to_char(${raceResults.createdAt}, 'YYYY-MM-DD')`,
        wpm: sql<number>`avg(${raceResults.wpm})::real`,
        races: sql<number>`count(*)::int`,
      })
      .from(raceResults)
      .where(
        and(where, gte(raceResults.createdAt, from ?? new Date(Date.now() - 365 * 86_400_000))),
      )
      .groupBy(sql`1`)
      .orderBy(sql`1`),
    db
      .select({
        per100: sql<number>`coalesce(sum(${raceResults.errors})::real / nullif(sum(${raceResults.chars}), 0) * 100, 0)::real`,
      })
      .from(raceResults)
      .where(where),
    db.select().from(playerKeyStats).where(eq(playerKeyStats.userId, userId)),
    db
      .select()
      .from(playerStatsDaily)
      .where(
        and(
          eq(playerStatsDaily.userId, userId),
          dayFrom ? gte(playerStatsDaily.day, dayFrom) : undefined,
        ),
      )
      .orderBy(playerStatsDaily.day),
    db
      .select({ title: books.title, races: sql<number>`count(*)::int` })
      .from(raceResults)
      .innerJoin(passages, eq(passages.id, raceResults.passageId))
      .innerJoin(books, eq(books.id, passages.bookId))
      .where(where)
      .groupBy(books.title)
      .orderBy(desc(sql`2`))
      .limit(5),
    db
      .select({ name: authors.name, races: sql<number>`count(*)::int` })
      .from(raceResults)
      .innerJoin(passages, eq(passages.id, raceResults.passageId))
      .innerJoin(books, eq(books.id, passages.bookId))
      .innerJoin(authors, eq(authors.id, books.authorId))
      .where(where)
      .groupBy(authors.name)
      .orderBy(desc(sql`2`))
      .limit(5),
    db
      .select({
        difficulty: passages.difficulty,
        best: sql<number>`max(${raceResults.wpm})::real`,
        avg: sql<number>`avg(${raceResults.wpm})::real`,
      })
      .from(raceResults)
      .innerJoin(passages, eq(passages.id, raceResults.passageId))
      .where(where)
      .groupBy(passages.difficulty)
      .orderBy(passages.difficulty),
    db
      .select({ data: raceKeystrokes.data, passageId: raceResults.passageId })
      .from(raceKeystrokes)
      .innerJoin(raceResults, eq(raceResults.id, raceKeystrokes.resultId))
      .where(where)
      .orderBy(desc(raceResults.createdAt))
      .limit(50),
    headToHeadRecords(userId, f),
  ]);

  const fixes: number[] = [];
  for (const log of logs) {
    const passage = getPassage(log.passageId);
    if (!passage) continue;
    try {
      fixes.push(...analyzeKeystrokes(passage.text, unpackKeystrokes(log.data)).fixMs);
    } catch {
      continue;
    }
  }

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const wpms = recent.map((r) => r.wpm);
  const totals = {
    races: speed!.races,
    realRaces: speed!.realRaces,
    wins: speed!.wins,
    realWins: speed!.realWins,
    podiums: speed!.podiums,
    chars: speed!.chars,
    timeMs: Number(speed!.timeMs),
  };
  const hours = Array.from({ length: 24 }, (_, h) =>
    daily.reduce((a, d) => a + (d.hours[h] ?? 0), 0),
  );

  return {
    speed: {
      last10: avg(wpms.slice(0, 10)),
      last100: avg(wpms),
      ...speed!,
    },
    trend,
    accuracy: {
      overall: speed!.accuracy,
      errorsPer100: errorRate!.per100,
      fixMs: fixes.length ? avg(fixes) : null,
    },
    keys: keys.map((k) => ({
      kind: k.kind,
      key: k.key,
      hits: k.hits,
      misses: k.misses,
      avgMs: k.hits ? k.totalMs / k.hits : 0,
    })),
    races: totals,
    habits: {
      days: daily.map((d) => ({ day: d.day, races: d.races })),
      hours,
      activeDays: daily.length,
    },
    books: { favouriteBooks, favouriteAuthors, byDifficulty },
    headToHead,
  };
}

async function headToHeadRecords(userId: string, f: StatsFilter) {
  const db = getDb();
  const friendRows = await db
    .select({ a: friendships.requesterId, b: friendships.addresseeId })
    .from(friendships)
    .where(
      and(
        eq(friendships.status, "accepted"),
        or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
      ),
    );
  const friendIds = friendRows.map((r) => (r.a === userId ? r.b : r.a));
  if (friendIds.length === 0) return [];
  const from = since(f.period);
  const me = alias(raceResults, "me");
  const them = alias(raceResults, "them");
  return db
    .select({
      username: profiles.username,
      wins: sql<number>`count(*) filter (where ${me.placement} < ${them.placement})::int`,
      losses: sql<number>`count(*) filter (where ${me.placement} > ${them.placement})::int`,
    })
    .from(me)
    .innerJoin(them, and(eq(them.raceId, me.raceId), inArray(them.userId, friendIds)))
    .innerJoin(profiles, eq(profiles.userId, them.userId))
    .where(and(eq(me.userId, userId), from ? gte(me.createdAt, from) : undefined))
    .groupBy(profiles.username)
    .orderBy(profiles.username);
}

export type Stats = Awaited<ReturnType<typeof getStats>>;
