import { neon } from "@neondatabase/serverless";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export { schema };
export { seedCatalog } from "./catalog";
export * from "./schema";

const localOptions = { max: 5, idle_timeout: 10, onnotice: () => {} };

function isLocal(url: string) {
  const host = new URL(url).hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export type AnyDb = PgDatabase<PgQueryResultHKT, typeof schema>;

export function createDb(url: string): AnyDb {
  if (isLocal(url)) {
    return drizzlePg({
      client: postgres(url, localOptions),
      schema,
      casing: "snake_case",
    });
  }
  return drizzleNeon({ client: neon(url), schema, casing: "snake_case" });
}

export type Db = AnyDb;
