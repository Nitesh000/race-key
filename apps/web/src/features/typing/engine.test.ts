import { describe, expect, it } from "vitest";
import { MAX_STACKED_ERRORS, TypingEngine } from "./engine";

function typeAll(engine: TypingEngine, keys: string, start = 0, step = 100) {
  let t = start;
  for (const k of keys) {
    if (k === "\b") engine.backspace(t);
    else engine.type(k, t);
    t += step;
  }
  return t;
}

describe("TypingEngine", () => {
  it("advances on correct keys and finishes", () => {
    const e = new TypingEngine("abc");
    typeAll(e, "abc");
    expect(e.pos).toBe(3);
    expect(e.done).toBe(true);
    expect(e.stats(1000).accuracy).toBe(1);
  });

  it("blocks progress until errors are fixed", () => {
    const e = new TypingEngine("abc");
    typeAll(e, "axc");
    expect(e.pos).toBe(1);
    expect(e.wrong).toEqual(["x", "c"]);
    typeAll(e, "\b\bbc", 1000);
    expect(e.done).toBe(true);
    expect(e.errorKeys).toBe(2);
    expect(e.missed.has(1)).toBe(true);
  });

  it("accepts plain keys for curly quotes and dashes", () => {
    const e = new TypingEngine("it’s—ok");
    typeAll(e, "it's-ok");
    expect(e.done).toBe(true);
    expect(e.errorKeys).toBe(0);
  });

  it("caps stacked errors", () => {
    const e = new TypingEngine("abc");
    typeAll(e, "x".repeat(20));
    expect(e.wrong.length).toBe(MAX_STACKED_ERRORS);
  });

  it("ignores backspace on correct text", () => {
    const e = new TypingEngine("abc");
    typeAll(e, "ab\b");
    expect(e.pos).toBe(2);
  });

  it("measures wpm from the first keystroke", () => {
    const e = new TypingEngine("aaaaaaaaaa");
    typeAll(e, "aaaaaaaaaa", 5000, 120);
    const s = e.stats(0);
    expect(s.elapsed).toBe(1080);
    expect(Math.round(s.wpm)).toBe(111);
  });

  it("logs every keystroke with time since the previous one", () => {
    const e = new TypingEngine("ab");
    typeAll(e, "x\bab", 0, 50);
    expect(e.log.map((k) => [k.kind, k.dt])).toEqual([
      ["wrong", 0],
      ["backspace", 50],
      ["correct", 50],
      ["correct", 50],
    ]);
  });

  it("can start the clock before the first key, as races do", () => {
    const e = new TypingEngine("ab");
    e.begin(1000);
    e.type("a", 1400);
    e.type("b", 1500);
    expect(e.elapsed(0)).toBe(500);
    expect(e.log[0]!.dt).toBe(400);
  });

  it("deletes the last mistyped word with ctrl or option + backspace", () => {
    const e = new TypingEngine("the cat sat");
    typeAll(e, "the cxt sxx");
    expect(e.pos).toBe(5);
    expect(e.wrong.join("")).toBe("xt sxx");
    e.deleteWord(5000);
    expect(e.wrong.join("")).toBe("xt ");
    e.deleteWord(5100);
    expect(e.wrong).toEqual([]);
    expect(e.deleteWord(5200)).toBe(false);
    typeAll(e, "at sat", 6000);
    expect(e.done).toBe(true);
  });

  it("never deletes correct text and clears every mistake with cmd + backspace", () => {
    const e = new TypingEngine("the cat");
    typeAll(e, "thx dog");
    e.deleteAll(5000);
    expect(e.pos).toBe(2);
    expect(e.wrong).toEqual([]);
    expect(e.log.filter((k) => k.kind === "backspace")).toHaveLength(5);
  });
});
