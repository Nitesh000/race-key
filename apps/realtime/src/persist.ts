import {
  chatReports,
  coinLedger,
  passages,
  profiles,
  raceResults,
  races,
  userAchievements,
  type AnyDb,
} from "@race-key/db";
import {
  DAILY_BONUS,
  achievements,
  consistency,
  earnedAchievements,
  levelForXp,
  raceReward,
  round1,
  type RewardSummary,
} from "@race-key/shared";
import { and, countDistinct, eq, sql } from "drizzle-orm";
import type { RoomData } from "./room/state";

export type PlayerRewards = RewardSummary;

export async function persistRace(db: AnyDb, data: RoomData) {
  const rewards = new Map<string, PlayerRewards>();
  if (!data.results || data.startsAt === null) return null;
  const players = new Map(data.players.map((p) => [p.id, p]));
  const isBot = (id: string) => !!players.get(id)?.bot;
  const realPlayers = data.results.filter((r) => !isBot(r.id)).length;
  const botPlayers = data.results.length - realPlayers;

  const inserted = await db
    .insert(races)
    .values({
      id: data.raceId,
      passageId: data.passage.id,
      kind: data.kind,
      realPlayers,
      botPlayers,
      startedAt: new Date(data.startsAt),
      finishedAt: new Date(data.endedAt ?? Date.now()),
    })
    .onConflictDoNothing()
    .returning({ id: races.id });
  if (inserted.length === 0) return null;

  const rows = await db
    .insert(raceResults)
    .values(
      data.results.map((r) => {
        const p = players.get(r.id);
        const bot = isBot(r.id);
        const samples = p?.stats?.samples ?? [];
        return {
          raceId: data.raceId,
          userId: p?.uid ?? null,
          isBot: bot,
          displayName: r.name,
          passageId: data.passage.id,
          placement: r.place,
          finished: r.finished,
          wpm: r.wpm,
          rawWpm: round1(p?.stats?.rawWpm ?? r.wpm),
          accuracy: r.accuracy,
          timeMs: r.timeMs,
          chars: p?.pos ?? 0,
          errors: p?.stats?.errors ?? 0,
          roomSize: data.results!.length,
          realOpponents: realPlayers - (bot ? 0 : 1),
          botOpponents: botPlayers - (bot ? 1 : 0),
          samples,
          consistency: consistency(samples),
          flagged: !!p?.flags.length,
          flagReason: p?.flags.length ? p.flags.join(",") : null,
        };
      }),
    )
    .returning({ id: raceResults.id, placement: raceResults.placement });
  const rowByPlace = new Map(rows.map((r) => [r.placement, r.id]));

  for (const r of data.results) {
    const p = players.get(r.id);
    const uid = p?.uid;
    if (!p || !uid || p.bot) continue;
    const flagged = p.flags.length > 0;
    const clean = r.finished && !flagged;
    const won = r.place === 1 && clean && data.results.length > 1;

    const [profile] = await db
      .update(profiles)
      .set({
        races: sql`${profiles.races} + 1`,
        wins: sql`${profiles.wins} + ${won ? 1 : 0}`,
        winStreak: won ? sql`${profiles.winStreak} + 1` : 0,
        bestWinStreak: won
          ? sql`greatest(${profiles.bestWinStreak}, ${profiles.winStreak} + 1)`
          : sql`${profiles.bestWinStreak}`,
        bestWpm: clean ? sql`greatest(${profiles.bestWpm}, ${r.wpm})` : sql`${profiles.bestWpm}`,
        lastSeenAt: new Date(),
      })
      .where(eq(profiles.userId, uid))
      .returning();
    if (!profile) continue;

    const reward = raceReward({
      finished: r.finished,
      flagged,
      wpm: r.wpm,
      accuracy: r.accuracy,
      chars: p.pos,
      placement: r.place,
      realOpponents: realPlayers - 1,
      botOpponents: botPlayers,
      winStreak: profile.winStreak,
    });

    const daily =
      clean &&
      (
        await db
          .update(profiles)
          .set({ lastDailyBonusAt: new Date() })
          .where(
            and(
              eq(profiles.userId, uid),
              sql`(${profiles.lastDailyBonusAt} is null or ${profiles.lastDailyBonusAt}::date < now()::date)`,
            ),
          )
          .returning({ id: profiles.userId })
      ).length > 0;

    const coins = reward.coins + (daily ? DAILY_BONUS.coins : 0);
    const xp = reward.xp + (daily ? DAILY_BONUS.xp : 0);
    let balance = profile.coins;
    let totalXp = profile.xp;
    if (coins > 0 || xp > 0) {
      const [after] = await db
        .update(profiles)
        .set({ coins: sql`${profiles.coins} + ${coins}`, xp: sql`${profiles.xp} + ${xp}` })
        .where(eq(profiles.userId, uid))
        .returning({ coins: profiles.coins, xp: profiles.xp });
      balance = after!.coins;
      totalXp = after!.xp;
      const entries = [];
      if (reward.coins > 0) {
        entries.push({ userId: uid, delta: reward.coins, reason: "race", refId: data.raceId });
      }
      if (daily) {
        entries.push({
          userId: uid,
          delta: DAILY_BONUS.coins,
          reason: "daily-bonus",
          refId: data.raceId,
        });
      }
      let running = balance - coins;
      if (entries.length) {
        await db.insert(coinLedger).values(
          entries.map((e) => {
            running += e.delta;
            return { ...e, balance: running };
          }),
        );
      }
    }

    const level = levelForXp(totalXp);
    if (level !== profile.level) {
      await db.update(profiles).set({ level }).where(eq(profiles.userId, uid));
    }

    const rowId = rowByPlace.get(r.place);
    if (rowId) {
      await db
        .update(raceResults)
        .set({ coinsEarned: reward.coins, xpEarned: reward.xp })
        .where(eq(raceResults.id, rowId));
    }

    const unlocked = await unlockAchievements(db, uid, {
      wins: profile.wins,
      winStreak: profile.winStreak,
      level,
      last: clean ? { finished: true, wpm: r.wpm, accuracy: r.accuracy, chars: p.pos } : null,
    });
    for (const a of unlocked) balance = a.balance;

    rewards.set(p.id, {
      coins: coins + unlocked.reduce((sum, a) => sum + a.coins, 0),
      xp,
      multiplier: reward.multiplier,
      daily,
      level,
      leveledUp: level > profile.level,
      balance,
      achievements: unlocked.map((a) => a.id),
    });
  }
  return rewards;
}

