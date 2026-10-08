import { createHash } from "node:crypto";
import type { PassageType } from "./types";

export const MIN_LENGTH = 100;
export const MAX_LENGTH = 400;
const CONTEXT = 280;

export type Header = {
  title: string | null;
  translator: string | null;
  releaseDate: string | null;
  updatedDate: string | null;
};

export type RawParagraph = {
  text: string;
  lines: string[];
  offset: number;
  map: number[];
};

export type Candidate = {
  index: number;
  text: string;
  offset: number;
  chapterNumber: number | null;
  chapterTitle: string | null;
  paragraphNumber: number;
  chunk: number;
  type: PassageType;
  speaker: string | null;
  difficulty: number;
  checksum: string;
  contextBefore: string;
  contextAfter: string;
};

export function parseHeader(raw: string): Header {
  const field = (name: string) => {
    const m = raw.match(new RegExp(`^${name}:\\s*(.+?)\\s*$`, "m"));
    return m?.[1] ?? null;
  };
  const release = field("Release [Dd]ate");
  const updated = field("Most recently updated");
  return {
    title: field("Title"),
    translator: field("Translator"),
    releaseDate: release?.replace(/\s*\[.*\]\s*$/, "") ?? null,
    updatedDate: updated,
  };
}

export function bodyRange(raw: string): [number, number] {
  const start = raw.match(/^\*\*\* ?START OF (THE|THIS) PROJECT GUTENBERG.*$/m);
  const end = raw.match(/^\*\*\* ?END OF (THE|THIS) PROJECT GUTENBERG.*$/m);
  const from = start ? start.index! + start[0].length : 0;
  const to = end ? end.index! : raw.length;
  return [from, to];
}

export function splitParagraphs(raw: string, from: number, to: number): RawParagraph[] {
  const out: RawParagraph[] = [];
  const blockRe = /(?:[^\S\r\n]*\S[^\r\n]*(?:\r?\n|$))+/g;
  blockRe.lastIndex = from;
  let m: RegExpExecArray | null;
  while ((m = blockRe.exec(raw)) && m.index < to) {
    const block = m[0];
    const lines = block.split(/\r?\n/).filter((l) => l.trim().length > 0);
    let text = "";
    const map: number[] = [];
    let pendingSpace = false;
    for (let i = 0; i < block.length; i++) {
      const ch = block[i]!;
      if (/\s/.test(ch)) {
        if (text.length > 0) pendingSpace = true;
        continue;
      }
      if (pendingSpace) {
        text += " ";
        map.push(m.index + i - 1);
        pendingSpace = false;
      }
      text += ch;
      map.push(m.index + i);
    }
    if (text)
      out.push({ text, lines, offset: m.index + (block.length - block.trimStart().length), map });
    if (blockRe.lastIndex === m.index) blockRe.lastIndex++;
  }
  return out;
}

const romans: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
const words = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
  "twenty",
];

export function parseNumeral(s: string): number | null {
  if (/^\d+$/.test(s)) return Number(s);
  const up = s.toUpperCase();
  if (/^[IVXLCDM]+$/.test(up)) {
    let n = 0;
    for (let i = 0; i < up.length; i++) {
      const v = romans[up[i]!]!;
      const next = romans[up[i + 1] ?? ""] ?? 0;
      n += v < next ? -v : v;
    }
    return n;
  }
  const w = words.indexOf(s.toLowerCase());
  return w >= 0 ? w + 1 : null;
}

const headingRe =
  /^(?:(?:CHAPTER|Chapter|STAVE|Stave|LETTER|Letter|BOOK|Book|PART|Part)\s+([IVXLCDM]+|\d+|[A-Za-z]+)\b[.:\s—-]*(.*)|([IVXLC]+|\d+)\.\s+([A-Z][^a-z]*)|([IVX]+)\.?)$/;

const small = new Set([
  "a",
  "an",
  "and",
  "as",
  "at",
  "but",
  "by",
  "for",
  "in",
  "of",
  "on",
  "or",
  "the",
  "to",
  "with",
  "upon",
]);

