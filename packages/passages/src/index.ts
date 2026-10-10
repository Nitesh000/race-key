import booksData from "../data/books.json" with { type: "json" };
import passagesData from "../data/passages.json" with { type: "json" };
import type { Author, Book, Passage } from "./types";

import { difficultyForWpm } from "./difficulty";

export * from "./difficulty";
export * from "./types";

export const authors = booksData.authors as Author[];
export const books = booksData.books as Book[];
export const passages = passagesData as unknown as Passage[];

const byId = new Map(passages.map((p) => [p.id, p]));
const bookById = new Map(books.map((b) => [b.id, b]));
const authorById = new Map(authors.map((a) => [a.id, a]));
const byBook = new Map<string, Passage[]>();
for (const p of passages) {
  const list = byBook.get(p.bookId) ?? [];
  list.push(p);
  byBook.set(p.bookId, list);
}

export type PassageWithSource = Passage & { book: Book; author: Author };

export function withSource(p: Passage): PassageWithSource {
  const book = bookById.get(p.bookId)!;
  return { ...p, book, author: authorById.get(book.authorId)! };
}

export function getPassage(id: string): PassageWithSource | null {
  const p = byId.get(id);
  return p ? withSource(p) : null;
}

export function getBook(id: string) {
  return bookById.get(id) ?? null;
}

export function passagesForBook(bookId: string) {
  return byBook.get(bookId) ?? [];
}

export function randomPassage(
  opts: { wpm?: number; exclude?: Set<string>; hidden?: Set<string>; random?: () => number } = {},
): PassageWithSource {
  const random = opts.random ?? Math.random;
  const [lo, hi] = opts.wpm === undefined ? [1, 10] : difficultyForWpm(opts.wpm);
  const pool = passages.filter(
    (p) =>
      p.difficulty >= lo &&
      p.difficulty <= hi &&
      !opts.exclude?.has(p.id) &&
      !opts.hidden?.has(p.id),
  );
  const list = pool.length ? pool : passages;
  return withSource(list[Math.floor(random() * list.length)]!);
}
