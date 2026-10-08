import { pgEnum } from "drizzle-orm/pg-core";

export const priceType = pgEnum("price_type", ["free", "coins", "level", "achievement", "premium"]);
export const passageType = pgEnum("passage_type", ["paragraph", "dialogue", "quote"]);
export const raceKind = pgEnum("race_kind", ["public", "private", "challenge", "practice"]);
export const skinCategory = pgEnum("skin_category", ["car", "animal", "vehicle", "caret", "track"]);
export const friendshipStatus = pgEnum("friendship_status", ["pending", "accepted"]);
export const challengeStatus = pgEnum("challenge_status", [
  "pending",
  "accepted",
  "declined",
  "expired",
  "done",
]);
export const orderStatus = pgEnum("order_status", ["pending", "paid", "failed", "refunded"]);
export const reportStatus = pgEnum("report_status", ["open", "resolved", "dismissed"]);
export const adKind = pgEnum("ad_kind", ["adsense", "house"]);
export const statKind = pgEnum("stat_kind", ["key", "pair", "word"]);
