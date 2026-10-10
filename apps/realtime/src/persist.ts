import { profiles, raceResults, races, type AnyDb } from "@race-key/db";
import { consistency, round1 } from "@race-key/shared";
import { eq, sql } from "drizzle-orm";
import type { RoomData } from "./room/state";

export async function persistRace(db: AnyDb, data: RoomData) {
  if (!data.results || data.startsAt === null) return false;
  const players = new Map(data.players.map((p) => [p.id, p]));
  const realPlayers = data.results.length;

  const inserted = await db
    .insert(races)
    .values({
      id: data.raceId,
      passageId: data.passage.id,
      kind: data.kind,
      realPlayers,
      botPlayers: 0,
      startedAt: new Date(data.startsAt),
      finishedAt: new Date(data.endedAt ?? Date.now()),
    })
    .onConflictDoNothing()
    .returning({ id: races.id });
  if (inserted.length === 0) return false;

  await db.insert(raceResults).values(
    data.results.map((r) => {
      const p = players.get(r.id);
      const samples = p?.stats?.samples ?? [];
      return {
        raceId: data.raceId,
        userId: p?.uid ?? null,
        isBot: false,
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
        roomSize: realPlayers,
        realOpponents: realPlayers - 1,
        botOpponents: 0,
        samples,
        consistency: consistency(samples),
      };
    }),
  );

  for (const r of data.results) {
    const uid = players.get(r.id)?.uid;
    if (!uid) continue;
    const won = r.place === 1 && r.finished && realPlayers > 1;
    await db
      .update(profiles)
      .set({
        races: sql`${profiles.races} + 1`,
        wins: sql`${profiles.wins} + ${won ? 1 : 0}`,
        winStreak: won ? sql`${profiles.winStreak} + 1` : 0,
        bestWinStreak: won
          ? sql`greatest(${profiles.bestWinStreak}, ${profiles.winStreak} + 1)`
          : sql`${profiles.bestWinStreak}`,
        bestWpm: r.finished
          ? sql`greatest(${profiles.bestWpm}, ${r.wpm})`
          : sql`${profiles.bestWpm}`,
        lastSeenAt: new Date(),
      })
      .where(eq(profiles.userId, uid));
  }
  return true;
}
