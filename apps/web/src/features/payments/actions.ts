"use server";

import { orders, userSkins } from "@race-key/db";
import { getSkin } from "@race-key/shared";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { siteUrl } from "@/lib/env";
import { dodo, paymentsEnabled, productIds } from "@/lib/payments";
import { getViewer } from "@/lib/session";

export async function startCheckout(
  skinId: string,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  if (!paymentsEnabled()) return { ok: false, error: "Purchases are not available yet." };
  const viewer = await getViewer();
  if (!viewer || viewer.isGuest) return { ok: false, error: "Sign up to buy premium skins." };
  const skin = getSkin(skinId);
  const productId = skin && productIds()[skin.id];
  if (!skin || skin.priceType !== "premium" || !productId) {
    return { ok: false, error: "That item isn't for sale." };
  }
  const db = getDb();
  const owned = await db
    .select()
    .from(userSkins)
    .where(and(eq(userSkins.userId, viewer.id), eq(userSkins.skinId, skin.id)));
  if (owned.length) return { ok: false, error: "You already own it." };

  const orderId = crypto.randomUUID();
  await db.insert(orders).values({
    id: orderId,
    userId: viewer.id,
    itemType: "skin",
    itemId: skin.id,
    amountCents: skin.price,
  });
  const base = siteUrl() ?? "http://localhost:3000";
  const session = await dodo().checkoutSessions.create({
    product_cart: [{ product_id: productId, quantity: 1 }],
    customer: { email: viewer.email, name: viewer.profile.username },
    return_url: `${base}/locker?order=${orderId}`,
    metadata: { orderId, userId: viewer.id, skinId: skin.id },
  });
  await db.update(orders).set({ dodoCheckoutId: session.session_id }).where(eq(orders.id, orderId));
  if (!session.checkout_url) return { ok: false, error: "Checkout could not be started." };
  return { ok: true, url: session.checkout_url };
}
