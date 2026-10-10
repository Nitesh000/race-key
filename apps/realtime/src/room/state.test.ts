import { COUNTDOWN_MS, MAX_PLAYERS, RECONNECT_MS } from "@race-key/shared";
import { describe, expect, it } from "vitest";
import { RaceState } from "./state";

const passage = { id: "p1", text: "the quick brown fox", title: "T", author: "A" };
const len = passage.text.length;

function ticket(sub: string) {
  return { sub, uid: sub, name: sub, level: 1, skin: "hatchback" };
}

function room() {
  return RaceState.create({ roomId: "r", raceId: "race1", kind: "private", passage });
}

function racing(players = ["a", "b"]) {
  const s = room();
  players.forEach((p) => s.join(ticket(p), 0));
  s.start(players[0]!, 0);
  s.tick(COUNTDOWN_MS);
  return s;
}

const stats = (timeMs: number) => ({
  timeMs,
  rawWpm: 60,
  accuracy: 0.98,
  errors: 1,
  samples: [60],
});

describe("RaceState", () => {
  it("makes the first player host and only lets the host start", () => {
    const s = room();
    s.join(ticket("a"), 0);
    s.join(ticket("b"), 0);
    expect(s.data.hostId).toBe("a");
    expect(s.start("b", 0)).toBe(false);
    expect(s.start("a", 0)).toBe(true);
    expect(s.phase).toBe("countdown");
    expect(s.data.startsAt).toBe(COUNTDOWN_MS);
  });

  it("starts the countdown on its own when the room fills", () => {
    const s = room();
    for (let i = 0; i < MAX_PLAYERS; i++) s.join(ticket(`p${i}`), 0);
    expect(s.phase).toBe("countdown");
    expect(s.join(ticket("late"), 0)).toMatchObject({ ok: false, code: "full" });
  });

  it("switches to racing when the countdown runs out and rejects late joiners", () => {
    const s = racing();
    expect(s.phase).toBe("racing");
    expect(s.join(ticket("c"), COUNTDOWN_MS + 1)).toMatchObject({ ok: false, code: "in_progress" });
  });

  it("only accepts progress that moves forward inside the passage", () => {
    const s = racing();
    expect(s.progress("a", 5)).toBe(true);
    expect(s.progress("a", 3)).toBe(false);
    expect(s.progress("a", len + 1)).toBe(false);
    expect(s.player("a")!.pos).toBe(5);
  });

  it("needs the full passage before finishing and ranks by finish order", () => {
    const s = racing();
    expect(s.finish("a", stats(4000), COUNTDOWN_MS + 4000)).toBe(false);
    s.progress("b", len);
    s.progress("a", len);
    s.finish("b", stats(3000), COUNTDOWN_MS + 3000);
    const r = s.tick(COUNTDOWN_MS + 3100);
    expect(r.ended).toBe(false);
    s.finish("a", stats(4000), COUNTDOWN_MS + 4000);
    expect(s.tick(COUNTDOWN_MS + 4001)).toEqual({ changed: true, ended: true });
    expect(s.data.results!.map((x) => [x.id, x.place])).toEqual([
      ["b", 1],
      ["a", 2],
    ]);
  });

  it("uses server time when the client time is not believable", () => {
    const s = racing(["a"]);
    s.progress("a", len);
    s.finish("a", stats(500), COUNTDOWN_MS + 6000);
    expect(s.player("a")!.timeMs).toBe(6000);
  });

  it("keeps a disconnected racer for the reconnect window, then drops them", () => {
    const s = racing();
    s.progress("a", 4);
    s.disconnect("a", COUNTDOWN_MS + 1000);
    s.tick(COUNTDOWN_MS + 1000 + RECONNECT_MS - 1);
    expect(s.player("a")!.left).toBe(false);
    expect(s.join(ticket("a"), COUNTDOWN_MS + 2000)).toEqual({ ok: true, rejoined: true });
    expect(s.player("a")!.pos).toBe(4);
    s.disconnect("b", COUNTDOWN_MS + 2000);
    s.tick(COUNTDOWN_MS + 2000 + RECONNECT_MS);
    expect(s.player("b")!.left).toBe(true);
  });

  it("ends when everyone still racing has finished, ranking dnf by distance", () => {
    const s = racing(["a", "b", "c"]);
    s.progress("b", 7);
    s.progress("c", 9);
    s.disconnect("b", COUNTDOWN_MS);
    s.tick(COUNTDOWN_MS + RECONNECT_MS);
    s.progress("a", len);
    s.finish("a", stats(2000), COUNTDOWN_MS + RECONNECT_MS + 10);
    s.disconnect("c", COUNTDOWN_MS + RECONNECT_MS);
    const r = s.tick(COUNTDOWN_MS + 2 * RECONNECT_MS);
    expect(r.ended).toBe(true);
    expect(s.data.results!.map((x) => [x.id, x.finished])).toEqual([
      ["a", true],
      ["c", false],
      ["b", false],
    ]);
  });

  it("removes players who leave the lobby and hands host to the next one", () => {
    const s = room();
    s.join(ticket("a"), 0);
    s.join(ticket("b"), 0);
    s.disconnect("a", 0);
    s.tick(RECONNECT_MS);
    expect(s.data.players.map((p) => p.id)).toEqual(["b"]);
    expect(s.data.hostId).toBe("b");
  });

  it("resets for another race with the players still here", () => {
    const s = racing(["a", "b"]);
    s.disconnect("b", COUNTDOWN_MS);
    s.progress("a", len);
    s.finish("a", stats(1000), COUNTDOWN_MS + 1000);
    s.tick(COUNTDOWN_MS + RECONNECT_MS);
    expect(s.phase).toBe("done");
    expect(s.again({ ...passage, id: "p2" }, "race2")).toBe(true);
    expect(s.phase).toBe("lobby");
    expect(s.data.players.map((p) => [p.id, p.pos])).toEqual([["a", 0]]);
    expect(s.data.raceId).toBe("race2");
  });
});
