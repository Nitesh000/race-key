import "server-only";
import { createDb, type Db } from "@race-key/db";
import { env } from "./env";

let db: Db | null = null;

export function hasDb() {
  return !!env("DATABASE_URL");
}

export function getDb(): Db {
  if (db) return db;
  const url = env("DATABASE_URL");
  if (!url) throw new Error("DATABASE_URL is not set");
  db = createDb(url);
  return db;
}
