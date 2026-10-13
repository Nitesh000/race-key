import { charMatches } from "./typing";

export type KeyKind = "correct" | "wrong" | "backspace";
export type LoggedKey = { kind: KeyKind; key: string; dt: number };

const VERSION = 1;
const kinds: KeyKind[] = ["correct", "wrong", "backspace"];
const MAX_DT = 60_000;
const DT_STEP = 4;

function writeVarint(out: number[], n: number) {
  let v = Math.max(0, Math.floor(n));
  while (v >= 0x80) {
    out.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  out.push(v);
}

function readVarint(bytes: Uint8Array, at: { i: number }) {
  let shift = 0;
  let n = 0;
  for (;;) {
    const b = bytes[at.i++];
    if (b === undefined) throw new Error("truncated keystroke log");
    n += (b & 0x7f) * 2 ** shift;
    if (b < 0x80) return n;
    shift += 7;
    if (shift > 28) throw new Error("bad varint");
  }
}

export function packKeystrokes(log: LoggedKey[]): Uint8Array {
  const out: number[] = [VERSION];
  for (const k of log) {
    out.push(kinds.indexOf(k.kind));
    if (k.kind !== "backspace") writeVarint(out, k.key.codePointAt(0) ?? 0);
    writeVarint(out, Math.round(Math.min(MAX_DT, k.dt) / DT_STEP));
  }
  return Uint8Array.from(out);
}

export function unpackKeystrokes(bytes: Uint8Array): LoggedKey[] {
  if (bytes[0] !== VERSION) throw new Error("unknown keystroke log version");
  const at = { i: 1 };
  const out: LoggedKey[] = [];
  while (at.i < bytes.length) {
    const kind = kinds[bytes[at.i++]!];
    if (!kind) throw new Error("bad keystroke kind");
    const key = kind === "backspace" ? "\b" : String.fromCodePoint(readVarint(bytes, at));
    out.push({ kind, key, dt: readVarint(bytes, at) * DT_STEP });
  }
  return out;
}

export function toBase64(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export function fromBase64(s: string) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

export type KeyAgg = { hits: number; misses: number; totalMs: number };

export type KeystrokeAnalysis = {
  keys: Map<string, KeyAgg>;
  pairs: Map<string, KeyAgg>;
  missedWords: Map<string, number>;
  fixMs: number[];
  complete: boolean;
};

const bump = (m: Map<string, KeyAgg>, k: string, hit: boolean, ms: number) => {
  const a = m.get(k) ?? { hits: 0, misses: 0, totalMs: 0 };
  if (hit) {
    a.hits++;
    a.totalMs += ms;
  } else {
    a.misses++;
  }
  m.set(k, a);
};

function wordAt(text: string, i: number) {
  let s = i;
  while (s > 0 && !/\s/.test(text[s - 1]!)) s--;
  let e = i;
  while (e < text.length && !/\s/.test(text[e]!)) e++;
  return text
    .slice(s, e)
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
    .toLowerCase();
}

export function analyzeKeystrokes(text: string, log: LoggedKey[]): KeystrokeAnalysis {
  const keys = new Map<string, KeyAgg>();
  const pairs = new Map<string, KeyAgg>();
  const missedWords = new Map<string, number>();
  const fixMs: number[] = [];
  let pos = 0;
  let stack = 0;
  let errorStartedAt: number | null = null;
  let clock = 0;
  let lastWord = -1;

  for (const k of log) {
    clock += k.dt;
    const expected = text[pos];
    if (k.kind === "correct") {
      if (stack !== 0 || expected === undefined || !charMatches(expected, k.key)) {
        return { keys, pairs, missedWords, fixMs, complete: false };
      }
      if (errorStartedAt !== null) {
        fixMs.push(clock - errorStartedAt);
        errorStartedAt = null;
      }
      bump(keys, expected, true, k.dt);
      if (pos > 0) bump(pairs, (text[pos - 1]! + expected).toLowerCase(), true, k.dt);
      pos++;
    } else if (k.kind === "wrong") {
      if (stack === 0 && expected !== undefined) {
        bump(keys, expected, false, 0);
        if (pos > 0) bump(pairs, (text[pos - 1]! + expected).toLowerCase(), false, 0);
        const word = wordAt(text, pos);
        const start = text.lastIndexOf(" ", pos) + 1;
        if (word && start !== lastWord) {
          missedWords.set(word, (missedWords.get(word) ?? 0) + 1);
          lastWord = start;
        }
        errorStartedAt = clock;
      }
      stack++;
    } else if (stack > 0) {
      stack--;
    }
  }
  return { keys, pairs, missedWords, fixMs, complete: pos === text.length };
}
