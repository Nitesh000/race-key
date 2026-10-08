import {
  bigserial,
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { orderStatus, priceType, skinCategory } from "./enums";

export const profiles = pgTable("profiles", {
  userId: text()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  username: text().notNull().unique(),
  level: integer().notNull().default(1),
  xp: integer().notNull().default(0),
  coins: integer().notNull().default(0),
  races: integer().notNull().default(0),
  wins: integer().notNull().default(0),
  bestWpm: real().notNull().default(0),
  winStreak: integer().notNull().default(0),
  bestWinStreak: integer().notNull().default(0),
  equippedSkinId: text().notNull().default("hatchback"),
  equippedCaretId: text().notNull().default("caret-line"),
  equippedTrackId: text().notNull().default("track-plain"),
  themeId: text().notNull().default("paper"),
  mode: text().notNull().default("system"),
  statsPrivate: boolean().notNull().default(false),
  lastDailyBonusAt: timestamp({ withTimezone: true }),
  lastSeenAt: timestamp({ withTimezone: true }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const coinLedger = pgTable(
  "coin_ledger",
  {
    id: bigserial({ mode: "number" }).primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    delta: integer().notNull(),
    balance: integer().notNull(),
    reason: text().notNull(),
    refId: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.userId, t.createdAt)],
);

export const achievements = pgTable("achievements", {
  id: text().primaryKey(),
  name: text().notNull(),
  description: text().notNull(),
  icon: text().notNull(),
  rewardCoins: integer().notNull().default(0),
  rewardSkinId: text(),
  rewardEmoji: text(),
});

export const userAchievements = pgTable(
  "user_achievements",
  {
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    achievementId: text()
      .notNull()
      .references(() => achievements.id),
    unlockedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.achievementId] })],
);

export const skins = pgTable("skins", {
  id: text().primaryKey(),
  name: text().notNull(),
  category: skinCategory().notNull(),
  priceType: priceType().notNull(),
  price: integer().notNull().default(0),
  achievementId: text().references(() => achievements.id),
  dodoProductId: text(),
  asset: text().notNull(),
  active: boolean().notNull().default(true),
});

export const userSkins = pgTable(
  "user_skins",
  {
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skinId: text()
      .notNull()
      .references(() => skins.id),
    source: text().notNull(),
    acquiredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.skinId] })],
);

export const themes = pgTable("themes", {
  id: text().primaryKey(),
  name: text().notNull(),
  priceType: priceType().notNull(),
  price: integer().notNull().default(0),
  achievementId: text().references(() => achievements.id),
  dodoProductId: text(),
});

export const userThemes = pgTable(
  "user_themes",
  {
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    themeId: text()
      .notNull()
      .references(() => themes.id),
    source: text().notNull(),
    acquiredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.themeId] })],
);

export const emojiLoadouts = pgTable("emoji_loadouts", {
  userId: text()
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  slots: text().array().notNull(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

export const userEmojis = pgTable(
  "user_emojis",
  {
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emoji: text().notNull(),
    source: text().notNull(),
    acquiredAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.emoji] })],
);

export const orders = pgTable(
  "orders",
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    itemType: text().notNull(),
    itemId: text().notNull(),
    status: orderStatus().notNull().default("pending"),
    amountCents: integer().notNull(),
    currency: text().notNull().default("USD"),
    dodoCheckoutId: text(),
    dodoPaymentId: text().unique(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.userId)],
);

export const webhookEvents = pgTable("webhook_events", {
  id: text().primaryKey(),
  type: text().notNull(),
  processedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
