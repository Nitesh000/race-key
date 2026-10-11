import { PGlite } from "@electric-sql/pglite";
import { passages } from "@race-key/passages";
import * as s from "@race-key/db/schema";
import { authors, books } from "@race-key/passages";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import { persistRace } from "./persist";
import { mulberry32 } from "@race-key/shared";
import { RaceState } from "./room/state";

const humanGaps = (n: number) => Array.from({ length: n }, (_, i) => 90 + ((i * 37) % 140));

const db = drizzle({ client: new PGlite(), schema: s, casing: "snake_case" });
const passage = passages[0]!;

beforeAll(async () => {
  await migrate(db, {
    migrationsFolder: new URL("../../../packages/db/migrations", import.meta.url).pathname,
  });
  const book = books.find((b) => b.id === passage.bookId)!;
  await db.insert(s.authors).values(authors.find((a) => a.id === book.authorId)!);
  await db.insert(s.books).values(book);
  await db.insert(s.passages).values({ ...passage, importedAt: new Date(passage.importedAt) });
  for (const id of ["u1", "u2"]) {
    await db.insert(s.users).values({ id, name: id, email: `${id}@example.com` });
    await db.insert(s.profiles).values({ userId: id, username: id });
  }
});

function finishedRace(raceId: string) {
  const room = RaceState.create({
    roomId: "room",
    raceId,
    kind: "private",
    passage: { id: passage.id, text: passage.text, title: "", author: "" },
    now: 0,
  });
  for (const id of ["u1", "u2", "guest"]) {
    room.join(
      { sub: id, uid: id === "guest" ? null : id, name: id, level: 1, skin: "hatchback", wpm: 50 },
      0,
    );
  }
  room.start("u1", 0);
  room.tick(5000);
  room.progress("u1", passage.text.length, 65_000);
  room.finish(
    "u1",
    {
      timeMs: 60_000,
      rawWpm: 70,
      accuracy: 0.97,
      errors: 4,
      samples: [50, 60, 62, 61],
      dts: humanGaps(passage.text.length),
    },
    65_000,
  );
  room.progress("u2", 40, 65_000);
  room.end(70_000);
  return room.data;
}

describe("persistRace", () => {
  it("writes the race, every result and updates profiles once", async () => {
    const data = finishedRace("race-1");
    expect(await persistRace(db, data)).toBe(true);
    expect(await persistRace(db, data)).toBe(false);

    const rows = await db.select().from(s.raceResults).where(eq(s.raceResults.raceId, "race-1"));
    expect(rows.map((r) => [r.displayName, r.placement, r.finished])).toEqual([
      ["u1", 1, true],
      ["u2", 2, false],
      ["guest", 3, false],
    ]);
    expect(rows[0]!.consistency).toBeGreaterThan(0.9);
    expect(rows[2]!.userId).toBeNull();

    const [p1] = await db.select().from(s.profiles).where(eq(s.profiles.userId, "u1"));
    const [p2] = await db.select().from(s.profiles).where(eq(s.profiles.userId, "u2"));
    expect([p1!.races, p1!.wins, p1!.winStreak]).toEqual([1, 1, 1]);
    expect(p1!.bestWpm).toBeCloseTo(rows[0]!.wpm, 1);
    expect([p2!.races, p2!.wins, p2!.bestWpm]).toEqual([1, 0, 0]);
  });

  it("builds a win streak and resets it on a loss", async () => {
    await persistRace(db, finishedRace("race-2"));
    let [p1] = await db.select().from(s.profiles).where(eq(s.profiles.userId, "u1"));
    expect([p1!.winStreak, p1!.bestWinStreak]).toEqual([2, 2]);
    const loss = finishedRace("race-3");
    loss.results!.forEach((r) => (r.finished = r.id !== "u1" ? r.finished : false));
    await persistRace(db, loss);
    [p1] = await db.select().from(s.profiles).where(eq(s.profiles.userId, "u1"));
    expect([p1!.winStreak, p1!.bestWinStreak]).toEqual([0, 2]);
  });

  it("marks bot rows and counts real and bot opponents", async () => {
    const room = RaceState.create(
      {
        roomId: "pub",
        raceId: "race-bots",
        kind: "public",
        passage: { id: passage.id, text: passage.text, title: "", author: "" },
        now: 0,
      },
      mulberry32(1),
    );
    room.reserve("u2", 0);
    room.join({ sub: "u2", uid: "u2", name: "u2", level: 1, skin: "hatchback", wpm: 50 }, 0);
    room.tick(room.data.autoStartAt!);
    const start = room.data.startsAt!;
    room.tick(start);
    room.progress("u2", passage.text.length, start + 30_000);
    room.finish(
      "u2",
      {
        timeMs: 30_000,
        rawWpm: 70,
        accuracy: 1,
        errors: 0,
        samples: [60, 60, 60],
        dts: humanGaps(passage.text.length),
      },
      start + 30_000,
    );
    room.tick(start + 30_100);
    await persistRace(db, room.data);

    const [race] = await db.select().from(s.races).where(eq(s.races.id, "race-bots"));
    expect([race!.kind, race!.realPlayers, race!.botPlayers]).toEqual(["public", 1, 4]);
    const rows = await db.select().from(s.raceResults).where(eq(s.raceResults.raceId, "race-bots"));
    const human = rows.find((r) => r.userId === "u2")!;
    expect([human.isBot, human.realOpponents, human.botOpponents]).toEqual([false, 0, 4]);
    expect(rows.filter((r) => r.isBot)).toHaveLength(4);
    expect(rows.filter((r) => r.isBot).every((r) => r.userId === null)).toBe(true);
  });

  it("saves flags and keeps flagged races out of best speed and wins", async () => {
    const data = finishedRace("race-flagged");
    data.players.find((p) => p.id === "u1")!.flags.push("timing");
    const [before] = await db.select().from(s.profiles).where(eq(s.profiles.userId, "u1"));
    data.results!.find((r) => r.id === "u1")!.wpm = 999;
    await persistRace(db, data);
    const [row] = await db
      .select()
      .from(s.raceResults)
      .where(eq(s.raceResults.raceId, "race-flagged"));
    expect([row!.flagged, row!.flagReason]).toEqual([true, "timing"]);
    const [after] = await db.select().from(s.profiles).where(eq(s.profiles.userId, "u1"));
    expect(after!.bestWpm).toBe(before!.bestWpm);
    expect(after!.wins).toBe(before!.wins);
    expect(after!.races).toBe(before!.races + 1);
  });
});