export function titleCase(s: string): string {
  if (s !== s.toUpperCase() || !/[A-Z]/.test(s)) return s;
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) =>
      i > 0 && small.has(w)
        ? w
        : w.replace(/(^|-|[“"‘(])(\p{L})/gu, (_, a: string, c: string) => a + c.toUpperCase()),
    )
    .join(" ");
}

export function matchHeading(text: string): { number: number | null; title: string | null } | null {
  if (text.length > (text === text.toUpperCase() ? 200 : 90)) return null;
  const m = text.match(headingRe);
  if (!m) return null;
  const numeral = m[1] ?? m[3] ?? m[5] ?? "";
  const number = parseNumeral(numeral);
  if (m[1] !== undefined && number === null) return null;
  const title = cleanTitle((m[2] ?? m[4] ?? "").replace(/_+$/, "")) || null;
  const kind = text.split(/\s/)[0]!.toLowerCase();
  if (m[1] !== undefined && kind !== "chapter") {
    const label = `${kind[0]!.toUpperCase()}${kind.slice(1)} ${/^[A-Z]{2,}$/.test(numeral) && !/^[IVXLCDM]+$/.test(numeral) ? titleCase(numeral) : numeral}`;
    return { number, title: title ? `${label}: ${title}` : label };
  }
  return { number, title };
}

const banned = /[[\]{}<>|=#@~^\\*]|_{2,}/;
const nonLatin = /[^\u0020-\u024f\u2010-\u2027\u00a0\s]/;

export function stripMarkup(text: string): string {
  return text.replace(/_([^_]+)_/g, "$1");
}

function stripWithMap(text: string, map: number[]): { text: string; map: number[] } {
  const drop = new Set<number>();
  for (const m of text.matchAll(/_([^_]+)_/g)) {
    drop.add(m.index);
    drop.add(m.index + m[0].length - 1);
  }
  if (drop.size === 0) return { text, map };
  let out = "";
  const outMap: number[] = [];
  for (let i = 0; i < text.length; i++) {
    if (drop.has(i)) continue;
    out += text[i];
    outMap.push(map[i]!);
  }
  return { text: out, map: outMap };
}

export function isUsable(p: RawParagraph): boolean {
  const t = p.text;
  if (banned.test(t) || nonLatin.test(t)) return false;
  if (t === t.toUpperCase()) return false;
  if (p.lines.length >= 3) {
    const avg = p.lines.reduce((a, l) => a + l.trim().length, 0) / p.lines.length;
    if (avg < 45) return false;
  }
  if (/(gutenberg|ebook|e-text|transcriber)/i.test(t)) return false;
  return true;
}

const abbreviations = /\b(Mr|Mrs|Ms|Dr|St|Mme|Mlle|Messrs|Capt|Col|Gen|Rev|Jr|Sr|Prof|vs|No|M)\.$/;

export function sentences(text: string): string[] {
  const parts: string[] = [];
  const re = /[.!?]+["'’”)]*\s+(?=["'‘“(_]?[A-Z])/g;
  let start = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const end = m.index + m[0].trimEnd().length;
    const piece = text.slice(start, end);
    if (abbreviations.test(piece)) continue;
    parts.push(piece);
    start = m.index + m[0].length;
  }
  if (start < text.length) parts.push(text.slice(start));
  return parts;
}

export function chunk(text: string): { text: string; start: number }[] {
  if (text.length <= MAX_LENGTH) return text.length >= MIN_LENGTH ? [{ text, start: 0 }] : [];
  const out: { text: string; start: number }[] = [];
  let cur = "";
  let curStart = 0;
  let pos = 0;
  for (const s of sentences(text)) {
    const at = text.indexOf(s, pos);
    pos = at + s.length;
    if (!cur) {
      cur = s;
      curStart = at;
    } else if (at - curStart + s.length <= MAX_LENGTH) {
      cur = text.slice(curStart, at + s.length);
    } else {
      if (cur.length >= MIN_LENGTH && cur.length <= MAX_LENGTH)
        out.push({ text: cur, start: curStart });
      cur = s;
      curStart = at;
    }
  }
  if (cur.length >= MIN_LENGTH && cur.length <= MAX_LENGTH)
    out.push({ text: cur, start: curStart });
  return out;
}

const pronouns = new Set([
  "He",
  "She",
  "I",
  "It",
  "They",
  "We",
  "You",
  "This",
  "That",
  "There",
  "Then",
]);
const verbs =
  "said|cried|replied|asked|answered|exclaimed|returned|whispered|continued|added|observed|remarked";
const speakerAfter = new RegExp(
  `\\b(?:${verbs})\\s+((?:Mr\\.|Mrs\\.|Miss|Dr\\.|Lady|Sir|Captain)?\\s?[A-Z][a-z]+(?:\\s[A-Z][a-z]+)?)`,
);
const speakerBefore = new RegExp(
  `((?:Mr\\.|Mrs\\.|Miss|Dr\\.|Lady|Sir|Captain)?\\s?[A-Z][a-z]+(?:\\s[A-Z][a-z]+)?)\\s+(?:${verbs})\\b`,
);

export function classify(text: string): { type: PassageType; speaker: string | null } {
  const opensWithQuote = /^["“‘']/.test(text);
  const hasQuote = /["“”]/.test(text) || /‘[^’]+’/.test(text);
  if (!opensWithQuote && !hasQuote) return { type: "paragraph", speaker: null };
  const m = text.match(speakerAfter) ?? text.match(speakerBefore);
  let speaker = m?.[1]?.trim() ?? null;
  if (speaker && pronouns.has(speaker)) speaker = null;
  return { type: opensWithQuote ? "dialogue" : "quote", speaker };
}

const rareLetters = /[qxzjkv]/gi;

export function difficultyScore(text: string): number {
  const len = Math.min(1, Math.max(0, (text.length - MIN_LENGTH) / (MAX_LENGTH - MIN_LENGTH)));
  const punct = Math.min(1, ((text.match(/[,;:—–\-'"“”‘’()!?]/g)?.length ?? 0) / text.length) * 12);
  const tokens = text
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}]/gu, ""))
    .filter(Boolean);
  const long = tokens.length ? tokens.filter((w) => w.length >= 8).length / tokens.length : 0;
  const rare = Math.min(1, ((text.match(rareLetters)?.length ?? 0) / text.length) * 25);
  const caps = Math.min(1, ((text.match(/[A-Z0-9]/g)?.length ?? 0) / text.length) * 15);
  return 0.25 * len + 0.25 * punct + 0.25 * Math.min(1, long * 3) + 0.1 * rare + 0.15 * caps;
}

export function rankDifficulty(scores: number[]): number[] {
  const sorted = [...scores].sort((a, b) => a - b);
  return scores.map((s) => {
    let lo = 0;
    let hi = sorted.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (sorted[mid]! < s) lo = mid + 1;
      else hi = mid;
    }
    return Math.min(10, 1 + Math.floor((lo / sorted.length) * 10));
  });
}

export function checksum(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function before(text: string) {
  return text.length <= CONTEXT ? text : "…" + text.slice(-CONTEXT).replace(/^\S*\s/, "");
}

function after(text: string) {
  return text.length <= CONTEXT ? text : text.slice(0, CONTEXT).replace(/\s\S*$/, "") + "…";
}

function cleanTitle(s: string) {
  return titleCase(
    s
      .replace(/^(?:(?:chapter|book|part|stave|letter)\s+\S+|[IVXLC]+\.)\s*/i, "")
      .replace(/\s+\d+$/, "")
      .replace(/\.$/, "")
      .trim(),
  );
}

function normalizeTitle(s: string) {
  return stripMarkup(s)
    .toLowerCase()
    .replace(/^(chapter|book|part|stave|letter)\s+\S+\s*/, "")
    .replace(/^[ivxlc]+\.?\s+/, "")
    .replace(/\s+\d+$/, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function tableOfContents(paragraphs: RawParagraph[]): Map<string, number> {
  const toc = new Map<string, number>();
  const start = paragraphs.findIndex((p) => /^(table of )?contents\.?$/i.test(p.text.trim()));
  if (start < 0) return toc;
  for (let i = start + 1; i < paragraphs.length; i++) {
    const p = paragraphs[i]!;
    const avg = p.lines.reduce((a, l) => a + l.trim().length, 0) / p.lines.length;
    if (p.lines.some((l) => l.trim().length > 90)) break;
    if (p.text.length > 150 && avg > 50) break;
    for (const line of p.lines) {
      const key = normalizeTitle(line.trim());
      if (!key || /^\s*\[/.test(line) || key === "page") continue;
      if (toc.has(key)) return toc;
      toc.set(key, toc.size + 1);
    }
  }
  return toc;
}

export function extract(raw: string): Candidate[] {
  const [from, to] = bodyRange(raw);
  const paragraphs = splitParagraphs(raw, from, to);
  const toc = tableOfContents(paragraphs);
  const out: Candidate[] = [];
  let titled = false;
  const headings: Heading[] = [];
  let chapterNumber: number | null = null;
  let chapterTitle: string | null = null;
  let chapterCount = 0;
  let paragraphNumber = 0;
  let awaitingTitle = false;

  for (let i = 0; i < paragraphs.length; i++) {
    const p = paragraphs[i]!;
    const plain = stripMarkup(p.text);
    const explicit = matchHeading(plain);

    if (explicit && /^[IVX]+\.?$/.test(plain) && titled) {
      const next = paragraphs.slice(i + 1).find((n) => !/^\[/.test(n.text));
      if (!next || next.text.length > 80) continue;
    }

    if (!explicit && awaitingTitle) {
      if (/^\[/.test(p.text)) continue;
      const titleLike = !/[.!?]["”’]?$/.test(p.text) || plain === plain.toUpperCase();
      if (p.text.length < 80 && titleLike) {
        chapterTitle = cleanTitle(plain);
        awaitingTitle = false;
        titled = true;
        continue;
      }
    }

    const tocNumber: number | undefined =
      !explicit && !titled && p.text.length <= 90 ? toc.get(normalizeTitle(plain)) : undefined;
    const heading: { number: number | null; title: string | null } | null =
      explicit ??
      (tocNumber === undefined ? null : { number: tocNumber, title: cleanTitle(plain) });

    if (heading) {
      headings.push({ index: i, number: heading.number, fromToc: !explicit });
      titled = !!explicit && !!heading.title;
      chapterCount++;
      chapterNumber = heading.number ?? chapterCount;
      chapterTitle = heading.title;
      awaitingTitle = !heading.title;
      paragraphNumber = 0;
      continue;
    }
    awaitingTitle = false;
    paragraphNumber++;
    if (!isUsable(p)) continue;

    const clean = stripWithMap(p.text, p.map);
    chunk(clean.text).forEach((piece, chunkIndex) => {
      const { type, speaker } = classify(piece.text);
      out.push({
        index: i,
        text: piece.text,
        offset: clean.map[piece.start] ?? p.offset,
        chapterNumber,
        chapterTitle,
        paragraphNumber,
        chunk: chunkIndex,
        type,
        speaker,
        difficulty: difficultyScore(piece.text),
        checksum: checksum(piece.text),
        contextBefore: before(stripMarkup(paragraphs[i - 1]?.text ?? "")),
        contextAfter: after(stripMarkup(paragraphs[i + 1]?.text ?? "")),
      });
    });
  }
  const start = bodyStart(headings, new Set(out.map((c) => c.index)));
  return out.filter((c) => c.index > start);
}

type Heading = { index: number; number: number | null; fromToc: boolean };

function bodyStart(all: Heading[], content: Set<number>) {
  const explicit = all.filter((h) => !h.fromToc);
  const headings = explicit.some((h) => h.number === 1) ? explicit : all;
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]!;
    if (h.number !== 1) continue;
    const next = all.find((n) => n.index > h.index)?.index ?? Infinity;
    for (const c of content) if (c > h.index && c < next) return h.index;
  }
  return -1;
}

export function sample<T>(items: T[], max: number): T[] {
  if (items.length <= max) return items;
  const step = items.length / max;
  return Array.from({ length: max }, (_, i) => items[Math.floor(i * step + step / 2)]!);
}
