import "server-only";
import { adSlots } from "@race-key/db";
import { and, eq, gt, isNull, lte, or, sql } from "drizzle-orm";
import { getDb, hasDb } from "@/lib/db";
import { env } from "@/lib/env";

export type Placement = "home-sidebar" | "lobby" | "results";

export type ActiveAd =
  | { id: string; kind: "adsense"; width: number; height: number; slot: string; client: string }
  | {
      id: string;
      kind: "house";
      width: number;
      height: number;
      image: string;
      alt: string;
      advertiser: string | null;
    };

export function adsEnabled() {
  return env("ADS_ENABLED") === "true" && hasDb();
}

export async function getAd(placement: Placement): Promise<ActiveAd | null> {
  if (!adsEnabled()) return null;
  const now = new Date();
  const rows = await getDb()
    .select()
    .from(adSlots)
    .where(
      and(
        eq(adSlots.placement, placement),
        eq(adSlots.enabled, true),
        or(isNull(adSlots.startsAt), lte(adSlots.startsAt, now)),
        or(isNull(adSlots.endsAt), gt(adSlots.endsAt, now)),
      ),
    );
  const client = env("NEXT_PUBLIC_ADSENSE_CLIENT");
  const usable = rows.filter((r) =>
    r.kind === "adsense" ? !!(client && r.adsenseSlot) : !!(r.houseImage && r.houseLink),
  );
  const row = usable[Math.floor(Math.random() * usable.length)];
  if (!row) return null;
  if (row.kind === "adsense") {
    return {
      id: row.id,
      kind: "adsense",
      width: row.width,
      height: row.height,
      slot: row.adsenseSlot!,
      client: client!,
    };
  }
  await getDb()
    .update(adSlots)
    .set({ impressions: sql`${adSlots.impressions} + 1` })
    .where(eq(adSlots.id, row.id));
  return {
    id: row.id,
    kind: "house",
    width: row.width,
    height: row.height,
    image: row.houseImage!,
    alt: row.houseAlt ?? "Advertisement",
    advertiser: row.advertiser,
  };
}
