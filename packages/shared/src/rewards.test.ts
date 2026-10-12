import { describe, expect, it } from "vitest";
import { earnedAchievements, skins } from "./catalog";
import { botMultiplier, levelForXp, levelProgress, raceReward, xpForLevel } from "./rewards";

const base = {
  finished: true,
  flagged: false,
  wpm: 60,
  accuracy: 0.97,
  chars: 300,
  placement: 1,
  realOpponents: 4,
  botOpponents: 0,
  winStreak: 0,
};

describe("rewards", () => {
  it("scales from 25% with only bots to 100% with only real players", () => {
    expect(botMultiplier(0, 4)).toBe(0.25);
    expect(botMultiplier(4, 0)).toBe(1);
    expect(botMultiplier(2, 2)).toBe(0.625);
    expect(botMultiplier(0, 0)).toBe(0.25);
  });

  it("pays a bot-only race a quarter of a real one", () => {
    const real = raceReward(base);
    const bots = raceReward({ ...base, realOpponents: 0, botOpponents: 4 });
    expect(bots.coins).toBe(Math.round(real.coins / 4));
  });

  it("pays more for winning, speed and accuracy", () => {
    expect(raceReward(base).coins).toBeGreaterThan(raceReward({ ...base, placement: 4 }).coins);
    expect(raceReward({ ...base, wpm: 100 }).coins).toBeGreaterThan(raceReward(base).coins);
    expect(raceReward({ ...base, accuracy: 0.8 }).xp).toBeLessThan(raceReward(base).xp);
  });

  it("pays nothing for flagged races and only a little xp for unfinished ones", () => {
    expect(raceReward({ ...base, flagged: true })).toMatchObject({ coins: 0, xp: 0 });
    expect(raceReward({ ...base, finished: false, chars: 100 })).toMatchObject({
      coins: 0,
      xp: 10,
    });
  });

  it("adds a capped streak bonus for wins", () => {
    const three = raceReward({ ...base, winStreak: 3 }).coins - raceReward(base).coins;
    const twenty = raceReward({ ...base, winStreak: 20 }).coins - raceReward(base).coins;
    expect(three).toBe(15);
    expect(twenty).toBe(50);
  });
});

describe("levels", () => {
  it("needs more xp for each level", () => {
    expect(xpForLevel(1)).toBe(0);
    expect(xpForLevel(2)).toBe(100);
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(xpForLevel(10))).toBe(10);
    expect(levelProgress(150)).toEqual({ level: 2, into: 50, needed: 200 });
  });
});

describe("catalog", () => {
  it("has unique skin ids and achievements that exist", () => {
    expect(new Set(skins.map((s) => s.id)).size).toBe(skins.length);
    const ids = new Set(
      earnedAchievements({
        finishedRaces: 99,
        wins: 99,
        winStreak: 9,
        level: 99,
        books: 99,
        last: { finished: true, wpm: 120, accuracy: 1, chars: 200 },
      }),
    );
    for (const s of skins) if (s.achievement) expect(ids.has(s.achievement)).toBe(true);
  });
});
