import {
  AFTER_FIRST_FINISH_MS,
  CHAT_COOLDOWN_MS,
  CHAT_HISTORY,
  COUNTDOWN_MS,
  TAUNT_COOLDOWN_MS,
  defaultLoadout,
  filterChat,
  type ChatMessage,
  MAX_PLAYERS,
  RECONNECT_MS,
  round1,
  uniqueNames,
  wpm,
  type FinishStats,
  type Phase,
  type PublicPlayer,
  type RacePassage,
  type RaceResult,
  type RoomKind,
  type RoomSnapshot,
  type Rng,
  type TickEntry,
  type Ticket,
} from "@race-key/shared";
import { finishFlags, maxPlausiblePos } from "../anticheat";
import { autoStartDelay, botJoinTimes, botLevel } from "../bots/roster";
import { botTargetWpm, roomBaseline } from "../bots/speed";
import { planTypist, positionAt, sampleSpeeds, type TypistPlan } from "../bots/typist";

export const MS_PER_CHAR_LIMIT = 1200;
export const CLIENT_TIME_TOLERANCE_MS = 2000;
export const JOIN_CUTOFF_MS = 1500;

export type BotState = { target: number; plan: TypistPlan | null };

export type Player = {
  id: string;
  uid: string | null;
  name: string;
  level: number;
  skin: string;
  avgWpm: number;
  emojis: string[];
  lastTauntAt: number;
  lastChatAt: number;
  bot: BotState | null;
  joinedAt: number;
  connected: boolean;
  disconnectedAt: number | null;
  pos: number;
  left: boolean;
  finishedAt: number | null;
  place: number | null;
  timeMs: number | null;
  stats: FinishStats | null;
  flags: string[];
};

export type Reservation = { sub: string; until: number };

export type RoomData = {
  roomId: string;
  raceId: string;
  kind: RoomKind;
  phase: Phase;
  closed: boolean;
  hostId: string | null;
  passage: RacePassage;
  createdAt: number;
  autoStartAt: number | null;
  botJoins: number[];
  reservations: Reservation[];
  startsAt: number | null;
  endsAt: number | null;
  firstFinishAt: number | null;
  endedAt: number | null;
  players: Player[];
  results: RaceResult[] | null;
  chat: ChatMessage[];
  persisted: boolean;
};

export type Taunt = { from: string; emoji: string };

export type JoinResult =
  { ok: true; rejoined: boolean } | { ok: false; code: string; message: string };

export type TickResult = { changed: boolean; ended: boolean };

type Identity = Pick<Ticket, "sub" | "uid" | "name" | "level" | "skin" | "wpm"> & {
  emojis?: string[];
};

export const BOT_TAUNT_CHANCE = 0.35;

export class RaceState {
  private taunts: Taunt[] = [];

  constructor(
    public data: RoomData,
    private rng: Rng = Math.random,
  ) {}

