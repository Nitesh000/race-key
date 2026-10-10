import booksData from "../data/books.json" with { type: "json" };
import raceData from "../data/race.json" with { type: "json" };
import { difficultyForWpm } from "./difficulty";

type Row = [id: string, bookId: string, difficulty: number, text: string];

export type RacePassage = { id: string; text: string; title: string; author: string };

const rows = raceData as Row[];
const authorNames = new Map(booksData.authors.map((a) => [a.id, a.name]));
const bookInfo = new Map(
  booksData.books.map((b) => [b.id, { title: b.title, author: authorNames.get(b.authorId) ?? "" }]),
);
const byId = new Map(rows.map((r) => [r[0], r]));

function toPassage([id, bookId, , text]: Row): RacePassage {
  const book = bookInfo.get(bookId)!;
  return { id, text, title: book.title, author: book.author };
}

export function racePassage(id: string): RacePassage | null {
  const row = byId.get(id);
  return row ? toPassage(row) : null;
}

export function pickRacePassage(
  opts: { wpm?: number; exclude?: Set<string>; random?: () => number } = {},
): RacePassage {
  const random = opts.random ?? Math.random;
  const [lo, hi] = opts.wpm === undefined ? [1, 10] : difficultyForWpm(opts.wpm);
  const pool = rows.filter((r) => r[2] >= lo && r[2] <= hi && !opts.exclude?.has(r[0]));
  const list = pool.length ? pool : rows;
  return toPassage(list[Math.floor(random() * list.length)]!);
}