async function unlockAchievements(
  db: AnyDb,
  uid: string,
  ctx: {
    wins: number;
    winStreak: number;
    level: number;
    last: { finished: boolean; wpm: number; accuracy: number; chars: number } | null;
  },
) {
  const clean = and(
    eq(raceResults.userId, uid),
    eq(raceResults.finished, true),
    eq(raceResults.flagged, false),
  );
  const [counts] = await db
    .select({
      finished: sql<number>`count(*)::int`,
      books: countDistinct(passages.bookId),
    })
    .from(raceResults)
    .innerJoin(passages, eq(passages.id, raceResults.passageId))
    .where(clean);

  const earned = earnedAchievements({
    finishedRaces: counts?.finished ?? 0,
    books: counts?.books ?? 0,
    ...ctx,
  });
  if (earned.length === 0) return [];

  const fresh = await db
    .insert(userAchievements)
    .values(earned.map((achievementId) => ({ userId: uid, achievementId })))
    .onConflictDoNothing()
    .returning({ id: userAchievements.achievementId });

  const out: { id: string; coins: number; balance: number }[] = [];
  for (const { id } of fresh) {
    const coins = achievements.find((a) => a.id === id)?.rewardCoins ?? 0;
    const [after] = await db
      .update(profiles)
      .set({ coins: sql`${profiles.coins} + ${coins}` })
      .where(eq(profiles.userId, uid))
      .returning({ coins: profiles.coins });
    await db.insert(coinLedger).values({
      userId: uid,
      delta: coins,
      balance: after!.coins,
      reason: `achievement:${id}`,
    });
    out.push({ id, coins, balance: after!.coins });
  }
  return out;
}

export async function reportChat(
  db: AnyDb,
  report: {
    reporterId: string | null;
    reportedName: string;
    reportedUserId: string | null;
    roomId: string;
    message: string;
  },
) {
  await db.insert(chatReports).values(report);
}
