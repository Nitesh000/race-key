import { describe, expect, it } from "vitest";
import { addToRoom, bracketHalfWidth, candidates, type OpenRoom } from "./matching";

const room = (id: string, wpm: number, createdAt = 0, seated = 1): OpenRoom => ({
  id,
  wpm,
  seated,
  createdAt,
  closesAt: createdAt + 12_500,
});

describe("matching", () => {
  it("starts with a 20 wpm bracket that widens with waiting", () => {
    expect(bracketHalfWidth(0)).toBe(10);
    expect(bracketHalfWidth(10_000)).toBe(25);
  });

  it("only offers rooms in the bracket, fullest first", () => {
    const rooms = [room("slow", 30), room("close", 65), room("busy", 58, 0, 3), room("fast", 120)];
    expect(candidates(rooms, 60, 0).map((r) => r.id)).toEqual(["busy", "close"]);
  });

  it("lets a room that has waited take players further away", () => {
    const rooms = [room("waited", 80, 0)];
    expect(candidates(rooms, 60, 1_000)).toHaveLength(0);
    expect(candidates(rooms, 60, 6_000)).toHaveLength(0);
    expect(candidates(rooms, 60, 7_000)).toHaveLength(1);
  });

  it("skips rooms about to start and treats new players as 40 wpm", () => {
    expect(candidates([room("soon", 40)], 0, 11_500)).toHaveLength(0);
    expect(candidates([room("new", 40)], 0, 0)).toHaveLength(1);
  });

  it("keeps a running average of the room", () => {
    expect(addToRoom(room("r", 60), 80)).toMatchObject({ seated: 2, wpm: 70 });
  });
});
