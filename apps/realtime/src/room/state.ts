import {
  AFTER_FIRST_FINISH_MS,
  COUNTDOWN_MS,
  MAX_PLAYERS,
  RECONNECT_MS,
  round1,
  wpm,
  type FinishStats,
  type Phase,
  type PublicPlayer,
  type RacePassage,
  type RaceResult,
  type RoomSnapshot,
  type TickEntry,
  type Ticket,
} from "@race-key/shared";

export const MS_PER_CHAR_LIMIT = 1200;
export const CLIENT_TIME_TOLERANCE_MS = 2000;

export type RoomKind = "public" | "private";

export type Player = {
  id: string;
  uid: string | null;
  name: string;
  level: number;
  skin: string;
  joinedAt: number;
  connected: boolean;
  disconnectedAt: number | null;
  pos: number;
  left: boolean;
  finishedAt: number | null;
  place: number | null;
  timeMs: number | null;
  stats: FinishStats | null;
};

export type RoomData = {
  roomId: string;
  raceId: string;
  kind: RoomKind;
  phase: Phase;
  hostId: string | null;
  passage: RacePassage;
  startsAt: number | null;
  endsAt: number | null;
  firstFinishAt: number | null;
  endedAt: number | null;
  players: Player[];
  results: RaceResult[] | null;
  persisted: boolean;
};

export type JoinResult =
  { ok: true; rejoined: boolean } | { ok: false; code: string; message: string };

export type TickResult = { changed: boolean; ended: boolean };

export class RaceState {
  constructor(public data: RoomData) {}

  static create(opts: {
    roomId: string;
    raceId: string;
    kind: RoomKind;
    passage: RacePassage;
  }): RaceState {
    return new RaceState({
      ...opts,
      phase: "lobby",
      hostId: null,
      startsAt: null,
      endsAt: null,
      firstFinishAt: null,
      endedAt: null,
      players: [],
      results: null,
      persisted: false,
    });
  }

  get phase() {
    return this.data.phase;
  }

  get length() {
    return this.data.passage.text.length;
  }

  player(id: string) {
    return this.data.players.find((p) => p.id === id);
  }

  private active() {
    return this.data.players.filter((p) => !p.left);
  }

  join(t: Pick<Ticket, "sub" | "uid" | "name" | "level" | "skin">, now: number): JoinResult {
    const existing = this.player(t.sub);
    if (existing) {
      existing.connected = true;
      existing.disconnectedAt = null;
      return { ok: true, rejoined: true };
    }
    if (this.data.phase === "racing") {
      return { ok: false, code: "in_progress", message: "This race has already started." };
    }
    if (this.active().length >= MAX_PLAYERS) {
      return { ok: false, code: "full", message: "This room is full." };
    }
    this.data.players.push({
      id: t.sub,
      uid: t.uid,
      name: t.name,
      level: t.level,
      skin: t.skin,
      joinedAt: now,
      connected: true,
      disconnectedAt: null,
      pos: 0,
      left: false,
      finishedAt: null,
      place: null,
      timeMs: null,
      stats: null,
    });
    this.data.hostId ??= t.sub;
    if (this.data.phase === "lobby" && this.active().length >= MAX_PLAYERS)
      this.beginCountdown(now);
    return { ok: true, rejoined: false };
  }

  disconnect(id: string, now: number) {
    const p = this.player(id);
    if (!p || !p.connected) return false;
    p.connected = false;
    p.disconnectedAt = now;
    return true;
  }

  start(byId: string, now: number) {
    if (this.data.phase !== "lobby" || this.data.hostId !== byId) return false;
    if (this.active().length === 0) return false;
    this.beginCountdown(now);
    return true;
  }

  beginCountdown(now: number) {
    this.data.phase = "countdown";
    this.data.startsAt = now + COUNTDOWN_MS;
    this.data.endsAt = this.data.startsAt + this.length * MS_PER_CHAR_LIMIT;
  }

  progress(id: string, pos: number) {
    if (this.data.phase !== "racing") return false;
    const p = this.player(id);
    if (!p || p.left || p.finishedAt !== null) return false;
    if (pos > this.length || pos <= p.pos) return false;
    p.pos = pos;
    return true;
  }

