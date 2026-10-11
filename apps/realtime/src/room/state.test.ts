import { COUNTDOWN_MS, MAX_PLAYERS, RECONNECT_MS, mulberry32 } from "@race-key/shared";
import { describe, expect, it } from "vitest";
import { RaceState } from "./state";

const passage = { id: "p1", text: "the quick brown fox", title: "T", author: "A" };
const len = passage.text.length;

function ticket(sub: string) {
  return { sub, uid: sub, name: sub, level: 1, skin: "hatchback", wpm: 60 };
}

function room() {
  return RaceState.create({ roomId: "r", raceId: "race1", kind: "private", passage, now: 0 });
}

function racing(players = ["a", "b"]) {
  const s = room();
  players.forEach((p) => s.join(ticket(p), 0));
  s.start(players[0]!, 0);
  s.tick(COUNTDOWN_MS);
  return s;
}

const humanGaps = (n: number) => Array.from({ length: n }, (_, i) => 90 + ((i * 37) % 140));

const stats = (timeMs: number) => ({
  timeMs,
  rawWpm: 60,
  accuracy: 0.98,
  errors: 1,
  samples: [60],
});

describe("private rooms", () => {
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
    expect(s.progress("a", 5, COUNTDOWN_MS + 500)).toBe(true);
    expect(s.progress("a", 3, COUNTDOWN_MS + 500)).toBe(false);
    expect(s.progress("a", len + 1, COUNTDOWN_MS + 500)).toBe(false);
    expect(s.player("a")!.pos).toBe(5);
  });

  it("needs the full passage before finishing and ranks by finish order", () => {
    const s = racing();
    expect(s.finish("a", stats(4000), COUNTDOWN_MS + 4000)).toBe(false);
    s.progress("b", len, COUNTDOWN_MS + 500);
    s.progress("a", len, COUNTDOWN_MS + 500);
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
    s.progress("a", len, COUNTDOWN_MS + 500);
    s.finish("a", stats(500), COUNTDOWN_MS + 6000);
    expect(s.player("a")!.timeMs).toBe(6000);
  });

  it("keeps a disconnected racer for the reconnect window, then drops them", () => {
    const s = racing();
    s.progress("a", 4, COUNTDOWN_MS + 500);
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
    s.progress("b", 7, COUNTDOWN_MS + 500);
    s.progress("c", 9, COUNTDOWN_MS + 500);
    s.disconnect("b", COUNTDOWN_MS);
    s.tick(COUNTDOWN_MS + RECONNECT_MS);
    s.progress("a", len, COUNTDOWN_MS + 500);
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
    s.progress("a", len, COUNTDOWN_MS + 500);
    s.finish("a", stats(1000), COUNTDOWN_MS + 1000);
    s.tick(COUNTDOWN_MS + RECONNECT_MS);
    expect(s.phase).toBe("done");
    expect(s.again({ ...passage, id: "p2" }, "race2")).toBe(true);
    expect(s.phase).toBe("lobby");
    expect(s.data.players.map((p) => [p.id, p.pos])).toEqual([["a", 0]]);
    expect(s.data.raceId).toBe("race2");
  });
});

const longText = "It was the best of times, it was the worst of times, it was the age of wisdom.";

function publicRoom(seed = 1) {
  return RaceState.create(
    {
      roomId: "pub",
      raceId: "race-pub",
      kind: "public",
      passage: { ...passage, text: longText },
      now: 0,
    },
    mulberry32(seed),
  );
}

describe("anticheat in the room", () => {
  it("clamps and flags progress that is faster than anyone can type", () => {
    const s = racing(["a"]);
    expect(s.progress("a", len, COUNTDOWN_MS + 100)).toBe(true);
    expect(s.player("a")!.pos).toBe(18);
    expect(s.player("a")!.flags).toEqual(["speed"]);
  });

  it("flags robotic timing at the finish and leaves clean racers alone", () => {
    const text = "the quick brown fox jumps over the lazy dog ".repeat(3).trim();
    const s = RaceState.create({
      roomId: "r",
      raceId: "race1",
      kind: "private",
      passage: { ...passage, text },
      now: 0,
    });
    s.join(ticket("a"), 0);
    s.join(ticket("b"), 0);
    s.start("a", 0);
    s.tick(COUNTDOWN_MS);
    const at = COUNTDOWN_MS + 30_000;
    s.progress("a", text.length, at);
    s.progress("b", text.length, at);
    s.finish("a", { ...stats(30_000), dts: new Array(text.length).fill(100) }, at);
    s.finish("b", { ...stats(30_000), dts: humanGaps(text.length) }, at);
    expect(s.player("a")!.flags).toEqual(["timing"]);
    expect(s.player("b")!.flags).toEqual([]);
    expect(s.player("b")!.stats!.dts).toBeUndefined();
  });
});

