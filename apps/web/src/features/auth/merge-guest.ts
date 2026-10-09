import "server-only";
import {
  coinLedger,
  emojiLoadouts,
  favouritePassages,
  playerKeyStats,
  playerStatsDaily,
  profiles,
  raceResults,
  userAchievements,
  userEmojis,
  userSkins,
  userThemes,
  type Db,
} from "@race-key/db";
import { eq, sql } from "drizzle-orm";

export async function mergeGuestInto(db: Db, guestId: string, userId: string) {
  const [guest] = await db.select().from(profiles).where(eq(profiles.userId, guestId));
  if (!guest) return;

  await db.update(raceResults).set({ userId }).where(eq(raceResults.userId, guestId));
  await db.update(coinLedger).set({ userId }).where(eq(coinLedger.userId, guestId));

  for (const table of [userSkins, userThemes, userAchievements, userEmojis, favouritePassages]) {
    await db.execute(
      sql`update ${table} set user_id = ${userId} where user_id = ${guestId} and not exists (
        select 1 from ${table} t2 where t2.user_id = ${userId}
      )`,
    );
  }

  await db.execute(sql`
    insert into ${playerStatsDaily} as d
      select ${userId}, day, races, real_races, wins, real_wins, podiums, wpm_sum, best_wpm,
             accuracy_sum, chars, errors, time_ms, hours
      from ${playerStatsDaily} where user_id = ${guestId}
    on conflict (user_id, day) do update set
      races = d.races + excluded.races,
      real_races = d.real_races + excluded.real_races,
      wins = d.wins + excluded.wins,
      real_wins = d.real_wins + excluded.real_wins,
      podiums = d.podiums + excluded.podiums,
      wpm_sum = d.wpm_sum + excluded.wpm_sum,
      best_wpm = greatest(d.best_wpm, excluded.best_wpm),
      accuracy_sum = d.accuracy_sum + excluded.accuracy_sum,
      chars = d.chars + excluded.chars,
      errors = d.errors + excluded.errors,
      time_ms = d.time_ms + excluded.time_ms
  `);

  await db.execute(sql`
    insert into ${playerKeyStats} as k
      select ${userId}, kind, key, hits, misses, total_ms
      from ${playerKeyStats} where user_id = ${guestId}
    on conflict (user_id, kind, key) do update set
      hits = k.hits + excluded.hits,
      misses = k.misses + excluded.misses,
      total_ms = k.total_ms + excluded.total_ms
  `);

  const [loadout] = await db.select().from(emojiLoadouts).where(eq(emojiLoadouts.userId, userId));
  if (!loadout)
    await db.update(emojiLoadouts).set({ userId }).where(eq(emojiLoadouts.userId, guestId));

  await db
    .update(profiles)
    .set({
      xp: sql`${profiles.xp} + ${guest.xp}`,
      coins: sql`${profiles.coins} + ${guest.coins}`,
      races: sql`${profiles.races} + ${guest.races}`,
      wins: sql`${profiles.wins} + ${guest.wins}`,
      bestWpm: sql`greatest(${profiles.bestWpm}, ${guest.bestWpm})`,
      bestWinStreak: sql`greatest(${profiles.bestWinStreak}, ${guest.bestWinStreak})`,
      level: sql`greatest(${profiles.level}, ${guest.level})`,
    })
    .where(eq(profiles.userId, userId));
}
