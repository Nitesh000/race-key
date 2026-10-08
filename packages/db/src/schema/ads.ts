import { bigserial, boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { adKind } from "./enums";

export const adSlots = pgTable("ad_slots", {
  id: text().primaryKey(),
  placement: text().notNull(),
  kind: adKind().notNull().default("house"),
  enabled: boolean().notNull().default(false),
  width: integer().notNull(),
  height: integer().notNull(),
  adsenseSlot: text(),
  houseImage: text(),
  houseLink: text(),
  houseAlt: text(),
  advertiser: text(),
  startsAt: timestamp({ withTimezone: true }),
  endsAt: timestamp({ withTimezone: true }),
  impressions: integer().notNull().default(0),
  clicks: integer().notNull().default(0),
});

export const adInquiries = pgTable("ad_inquiries", {
  id: bigserial({ mode: "number" }).primaryKey(),
  name: text().notNull(),
  email: text().notNull(),
  company: text(),
  budget: text(),
  message: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});
