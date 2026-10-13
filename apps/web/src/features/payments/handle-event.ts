import { orders, profiles, userSkins, webhookEvents, type AnyDb } from "@race-key/db";
import { defaultEquipped } from "@race-key/shared";
import { and, eq } from "drizzle-orm";

export type PaymentEvent = { type: string; data: unknown };

type PaymentData = { payment_id: string; metadata: Record<string, string> };
type RefundData = { payment_id: string };

export async function handlePaymentEvent(db: AnyDb, eventId: string, event: PaymentEvent) {
  const fresh = await db
    .insert(webhookEvents)
    .values({ id: eventId, type: event.type })
    .onConflictDoNothing()
    .returning();
  if (fresh.length === 0) return "duplicate";

  if (event.type === "payment.succeeded") {
    const { payment_id, metadata } = event.data as PaymentData;
    const [order] = await db
      .update(orders)
      .set({ status: "paid", dodoPaymentId: payment_id, updatedAt: new Date() })
      .where(eq(orders.id, metadata.orderId ?? ""))
      .returning();
    if (!order) return "unknown-order";
    if (order.itemType === "skin") {
      await db
        .insert(userSkins)
        .values({ userId: order.userId, skinId: order.itemId, source: "premium" })
        .onConflictDoNothing();
    }
    return "granted";
  }

  if (event.type === "payment.failed" || event.type === "payment.cancelled") {
    const { metadata } = event.data as PaymentData;
    await db
      .update(orders)
      .set({ status: "failed", updatedAt: new Date() })
      .where(and(eq(orders.id, metadata.orderId ?? ""), eq(orders.status, "pending")));
    return "failed";
  }

  if (event.type === "refund.succeeded") {
    const { payment_id } = event.data as RefundData;
    const [order] = await db
      .update(orders)
      .set({ status: "refunded", updatedAt: new Date() })
      .where(eq(orders.dodoPaymentId, payment_id))
      .returning();
    if (!order) return "unknown-order";
    if (order.itemType === "skin") {
      await db
        .delete(userSkins)
        .where(and(eq(userSkins.userId, order.userId), eq(userSkins.skinId, order.itemId)));
      await db
        .update(profiles)
        .set({ equippedSkinId: defaultEquipped.skin })
        .where(and(eq(profiles.userId, order.userId), eq(profiles.equippedSkinId, order.itemId)));
    }
    return "revoked";
  }

  return "ignored";
}
