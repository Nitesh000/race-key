import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { extract, parseHeader, rankDifficulty, sample } from "../src/parse";
import {
  authorSchema,
  bookSchema,
  passageSchema,
  type Author,
  type Book,
  type Passage,
} from "../src/types";
import { books } from "./books";

const SCRIPT_VERSION = "1.0.0";
const PER_BOOK = Number(process.env.PER_BOOK ?? 60);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cacheDir = join(root, ".cache");
const dataDir = join(root, "data");

function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function download(id: number): Promise<string> {
  const file = join(cacheDir, `pg${id}.txt`);
  try {
    return await readFile(file, "utf8");
  } catch {
    const url = `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`;
    const res = await fetch(url, { headers: { "user-agent": "race-key passage import" } });
    if (!res.ok) throw new Error(`${url} returned ${res.status}`);
    const text = await res.text();
    await mkdir(cacheDir, { recursive: true });
    await writeFile(file, text);
    await new Promise((r) => setTimeout(r, 1500));
    return text;
  }
}

const importedAt = process.env.IMPORTED_AT ?? new Date().toISOString();
const authors = new Map<string, Author>();
const bookRows: Book[] = [];
const passageRows: Passage[] = [];
const seen = new Set<string>();

for (const src of books) {
  const raw = (await download(src.gutenbergId)).replace(/^\uFEFF/, "");
  const header = parseHeader(raw);
  if (
    header.title &&
    !header.title.toLowerCase().includes(src.title.toLowerCase().split(/[:,]/)[0]!.slice(0, 12))
  ) {
    console.warn(`title mismatch for #${src.gutenbergId}: "${header.title}" vs "${src.title}"`);
  }

  const authorId = slug(src.author);
  authors.set(authorId, {
    id: authorId,
    name: src.author,
    birthYear: src.birth,
    deathYear: src.death,
  });

  const bookId = `g${src.gutenbergId}`;
  bookRows.push({
    id: bookId,
    gutenbergId: src.gutenbergId,
    title: src.title,
    authorId,
    publicationYear: src.year,
    originalLanguage: src.language,
    translator: src.translator ?? header.translator,
    edition: `Project Gutenberg EBook #${src.gutenbergId}`,
    sourceUrl: `https://www.gutenberg.org/ebooks/${src.gutenbergId}`,
    releaseDate: header.releaseDate,
    updatedDate: header.updatedDate,
    licence: "public-domain",
  });

  const candidates = extract(raw).filter((c) => {
    if (seen.has(c.checksum)) return false;
    seen.add(c.checksum);
    return true;
  });
  const picked = sample(candidates, PER_BOOK);
  for (const c of picked) {
    const id = `${bookId}-${c.checksum.slice(0, 8)}`;
    passageRows.push({
      id,
      bookId,
      text: c.text,
      chapterNumber: c.chapterNumber,
      chapterTitle: c.chapterTitle,
      paragraphNumber: c.paragraphNumber,
      offset: c.offset,
      type: c.type,
      speaker: c.speaker,
      difficulty: c.difficulty,
      checksum: c.checksum,
      contextBefore: c.contextBefore,
      contextAfter: c.contextAfter,
      importedAt,
      scriptVersion: SCRIPT_VERSION,
    });
  }
  console.log(
    `#${src.gutenbergId} ${src.title}: ${candidates.length} candidates, kept ${picked.length}`,
  );
}

const ranks = rankDifficulty(passageRows.map((p) => p.difficulty));
passageRows.forEach((p, i) => (p.difficulty = ranks[i]!));

const ids = new Set<string>();
for (const p of passageRows) {
  passageSchema.parse(p);
  if (ids.has(p.id)) throw new Error(`duplicate passage id ${p.id}`);
  ids.add(p.id);
}
bookRows.forEach((b) => bookSchema.parse(b));
const authorRows = [...authors.values()].map((a) => authorSchema.parse(a));

const lines = (rows: unknown[]) => "[\n" + rows.map((r) => JSON.stringify(r)).join(",\n") + "\n]\n";
await mkdir(dataDir, { recursive: true });
await writeFile(
  join(dataDir, "books.json"),
  JSON.stringify({ authors: authorRows, books: bookRows }, null, 2) + "\n",
);
await writeFile(join(dataDir, "passages.json"), lines(passageRows));
console.log(
  `wrote ${bookRows.length} books, ${authorRows.length} authors, ${passageRows.length} passages`,
);
