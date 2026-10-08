import { PGlite } from "@electric-sql/pglite";
import {
  authors as passageAuthors,
  books as passageBooks,
  passages as passageRows,
} from "@race-key/passages";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import * as s from "./schema";

const client = new PGlite();
const db = drizzle({ client, schema: s, casing: "snake_case" });

beforeAll(async () => {
  await migrate(db, { migrationsFolder: new URL("../migrations", import.meta.url).pathname });
});

describe("schema", () => {
  it("applies migrations and stores a race with results and keystrokes", async () => {
    const book = passageBooks[0]!;
    const author = passageAuthors.find((a) => a.id === book.authorId)!;
    const passage = passageRows.find((p) => p.bookId === book.id)!;
    await db.insert(s.authors).values(author);
    await db.insert(s.books).values(book);
    await db.insert(s.passages).values({ ...passage, importedAt: new Date(passage.importedAt) });

    await db.insert(s.users).values({ id: "u1", name: "Ada", email: "ada@example.com" });
    await db.insert(s.profiles).values({ userId: "u1", username: "ada" });
    await db.insert(s.races).values({
      id: "r1",
      passageId: passage.id,
      realPlayers: 1,
      botPlayers: 4,
      startedAt: new Date(),
    });
    const [result] = await db
      .insert(s.raceResults)
      .values({
        raceId: "r1",
        userId: "u1",
        displayName: "ada",
        passageId: passage.id,
        placement: 1,
        wpm: 88.5,
        rawWpm: 91,
        accuracy: 0.97,
        timeMs: 42000,
        chars: 310,
        errors: 9,
        roomSize: 5,
        realOpponents: 0,
        botOpponents: 4,
        samples: [40, 70, 88.5],
      })
      .returning();
    const bytes = new Uint8Array([1, 2, 3, 250]);
    await db.insert(s.raceKeystrokes).values({ resultId: result!.id, data: bytes });
    const [row] = await db
      .select()
      .from(s.raceKeystrokes)
      .where(eq(s.raceKeystrokes.resultId, result!.id));
    expect(Array.from(row!.data)).toEqual([1, 2, 3, 250]);

    const [profile] = await db.select().from(s.profiles).where(eq(s.profiles.userId, "u1"));
    expect(profile!.equippedSkinId).toBe("hatchback");
    expect(result!.samples).toEqual([40, 70, 88.5]);
  });

  it("rejects a duplicate username", async () => {
    await db.insert(s.users).values({ id: "u2", name: "B", email: "b@example.com" });
    await expect(db.insert(s.profiles).values({ userId: "u2", username: "ada" })).rejects.toThrow();
  });
});
