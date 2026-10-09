import "server-only";
import { profiles, type Db } from "@race-key/db";
import { randomName, usernameSchema } from "@race-key/shared";
import { sql } from "drizzle-orm";

export function sanitizeUsername(raw: string) {
  const cleaned = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .replace(/[^a-zA-Z0-9_.-]/g, "")
    .slice(0, 16);
  return usernameSchema.safeParse(cleaned).success ? cleaned : randomName();
}

export async function usernameTaken(db: Db, name: string) {
  const rows = await db
    .select({ id: profiles.userId })
    .from(profiles)
    .where(sql`lower(${profiles.username}) = lower(${name})`)
    .limit(1);
  return rows.length > 0;
}

export async function claimUsername(db: Db, wanted: string) {
  let name = sanitizeUsername(wanted);
  for (let i = 0; i < 20 && (await usernameTaken(db, name)); i++) {
    name = i < 10 ? `${name.slice(0, 16)}${Math.floor(Math.random() * 900 + 100)}` : randomName();
  }
  return name;
}
