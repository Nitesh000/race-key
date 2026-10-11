import { mulberry32, wpm } from "@race-key/shared";
import { describe, expect, it } from "vitest";
import { autoStartDelay, botJoinTimes, botLevel } from "./roster";
import { botTargetWpm, MAX_BOT_WPM, MIN_BOT_WPM, roomBaseline } from "./speed";
import { planTypist, positionAt, sampleSpeeds } from "./typist";

const text =
  "It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.";

describe("bot speed", () => {
  it("centres on the real players and stays within 10 wpm and the global bounds", () => {
    const rng = mulberry32(1);
    expect(roomBaseline([60, 80])).toBe(70);
    expect(roomBaseline([])).toBe(40);
    for (let i = 0; i < 500; i++) {
      const t = botTargetWpm(70, rng);
      expect(t).toBeGreaterThanOrEqual(60);
      expect(t).toBeLessThanOrEqual(80);
    }
    expect(botTargetWpm(5, rng)).toBe(MIN_BOT_WPM);
    expect(botTargetWpm(400, rng)).toBe(MAX_BOT_WPM);
  });
});

describe("typist", () => {
  it("lands on the target speed overall", () => {
    for (const target of [25, 60, 120]) {
      const plan = planTypist(text, target, mulberry32(target));
      expect(wpm(text.length, plan.durationMs)).toBeCloseTo(target, 5);
    }
  });

  it("is uneven, makes a few mistakes and only moves forward", () => {
    const plan = planTypist(text.repeat(4), 70, mulberry32(4));
    const gaps = plan.times.map((t, i) => t - (plan.times[i - 1] ?? 0));
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const sd = Math.sqrt(gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length);
    expect(sd / mean).toBeGreaterThan(0.2);
    expect(plan.errors).toBeGreaterThan(0);
    expect(plan.errors / plan.times.length).toBeLessThan(0.06);
    expect(gaps.every((g) => g > 0)).toBe(true);
  });

  it("reports position and per-second speed", () => {
    const plan = planTypist(text, 60, mulberry32(2));
    expect(positionAt(plan, 0)).toBe(0);
    expect(positionAt(plan, plan.durationMs)).toBe(text.length);
    const samples = sampleSpeeds(plan);
    expect(samples.length).toBe(Math.ceil(plan.durationMs / 1000));
    expect(samples.at(-1)).toBeCloseTo(60, 0);
  });
});

describe("roster", () => {
  it("waits 12 to 13 seconds and spreads bot joins across the wait", () => {
    const rng = mulberry32(5);
    for (let i = 0; i < 100; i++) {
      const d = autoStartDelay(rng);
      expect(d).toBeGreaterThanOrEqual(12_000);
      expect(d).toBeLessThanOrEqual(13_000);
    }
    const times = botJoinTimes(0, 12_500, 4, rng);
    expect(times).toHaveLength(4);
    expect(times[0]).toBeGreaterThanOrEqual(1_500);
    expect(times[3]).toBeLessThanOrEqual(12_000);
    expect(new Set(times).size).toBe(4);
  });

  it("picks levels near the room's", () => {
    const rng = mulberry32(6);
    for (let i = 0; i < 100; i++) {
      const l = botLevel([10, 12], rng);
      expect(l).toBeGreaterThanOrEqual(9);
      expect(l).toBeLessThanOrEqual(13);
    }
    expect(botLevel([1], mulberry32(7))).toBeGreaterThanOrEqual(1);
  });
});
