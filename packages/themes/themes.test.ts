import { describe, expect, it } from "vitest";
import { checkContrast, contrast } from "./contrast";
import { themes } from "./index";
import { themeSchema } from "./tokens";

describe("themes", () => {
  it.each(themes.map((t) => [t.id, t] as const))("%s matches the schema", (_, theme) => {
    expect(themeSchema.safeParse(theme).success).toBe(true);
  });

  it.each(themes.map((t) => [t.id, t] as const))("%s passes contrast checks", (_, theme) => {
    expect(checkContrast(theme)).toEqual([]);
  });

  it("rejects a theme missing a dark value", () => {
    const [first] = themes;
    const { caret: _, ...dark } = first!.dark;
    expect(themeSchema.safeParse({ ...first, dark }).success).toBe(false);
  });

  it("computes WCAG contrast", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 0);
    expect(contrast("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
  });
});
