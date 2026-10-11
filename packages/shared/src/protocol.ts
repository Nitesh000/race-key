import { z } from "zod";

export const MAX_PLAYERS = 5;
export const COUNTDOWN_MS = 5000;
export const RECONNECT_MS = 10_000;
export const PROGRESS_INTERVAL_MS = 100;
export const AFTER_FIRST_FINISH_MS = 90_000;

export const phases = ["lobby", "countdown", "racing", "done"] as const;
export type Phase = (typeof phases)[number];

export const finishStatsSchema = z.object({
  timeMs: z.number().int().positive(),
  rawWpm: z.number().nonnegative().max(1000),
  accuracy: z.number().min(0).max(1),
  errors: z.number().int().nonnegative(),
  samples: z.array(z.number().nonnegative().max(1000)).max(1200),
  dts: z.array(z.number().int().nonnegative().max(60_000)).max(3000).optional(),
});
export type FinishStats = z.infer<typeof finishStatsSchema>;

export const clientMessageSchema = z.discriminatedUnion("t", [
  z.object({ t: z.literal("start") }),
  z.object({ t: z.literal("again") }),
  z.object({ t: z.literal("progress"), pos: z.number().int().nonnegative() }),
  z.object({ t: z.literal("finish"), stats: finishStatsSchema }),
  z.object({ t: z.literal("ping"), at: z.number() }),
]);
export type ClientMessage = z.infer<typeof clientMessageSchema>;

export type PublicPlayer = {
  id: string;
  name: string;
  level: number;
  skin: string;
  connected: boolean;
  pos: number;
  wpm: number;
  place: number | null;
  left: boolean;
};

export type RacePassage = {
  id: string;
  text: string;
  title: string;
  author: string;
};

export type RaceResult = {
  id: string;
  name: string;
  place: number;
  finished: boolean;
  wpm: number;
  accuracy: number;
  timeMs: number;
};

export type RoomKind = "public" | "private";

export type RoomSnapshot = {
  roomId: string;
  raceId: string;
  kind: RoomKind;
  phase: Phase;
  autoStartAt: number | null;
  hostId: string | null;
  passage: RacePassage;
  players: PublicPlayer[];
  startsAt: number | null;
  endsAt: number | null;
  results: RaceResult[] | null;
};

export type TickEntry = [id: string, pos: number, wpm: number];

export type ServerMessage =
  | { t: "welcome"; you: string; room: RoomSnapshot; now: number }
  | { t: "room"; room: RoomSnapshot; now: number }
  | { t: "tick"; p: TickEntry[] }
  | { t: "pong"; at: number; now: number }
  | { t: "error"; code: string; message: string };

export function parseClientMessage(raw: unknown): ClientMessage | null {
  if (typeof raw !== "string" || raw.length > 64_000) return null;
  try {
    const parsed = clientMessageSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
