import { authors, books, passages } from "@race-key/passages";
import { themes } from "@race-key/themes";
import { sql } from "drizzle-orm";
import * as s from "../src/schema";
import { nodeDb } from "./client";

const { db, client } = nodeDb();

function chunks<T>(rows: T[], size = 500) {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

await db
  .insert(s.authors)
  .values(authors)
  .onConflictDoUpdate({
    target: s.authors.id,
    set: {
      name: sql`excluded.name`,
      birthYear: sql`excluded.birth_year`,
      deathYear: sql`excluded.death_year`,
    },
  });

await db
  .insert(s.books)
  .values(books)
  .onConflictDoUpdate({
    target: s.books.id,
    set: {
      title: sql`excluded.title`,
      translator: sql`excluded.translator`,
      releaseDate: sql`excluded.release_date`,
      updatedDate: sql`excluded.updated_date`,
    },
  });

for (const batch of chunks(passages)) {
  await db
    .insert(s.passages)
    .values(batch.map((p) => ({ ...p, importedAt: new Date(p.importedAt) })))
    .onConflictDoNothing();
}

await db
  .insert(s.themes)
  .values(
    themes.map((t) => ({ id: t.id, name: t.name, priceType: t.priceType, price: t.price ?? 0 })),
  )
  .onConflictDoUpdate({
    target: s.themes.id,
    set: {
      name: sql`excluded.name`,
      priceType: sql`excluded.price_type`,
      price: sql`excluded.price`,
    },
  });

await client.end();
console.log(`seeded ${authors.length} authors, ${books.length} books, ${passages.length} passages`);
