import { describe, expect, it } from "vitest";
import {
  analyzeKeystrokes,
  fromBase64,
  packKeystrokes,
  toBase64,
  unpackKeystrokes,
  type LoggedKey,
} from "./keystrokes";

const typed = (s: string, dt = 100): LoggedKey[] =>
  Array.from(s, (c) =>
    c === "\b"
      ? { kind: "backspace", key: "\b", dt }
      : c === "#"
        ? { kind: "wrong", key: "x", dt }
        : { kind: "correct", key: c, dt },
  );

describe("keystroke packing", () => {
  it("round trips, including accents and long pauses", () => {
    const log: LoggedKey[] = [
      { kind: "correct", key: "a", dt: 0 },
      { kind: "wrong", key: "é", dt: 140 },
      { kind: "backspace", key: "\b", dt: 300 },
      { kind: "correct", key: "’", dt: 90_000 },
    ];
    const back = unpackKeystrokes(fromBase64(toBase64(packKeystrokes(log))));
    expect(back).toEqual([...log.slice(0, 3), { ...log[3]!, dt: 60_000 }]);
  });

  it("stays around a kilobyte for a normal race", () => {
    const log = typed("the quick brown fox jumps over the lazy dog ".repeat(7), 180);
    expect(packKeystrokes(log).length).toBeLessThan(1000);
  });
});

describe("analyzeKeystrokes", () => {
  it("counts hits, misses, pairs, missed words and fix time", () => {
    const text = "the cat";
    const a = analyzeKeystrokes(text, typed("th#\be ca##\b\bt"));
    expect(a.complete).toBe(true);
    expect(a.keys.get("e")).toEqual({ hits: 1, misses: 1, totalMs: 100 });
    expect(a.keys.get("t")).toEqual({ hits: 2, misses: 1, totalMs: 200 });
    expect(a.pairs.get("he")?.misses).toBe(1);
    expect([...a.missedWords]).toEqual([
      ["the", 1],
      ["cat", 1],
    ]);
    expect(a.fixMs).toEqual([200, 400]);
  });

  it("refuses logs that don't match the passage", () => {
    expect(analyzeKeystrokes("abc", typed("abd")).complete).toBe(false);
  });
});
