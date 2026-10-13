import { adSlots } from "@race-key/db";
import { eq, sql } from "drizzle-orm";
import { adsEnabled } from "@/features/ads/queries";
import { getDb } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!adsEnabled()) return Response.redirect(new URL("/", req.url), 302);
  const [row] = await getDb()
    .update(adSlots)
    .set({ clicks: sql`${adSlots.clicks} + 1` })
    .where(eq(adSlots.id, (await params).id))
    .returning({ link: adSlots.houseLink });
  return Response.redirect(row?.link ?? new URL("/", req.url).toString(), 302);
}
