import { bigserial, index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { challengeStatus, friendshipStatus, reportStatus } from "./enums";

export const friendships = pgTable(
  "friendships",
  {
    requesterId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addresseeId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: friendshipStatus().notNull().default("pending"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    acceptedAt: timestamp({ withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.requesterId, t.addresseeId] }), index().on(t.addresseeId)],
);

export const challenges = pgTable(
  "challenges",
  {
    id: text().primaryKey(),
    fromUserId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toUserId: text().references(() => users.id, { onDelete: "cascade" }),
    status: challengeStatus().notNull().default("pending"),
    roomId: text().notNull(),
    passageId: text(),
    rematchOf: text(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.toUserId, t.status)],
);

export const chatReports = pgTable("chat_reports", {
  id: bigserial({ mode: "number" }).primaryKey(),
  reporterId: text().references(() => users.id, { onDelete: "set null" }),
  reportedName: text().notNull(),
  reportedUserId: text().references(() => users.id, { onDelete: "set null" }),
  roomId: text().notNull(),
  message: text().notNull(),
  reason: text(),
  status: reportStatus().notNull().default("open"),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
