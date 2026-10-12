import { achievements as achievementList, skins as skinList } from "@race-key/shared";
import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { achievements, skins } from "./schema";

export async function seedCatalog(db: PgDatabase<PgQueryResultHKT, Record<string, unknown>>) {
  await db
    .insert(achievements)
    .values(achievementList)
    .onConflictDoUpdate({
      target: achievements.id,
      set: {
        name: sql`excluded.name`,
        description: sql`excluded.description`,
        icon: sql`excluded.icon`,
        rewardCoins: sql`excluded.reward_coins`,
      },
    });
  await db
    .insert(skins)
    .values(
      skinList.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category,
        priceType: s.priceType,
        price: s.price,
        achievementId: s.achievement ?? null,
        asset: s.id,
      })),
    )
    .onConflictDoUpdate({
      target: skins.id,
      set: {
        name: sql`excluded.name`,
        category: sql`excluded.category`,
        priceType: sql`excluded.price_type`,
        price: sql`excluded.price`,
        achievementId: sql`excluded.achievement_id`,
      },
    });
}
