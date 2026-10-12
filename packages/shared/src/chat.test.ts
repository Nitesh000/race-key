import { describe, expect, it } from "vitest";
import { defaultLoadout, emojiInfo, emojis, isUnlocked, twemojiId } from "./emoji";
import { filterChat } from "./filter";

describe("filterChat", () => {
  it("masks bad words including simple disguises", () => {
    expect(filterChat("what the fuck")).toBe("what the ****");
    expect(filterChat("SH1T happens")).toBe("**** happens");
    expect(filterChat("fuuuuck!")).toBe("********");
  });

  it("leaves normal words alone and trims", () => {
    expect(filterChat("  nice   race,  Scunthorpe ")).toBe("nice race, Scunthorpe");
    expect(filterChat("assessment")).toBe("assessment");
    expect(filterChat("x".repeat(300))).toHaveLength(200);
  });
});

describe("emoji", () => {
  it("has a free default loadout of nine unique emojis", () => {
    expect(defaultLoadout).toHaveLength(9);
    expect(new Set(defaultLoadout).size).toBe(9);
    for (const c of defaultLoadout) expect(emojiInfo(c)?.unlock.type).toBe("free");
  });

  it("maps to twemoji file names", () => {
    expect(twemojiId("🔥")).toBe("1f525");
    expect(twemojiId("⚡")).toBe("26a1");
    expect(twemojiId("🫡")).toBe("1fae1");
  });

  it("unlocks by level and achievement", () => {
    const yawn = emojis.find((e) => e.name === "yawn")!;
    const cheetah = emojis.find((e) => e.name === "cheetah")!;
    const none = { level: 1, achievements: new Set<string>(), owned: new Set<string>() };
    expect(isUnlocked(yawn, none)).toBe(false);
    expect(isUnlocked(yawn, { ...none, level: 5 })).toBe(true);
    expect(isUnlocked(cheetah, { ...none, achievements: new Set(["wpm-100"]) })).toBe(true);
  });
});
