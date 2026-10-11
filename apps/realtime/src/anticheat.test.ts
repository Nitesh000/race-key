import { mulberry32 } from "@race-key/shared";
import { describe, expect, it } from "vitest";
import { finishFlags, gapVariation, maxPlausiblePos } from "./anticheat";

const human = (n: number) => {
  const rng = mulberry32(3);
  return Array.from({ length: n }, () => Math.round(80 + rng() * 160));
};

const stats = (dts?: number[]) => ({
  timeMs: 1,
  rawWpm: 0,
  accuracy: 1,
  errors: 0,
  samples: [],
  dts,
});

describe("anticheat", () => {
  it("allows bursts but not more than 30 characters a second on average", () => {
    expect(maxPlausiblePos(0)).toBe(15);
    expect(maxPlausiblePos(10_000)).toBe(315);
  });

  it("measures how uneven keystroke gaps are", () => {
    expect(gapVariation(new Array(60).fill(100))).toBe(0);
    expect(gapVariation(human(60))!).toBeGreaterThan(0.2);
    expect(gapVariation(human(10))).toBeNull();
  });

  it("passes a normal race", () => {
    expect(finishFlags(stats(human(300)), 300, 60_000)).toEqual([]);
  });

  it("flags impossible speed, robotic timing and a missing keystroke log", () => {
    expect(finishFlags(stats(human(300)), 300, 10_000)).toContain("speed");
    expect(finishFlags(stats(new Array(300).fill(120)), 300, 60_000)).toEqual(["timing"]);
    expect(finishFlags(stats(), 300, 60_000)).toEqual(["no-keystrokes"]);
  });
});