  static create(
    opts: { roomId: string; raceId: string; kind: RoomKind; passage: RacePassage; now: number },
    rng: Rng = Math.random,
  ): RaceState {
    const isPublic = opts.kind === "public";
    const autoStartAt = isPublic ? opts.now + autoStartDelay(rng) : null;
    return new RaceState(
      {
        roomId: opts.roomId,
        raceId: opts.raceId,
        kind: opts.kind,
        passage: opts.passage,
        createdAt: opts.now,
        phase: "lobby",
        closed: false,
        hostId: null,
        autoStartAt,
        botJoins: autoStartAt ? botJoinTimes(opts.now, autoStartAt, MAX_PLAYERS - 1, rng) : [],
        reservations: [],
        startsAt: null,
        endsAt: null,
        firstFinishAt: null,
        endedAt: null,
        players: [],
        results: null,
        chat: [],
        persisted: false,
      },
      rng,
    );
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

  humans() {
    return this.data.players.filter((p) => !p.bot);
  }

  bots() {
    return this.data.players.filter((p) => p.bot);
  }

  private taken(except?: string) {
    const seated = this.data.players.filter((p) => !p.left).length;
    const held = this.data.reservations.filter((r) => r.sub !== except).length;
    return seated + held;
  }

  reserve(sub: string, now: number) {
    const d = this.data;
    if (d.closed || d.phase !== "lobby") return false;
    if (d.autoStartAt !== null && now > d.autoStartAt - JOIN_CUTOFF_MS) return false;
    if (this.player(sub) || d.reservations.some((r) => r.sub === sub)) return true;
    if (this.taken() >= MAX_PLAYERS) return false;
    d.reservations.push({ sub, until: now + RECONNECT_MS });
    return true;
  }

  join(t: Identity, now: number): JoinResult {
    const d = this.data;
    const existing = this.player(t.sub);
    if (existing) {
      existing.connected = true;
      existing.disconnectedAt = null;
      return { ok: true, rejoined: true };
    }
    if (d.closed) return { ok: false, code: "closed", message: "This race has ended." };
    if (d.phase === "racing") {
      return { ok: false, code: "in_progress", message: "This race has already started." };
    }
    if (this.taken(t.sub) >= MAX_PLAYERS) {
      return { ok: false, code: "full", message: "This room is full." };
    }
    d.reservations = d.reservations.filter((r) => r.sub !== t.sub);
    d.players.push(this.newPlayer({ ...t, bot: null }, now));
    if (d.kind === "private") d.hostId ??= t.sub;
    if (d.phase === "lobby" && this.taken() >= MAX_PLAYERS) this.beginCountdown(now);
    return { ok: true, rejoined: false };
  }

  private newPlayer(p: Identity & { bot: BotState | null }, now: number, connected = true): Player {
    return {
      id: p.sub,
      uid: p.uid,
      name: p.name,
      level: p.level,
      skin: p.skin,
      avgWpm: p.wpm,
      emojis: p.emojis?.length ? p.emojis : defaultLoadout,
      lastTauntAt: -Infinity,
      lastChatAt: -Infinity,
      bot: p.bot,
      joinedAt: now,
      connected,
      disconnectedAt: null,
      pos: 0,
      left: false,
      finishedAt: null,
      place: null,
      timeMs: null,
      stats: null,
      flags: [],
    };
  }

  addBot(now: number) {
    const [name] = uniqueNames(
      1,
      this.data.players.map((p) => p.name),
      this.rng,
    );
    const id = `b_${Math.floor(this.rng() * 2 ** 32).toString(36)}_${this.data.players.length}`;
    const level = botLevel(
      this.humans().map((p) => p.level),
      this.rng,
    );
    this.data.players.push(
      this.newPlayer(
        {
          sub: id,
          uid: null,
          name: name!,
          level,
          skin: "hatchback",
          wpm: 0,
          bot: { target: 0, plan: null },
        },
        now,
        true,
      ),
    );
  }

  disconnect(id: string, now: number) {
    const p = this.player(id);
    if (!p || p.bot || !p.connected) return false;
    p.connected = false;
    p.disconnectedAt = now;
    return true;
  }

  start(byId: string, now: number) {
    if (this.data.kind !== "private") return false;
    if (this.data.phase !== "lobby" || this.data.hostId !== byId) return false;
    if (this.humans().length === 0) return false;
    this.beginCountdown(now);
    return true;
  }

  beginCountdown(now: number) {
    const d = this.data;
    if (d.kind === "public") {
      d.botJoins = [];
      d.reservations = [];
      while (d.players.filter((p) => !p.left).length < MAX_PLAYERS) this.addBot(now);
    }
    const baseline = roomBaseline(this.humans().map((p) => p.avgWpm));
    for (const p of this.bots()) {
      const target = botTargetWpm(baseline, this.rng);
      p.bot = { target, plan: planTypist(d.passage.text, target, this.rng) };
    }
    d.phase = "countdown";
    d.startsAt = now + COUNTDOWN_MS;
    d.endsAt = d.startsAt + this.length * MS_PER_CHAR_LIMIT;
  }

  progress(id: string, pos: number, now: number) {
    if (this.data.phase !== "racing" || this.data.startsAt === null) return false;
    const p = this.player(id);
    if (!p || p.bot || p.left || p.finishedAt !== null) return false;
    if (pos > this.length || pos <= p.pos) return false;
    const limit = maxPlausiblePos(now - this.data.startsAt);
    if (pos > limit) {
      flag(p, "speed");
      pos = Math.max(p.pos, limit);
      if (pos === p.pos) return false;
    }
    p.pos = pos;
    return true;
  }

  finish(id: string, stats: FinishStats, now: number) {
    if (this.data.phase !== "racing" || this.data.startsAt === null) return false;
    const p = this.player(id);
    if (!p || p.bot || p.left || p.finishedAt !== null || p.pos !== this.length) return false;
    const serverMs = now - this.data.startsAt;
    const trusted = stats.timeMs <= serverMs && stats.timeMs >= serverMs - CLIENT_TIME_TOLERANCE_MS;
    const timeMs = trusted ? stats.timeMs : serverMs;
    for (const f of finishFlags(stats, this.length, timeMs)) flag(p, f);
    this.markFinished(p, timeMs, now, { ...stats, dts: undefined });
    return true;
  }

  private markFinished(p: Player, timeMs: number, at: number, stats: FinishStats) {
    p.pos = this.length;
    p.timeMs = timeMs;
    p.finishedAt = at;
    p.place = this.data.players.filter((x) => x.finishedAt !== null).length;
    p.stats = stats;
    if (this.data.firstFinishAt === null) {
      this.data.firstFinishAt = at;
      this.data.endsAt = Math.min(this.data.endsAt ?? Infinity, at + AFTER_FIRST_FINISH_MS);
    }
  }

  taunt(id: string, slot: number, now: number): Taunt | null {
    const p = this.player(id);
    if (!p || p.left || this.data.closed) return null;
    if (now - p.lastTauntAt < TAUNT_COOLDOWN_MS) return null;
    const emoji = p.emojis[slot - 1];
    if (!emoji) return null;
    p.lastTauntAt = now;
    return { from: p.id, emoji };
  }

  chat(id: string, text: string, now: number): ChatMessage | null {
    const d = this.data;
    if (d.phase !== "lobby" && d.phase !== "done") return null;
    const p = this.player(id);
    if (!p || p.bot) return null;
    if (now - p.lastChatAt < CHAT_COOLDOWN_MS) return null;
    const clean = filterChat(text);
    if (!clean) return null;
    p.lastChatAt = now;
    const m: ChatMessage = {
      id: `${now.toString(36)}${Math.floor(this.rng() * 1e6).toString(36)}`,
      from: p.id,
      name: p.name,
      text: clean,
      at: now,
    };
    d.chat = [...d.chat, m].slice(-CHAT_HISTORY);
    return m;
  }

  chatMessage(id: string) {
    return this.data.chat.find((m) => m.id === id) ?? null;
  }

  drainTaunts() {
    const out = this.taunts;
    this.taunts = [];
    return out;
  }

  private finishBot(p: Player, plan: TypistPlan) {
    const len = this.length;
    this.markFinished(p, Math.round(plan.durationMs), this.data.startsAt! + plan.durationMs, {
      timeMs: Math.round(plan.durationMs),
      rawWpm: round1(wpm(plan.keystrokes, plan.durationMs)),
      accuracy: len / (len + plan.errors),
      errors: plan.errors,
      samples: sampleSpeeds(plan),
    });
    if (p.place! <= 2 && this.rng() < BOT_TAUNT_CHANCE) {
      const pickFrom = ["🏁", "😎", "🔥", "👋", "🚀"];
      this.taunts.push({ from: p.id, emoji: pickFrom[Math.floor(this.rng() * pickFrom.length)]! });
    }
  }

  private moveBots(now: number) {
    let finished = false;
    const elapsed = now - this.data.startsAt!;
    for (const p of this.bots()) {
      const plan = p.bot?.plan;
      if (!plan || p.finishedAt !== null) continue;
      if (elapsed >= plan.durationMs) {
        this.finishBot(p, plan);
        finished = true;
      } else {
        p.pos = positionAt(plan, elapsed);
      }
    }
    return finished;
  }

  tick(now: number): TickResult {
    const d = this.data;
    let changed = false;

    if (d.phase === "lobby") {
      d.reservations = d.reservations.filter((r) => r.until > now);
      while (d.botJoins.length && d.botJoins[0]! <= now) {
        d.botJoins.shift();
        const someoneComing = this.humans().length > 0 || d.reservations.length > 0;
        if (this.taken() < MAX_PLAYERS && someoneComing) {
          this.addBot(now);
          changed = true;
        }
      }
    }

    if (d.phase === "countdown" && d.startsAt !== null && now >= d.startsAt) {
      d.phase = "racing";
      changed = true;
    }

    if (d.phase === "racing") {
      if (this.moveBots(now)) changed = true;
      for (const p of d.players) {
        if (expired(p, now) && p.finishedAt === null && !p.left) {
          p.left = true;
          changed = true;
        }
      }
      const humansRunning = this.humans().filter((p) => !p.left && p.finishedAt === null);
      const timedOut = d.endsAt !== null && now >= d.endsAt;
      if (humansRunning.length === 0 || timedOut) {
        if (!timedOut) this.fastForwardBots();
        this.end(now);
        return { changed: true, ended: true };
      }
      return { changed, ended: false };
    }

    const before = d.players.length;
    d.players = d.players.filter((p) => !expired(p, now));
    if (d.players.length !== before) {
      changed = true;
      if (!d.players.some((p) => p.id === d.hostId)) {
        d.hostId = d.kind === "private" ? (this.humans()[0]?.id ?? null) : null;
      }
    }

    const noHumans = this.humans().length === 0 && d.reservations.length === 0;
    if (d.kind === "public" && !d.closed && d.phase !== "done" && noHumans && now > d.createdAt) {
      this.close();
      return { changed: true, ended: false };
    }
    if (d.kind === "private" && d.phase === "countdown" && this.humans().length === 0) {
      this.resetToLobby();
      changed = true;
    }

    if (
      d.phase === "lobby" &&
      d.autoStartAt !== null &&
      now >= d.autoStartAt &&
      this.humans().length > 0
    ) {
      this.beginCountdown(now);
      changed = true;
    }
    return { changed, ended: false };
  }

  private fastForwardBots() {
    const endsAt = this.data.endsAt ?? Infinity;
    for (const p of this.bots()) {
      const plan = p.bot?.plan;
      if (!plan || p.finishedAt !== null) continue;
      if (this.data.startsAt! + plan.durationMs <= endsAt) this.finishBot(p, plan);
      else p.pos = positionAt(plan, endsAt - this.data.startsAt!);
    }
  }

  private close() {
    const d = this.data;
    d.closed = true;
    d.phase = "done";
    d.players = d.players.filter((p) => !p.bot);
    d.botJoins = [];
  }

  end(now: number) {
    const d = this.data;
    d.phase = "done";
    d.endedAt = now;
    const elapsed = now - (d.startsAt ?? now);
    const finished = d.players
      .filter((p) => p.finishedAt !== null)
      .sort((a, b) => a.finishedAt! - b.finishedAt! || a.place! - b.place!);
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
    if (this.data.phase !== "done" || this.data.kind !== "private") return false;
    this.data.passage = passage;
    this.data.raceId = raceId;
    this.data.players = this.data.players.filter((p) => p.connected && !p.bot);
    for (const p of this.data.players) {
      Object.assign(p, {
        pos: 0,
        left: false,
        finishedAt: null,
        place: null,
        timeMs: null,
        stats: null,
        flags: [],
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
    if (d.closed) return false;
    if (d.phase === "countdown" || d.phase === "racing") return true;
    if (d.phase === "lobby" && (d.autoStartAt !== null || d.reservations.length > 0)) return true;
    return d.players.some((p) => !p.connected);
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
      kind: d.kind,
      phase: d.phase,
      autoStartAt: d.autoStartAt,
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

function flag(p: Player, reason: string) {
  if (!p.flags.includes(reason)) p.flags.push(reason);
}

function expired(p: Player, now: number) {
  return !p.connected && p.disconnectedAt !== null && now - p.disconnectedAt >= RECONNECT_MS;
}
