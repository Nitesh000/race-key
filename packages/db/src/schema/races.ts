import {
  bigint,
  bigserial,
  boolean,
  customType,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { raceKind, statKind } from "./enums";
import { passages } from "./passages";

const bytea = customType<{ data: Uint8Array; driverData: Uint8Array | string }>({
  dataType: () => "bytea",
  toDriver: (v) => Buffer.from(v),
  fromDriver: (v) =>
    typeof v === "string" ? new Uint8Array(Buffer.from(v.replace(/^\\x/, ""), "hex")) : v,
});

export const races = pgTable(
  "races",
  {
    id: text().primaryKey(),
    passageId: text()
      .notNull()
      .references(() => passages.id),
    kind: raceKind().notNull().default("public"),
    challengeId: text(),
    realPlayers: smallint().notNull(),
    botPlayers: smallint().notNull(),
    startedAt: timestamp({ withTimezone: true }).notNull(),
    finishedAt: timestamp({ withTimezone: true }),
  },
  (t) => [index().on(t.startedAt)],
);

export const raceResults = pgTable(
  "race_results",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    raceId: text()
      .notNull()
      .references(() => races.id, { onDelete: "cascade" }),
    userId: text().references(() => users.id, { onDelete: "cascade" }),
    isBot: boolean().notNull().default(false),
    displayName: text().notNull(),
    passageId: text()
      .notNull()
      .references(() => passages.id),
    placement: smallint().notNull(),
    finished: boolean().notNull().default(true),
    wpm: real().notNull(),
    rawWpm: real().notNull(),
    accuracy: real().notNull(),
    timeMs: integer().notNull(),
    chars: integer().notNull(),
    errors: integer().notNull(),
    roomSize: smallint().notNull(),
    realOpponents: smallint().notNull(),
    botOpponents: smallint().notNull(),
    samples: real().array().notNull().default([]),
    consistency: real(),
    flagged: boolean().notNull().default(false),
    flagReason: text(),
    coinsEarned: integer().notNull().default(0),
    xpEarned: integer().notNull().default(0),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.userId, t.createdAt),
    index().on(t.passageId, t.wpm),
    index().on(t.createdAt),
  ],
);

export const raceKeystrokes = pgTable("race_keystrokes", {
  resultId: bigint({ mode: "number" })
    .primaryKey()
    .references(() => raceResults.id, { onDelete: "cascade" }),
  data: bytea().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const playerStatsDaily = pgTable(
  "player_stats_daily",
  {
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    day: date({ mode: "string" }).notNull(),
    races: integer().notNull().default(0),
    realRaces: integer().notNull().default(0),
    wins: integer().notNull().default(0),
    realWins: integer().notNull().default(0),
    podiums: integer().notNull().default(0),
    wpmSum: real().notNull().default(0),
    bestWpm: real().notNull().default(0),
    accuracySum: real().notNull().default(0),
    chars: integer().notNull().default(0),
    errors: integer().notNull().default(0),
    timeMs: integer().notNull().default(0),
    hours: integer().array().notNull().default([]),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

export const playerKeyStats = pgTable(
  "player_key_stats",
  {
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: statKind().notNull(),
    key: text().notNull(),
    hits: integer().notNull().default(0),
    misses: integer().notNull().default(0),
    totalMs: integer().notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.kind, t.key] })],
);