describe("public rooms", () => {
  it("has no host, cannot be started by hand and starts on its own after 12 to 13 s", () => {
    const s = publicRoom();
    expect(s.reserve("a", 0)).toBe(true);
    s.join(ticket("a"), 100);
    expect(s.data.hostId).toBeNull();
    expect(s.start("a", 200)).toBe(false);
    const at = s.data.autoStartAt!;
    expect(at).toBeGreaterThanOrEqual(12_000);
    expect(at).toBeLessThanOrEqual(13_000);
    s.tick(at - 1);
    expect(s.phase).toBe("lobby");
    s.tick(at);
    expect(s.phase).toBe("countdown");
  });

  it("lets bots join one by one during the wait and fills every seat by the start", () => {
    const s = publicRoom(2);
    s.reserve("a", 0);
    s.join(ticket("a"), 0);
    const counts: number[] = [];
    for (let t = 0; t <= s.data.autoStartAt!; t += 100) {
      s.tick(t);
      if (s.phase === "lobby") counts.push(s.bots().length);
    }
    expect(new Set(counts).size).toBeGreaterThan(2);
    expect(s.data.players).toHaveLength(MAX_PLAYERS);
    expect(new Set(s.data.players.map((p) => p.name)).size).toBe(MAX_PLAYERS);
  });

  it("keeps reserved seats away from bots", () => {
    const s = publicRoom(3);
    s.reserve("a", 0);
    s.join(ticket("a"), 0);
    s.tick(11_000);
    const seated = s.data.players.length;
    for (let i = seated; i < MAX_PLAYERS; i++) expect(s.reserve(`r${i}`, 11_000 - 1)).toBe(true);
    s.tick(11_900);
    expect(s.bots().length).toBe(seated - 1);
    expect(s.reserve("late", 11_900)).toBe(false);
  });

  it("gives bots speeds around the real players and moves them during the race", () => {
    const s = publicRoom(4);
    s.reserve("a", 0);
    s.join(ticket("a"), 0);
    s.tick(s.data.autoStartAt!);
    for (const b of s.bots()) {
      expect(b.bot!.target).toBeGreaterThanOrEqual(50);
      expect(b.bot!.target).toBeLessThanOrEqual(70);
    }
    const start = s.data.startsAt!;
    s.tick(start);
    s.tick(start + 4000);
    expect(s.bots().every((b) => b.pos > 0)).toBe(true);
  });

  it("ranks everyone by finish time once the last real player is done", () => {
    const s = publicRoom(5);
    s.reserve("a", 0);
    s.join(ticket("a"), 0);
    s.tick(s.data.autoStartAt!);
    const start = s.data.startsAt!;
    s.tick(start);
    s.progress("a", longText.length, start + 10_000);
    s.finish("a", stats(10_000), start + 10_000);
    const r = s.tick(start + 10_050);
    expect(r.ended).toBe(true);
    const results = s.data.results!;
    expect(results).toHaveLength(MAX_PLAYERS);
    expect(results.every((x) => x.finished)).toBe(true);
    const times = results.map((x) => x.timeMs);
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  it("closes when the only real player leaves the lobby", () => {
    const s = publicRoom(6);
    s.reserve("a", 0);
    s.join(ticket("a"), 0);
    s.tick(3000);
    s.disconnect("a", 3000);
    s.tick(3000 + RECONNECT_MS);
    expect(s.data.closed).toBe(true);
    expect(s.data.players).toHaveLength(0);
    expect(s.join(ticket("b"), 3000 + RECONNECT_MS)).toMatchObject({ ok: false, code: "closed" });
  });
});
