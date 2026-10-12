import { describe, expect, it, vi } from "vitest";
import { createTauntKeys } from "./taunt-keys";

const key = (code: string, extra: Partial<KeyboardEvent> = {}) =>
  ({
    code,
    key: code === "Tab" ? "Tab" : code.slice(-1),
    repeat: false,
    ...extra,
  }) as KeyboardEvent;

describe("taunt keys", () => {
  it("sends the slot for Tab + digit and swallows both keys", () => {
    const onTaunt = vi.fn();
    const keys = createTauntKeys(onTaunt);
    expect(keys.intercept(key("Tab"))).toBe(true);
    expect(keys.intercept(key("Digit3"))).toBe(true);
    expect(keys.intercept(key("Numpad9"))).toBe(true);
    expect(onTaunt.mock.calls).toEqual([[3], [9]]);
  });

  it("lets digits through as typing when Tab is not held", () => {
    const onTaunt = vi.fn();
    const keys = createTauntKeys(onTaunt);
    expect(keys.intercept(key("Digit3"))).toBe(false);
    expect(onTaunt).not.toHaveBeenCalled();
  });

  it("ignores digit 0, key repeat and Shift+Tab", () => {
    const onTaunt = vi.fn();
    const keys = createTauntKeys(onTaunt);
    expect(keys.intercept(key("Tab", { shiftKey: true }))).toBe(false);
    keys.intercept(key("Tab"));
    expect(keys.intercept(key("Digit0"))).toBe(false);
    keys.intercept(key("Digit1", { repeat: true }));
    expect(onTaunt).not.toHaveBeenCalled();
  });
});
