import { describe, expect, it } from "vitest";
import { accuracy, charMatches, consistency, plainKey, wpm } from "./typing";

describe("plainKey", () => {
  it.each([
    ["\u2019", "'"],
    ["\u201c", '"'],
    ["\u2014", "-"],
    ["\u00e9", "e"],
    ["\u00c0", "A"],
    ["\u00e6", "a"],
    ["a", "a"],
    [" ", " "],
  ])("%s -> %s", (input, out) => {
    expect(plainKey(input)).toBe(out);
  });
});

describe("charMatches", () => {
  it("accepts the exact char and its plain key", () => {
    expect(charMatches("\u2019", "\u2019")).toBe(true);
    expect(charMatches("\u2019", "'")).toBe(true);
    expect(charMatches("\u00e9", "e")).toBe(true);
    expect(charMatches("e", "\u00e9")).toBe(false);
    expect(charMatches("a", "b")).toBe(false);
  });
});

describe("wpm", () => {
  it("uses five characters per word", () => {
    expect(wpm(300, 60000)).toBe(60);
    expect(wpm(50, 6000)).toBe(100);
    expect(wpm(10, 0)).toBe(0);
  });
});

describe("accuracy", () => {
  it("is correct over total", () => {
    expect(accuracy(95, 5)).toBe(0.95);
    expect(accuracy(0, 0)).toBe(1);
  });
});

describe("consistency", () => {
  it("is 1 for a steady race and lower for an uneven one", () => {
    expect(consistency([10, 60, 60, 60, 60])).toBe(1);
    expect(consistency([10, 30, 90, 30, 90])!).toBeLessThan(0.6);
    expect(consistency([50, 60])).toBeNull();
  });
});