  finish(id: string, stats: FinishStats, now: number) {
    if (this.data.phase !== "racing" || this.data.startsAt === null) return false;
    const p = this.player(id);
    if (!p || p.left || p.finishedAt !== null || p.pos !== this.length) return false;
    const serverMs = now - this.data.startsAt;
    const trusted = stats.timeMs <= serverMs && stats.timeMs >= serverMs - CLIENT_TIME_TOLERANCE_MS;
    p.timeMs = trusted ? stats.timeMs : serverMs;
    p.finishedAt = now;
    p.place = this.data.players.filter((x) => x.finishedAt !== null).length;
    p.stats = stats;
    if (this.data.firstFinishAt === null) {
      this.data.firstFinishAt = now;
      this.data.endsAt = Math.min(this.data.endsAt ?? Infinity, now + AFTER_FIRST_FINISH_MS);
    }
    return true;
  }

  tick(now: number): TickResult {
    const d = this.data;
    let changed = false;

    if (d.phase === "countdown" && d.startsAt !== null && now >= d.startsAt) {
      d.phase = "racing";
      changed = true;
    }

    if (d.phase === "racing") {
      for (const p of d.players) {
        if (expired(p, now) && p.finishedAt === null && !p.left) {
          p.left = true;
          changed = true;
        }
      }
      const running = d.players.filter((p) => !p.left && p.finishedAt === null);
      if (running.length === 0 || (d.endsAt !== null && now >= d.endsAt)) {
        this.end(now);
        return { changed: true, ended: true };
      }
      return { changed, ended: false };
    }

    const before = d.players.length;
    d.players = d.players.filter((p) => !expired(p, now));
    if (d.players.length !== before) {
      changed = true;
      if (!d.players.some((p) => p.id === d.hostId)) d.hostId = d.players[0]?.id ?? null;
      if (d.phase === "countdown" && d.players.length === 0) this.resetToLobby();
    }
    return { changed, ended: false };
  }

  end(now: number) {
    const d = this.data;
    d.phase = "done";
    d.endedAt = now;
    const elapsed = now - (d.startsAt ?? now);
    const finished = d.players
      .filter((p) => p.finishedAt !== null)
      .sort((a, b) => a.place! - b.place!);
    const rest = d.players
      .filter((p) => p.finishedAt === null)
      .sort((a, b) => b.pos - a.pos || a.joinedAt - b.joinedAt);
    d.results = [...finished, ...rest].map((p, i) => {
      p.place = i + 1;
      const timeMs = p.timeMs ?? elapsed;
      return {
        id: p.id,
        name: p.name,
        place: i + 1,
        finished: p.finishedAt !== null,
        wpm: round1(wpm(p.pos, timeMs)),
        accuracy: p.stats?.accuracy ?? 0,
        timeMs,
      };
    });
  }

  again(passage: RacePassage, raceId: string) {
    if (this.data.phase !== "done") return false;
    this.data.passage = passage;
    this.data.raceId = raceId;
    this.data.players = this.data.players.filter((p) => p.connected);
    for (const p of this.data.players) {
      Object.assign(p, {
        pos: 0,
        left: false,
        finishedAt: null,
        place: null,
        timeMs: null,
        stats: null,
      });
    }
    if (!this.data.players.some((p) => p.id === this.data.hostId)) {
      this.data.hostId = this.data.players[0]?.id ?? null;
    }
    this.resetToLobby();
    return true;
  }

  private resetToLobby() {
    Object.assign(this.data, {
      phase: "lobby",
      startsAt: null,
      endsAt: null,
      firstFinishAt: null,
      endedAt: null,
      results: null,
      persisted: false,
    });
  }

  needsClock() {
    const d = this.data;
    return d.phase === "countdown" || d.phase === "racing" || d.players.some((p) => !p.connected);
  }

  liveWpm(p: Player, now: number) {
    if (p.timeMs !== null) return round1(wpm(p.pos, p.timeMs));
    const start = this.data.startsAt;
    if (start === null || now <= start) return 0;
    return round1(wpm(p.pos, now - start));
  }

  tickEntries(now: number): TickEntry[] {
    return this.data.players.filter((p) => !p.left).map((p) => [p.id, p.pos, this.liveWpm(p, now)]);
  }

  snapshot(now: number): RoomSnapshot {
    const d = this.data;
    return {
      roomId: d.roomId,
      raceId: d.raceId,
      phase: d.phase,
      hostId: d.hostId,
      passage: d.passage,
      startsAt: d.startsAt,
      endsAt: d.endsAt,
      results: d.results,
      players: d.players.map((p): PublicPlayer => ({
        id: p.id,
        name: p.name,
        level: p.level,
        skin: p.skin,
        connected: p.connected,
        pos: p.pos,
        wpm: this.liveWpm(p, now),
        place: p.place,
        left: p.left,
      })),
    };
  }
}

function expired(p: Player, now: number) {
  return !p.connected && p.disconnectedAt !== null && now - p.disconnectedAt >= RECONNECT_MS;
}
