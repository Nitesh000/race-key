import { describe, expect, it } from "vitest";
import { randomName, uniqueNames, usernameSchema } from "./names";
import { mulberry32 } from "./random";

describe("randomName", () => {
  it("is deterministic with a seeded rng", () => {
    expect(randomName(mulberry32(7))).toBe(randomName(mulberry32(7)));
  });

  it("always produces valid usernames", () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 2000; i++) {
      expect(usernameSchema.safeParse(randomName(rng)).success).toBe(true);
    }
  });

  it("varies its style", () => {
    const rng = mulberry32(3);
    const names = Array.from({ length: 200 }, () => randomName(rng));
    expect(names.some((n) => n.includes("_"))).toBe(true);
    expect(names.some((n) => /\d/.test(n))).toBe(true);
    expect(names.some((n) => /^[A-Z]/.test(n))).toBe(true);
    expect(new Set(names).size).toBeGreaterThan(180);
  });
});

describe("uniqueNames", () => {
  it("never repeats or collides with taken names", () => {
    const names = uniqueNames(50, ["BraveOtter"], mulberry32(9));
    expect(new Set(names.map((n) => n.toLowerCase())).size).toBe(50);
    expect(names).not.toContain("BraveOtter");
  });
});
