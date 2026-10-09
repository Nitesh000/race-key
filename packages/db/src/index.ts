import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export { schema };
export * from "./schema";

function isLocal(url: string) {
  const host = new URL(url).hostname;
  return host === "localhost" || host === "127.0.0.1";
}

export function createDb(url: string) {
  if (isLocal(url)) {
    return drizzlePg({
      client: postgres(url, { max: 1, onnotice: () => {} }),
      schema,
      casing: "snake_case",
    });
  }
  return drizzleNeon({ client: neon(url), schema, casing: "snake_case" });
}

export type Db = ReturnType<typeof createDb>;
