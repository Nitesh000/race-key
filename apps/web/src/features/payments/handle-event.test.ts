import { PGlite } from "@electric-sql/pglite";
import { seedCatalog } from "@race-key/db";
import * as s from "@race-key/db/schema";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { beforeAll, describe, expect, it } from "vitest";
import { handlePaymentEvent } from "./handle-event";

const db = drizzle({ client: new PGlite(), schema: s, casing: "snake_case" });

beforeAll(async () => {
  await migrate(db, {
    migrationsFolder: new URL("../../../../../packages/db/migrations", import.meta.url).pathname,
  });
  await seedCatalog(db);
  await db.insert(s.users).values({ id: "u1", name: "u1", email: "u1@example.com" });
  await db.insert(s.profiles).values({ userId: "u1", username: "u1" });
  await db.insert(s.orders).values({
    id: "o1",
    userId: "u1",
    itemType: "skin",
    itemId: "rocket",
    amountCents: 199,
  });
});

const paid = {
  type: "payment.succeeded",
  data: { payment_id: "pay_1", metadata: { orderId: "o1" } },
} as const;

const owned = async () =>
  (await db.select().from(s.userSkins).where(eq(s.userSkins.userId, "u1"))).map((r) => r.skinId);

describe("handlePaymentEvent", () => {
  it("grants the skin once, even if the webhook is delivered twice", async () => {
    expect(await handlePaymentEvent(db, "evt_1", paid)).toBe("granted");
    expect(await handlePaymentEvent(db, "evt_1", paid)).toBe("duplicate");
    expect(await owned()).toEqual(["rocket"]);
    const [order] = await db.select().from(s.orders).where(eq(s.orders.id, "o1"));
    expect([order!.status, order!.dodoPaymentId]).toEqual(["paid", "pay_1"]);
  });

  it("removes the skin and unequips it on refund", async () => {
    await db
      .update(s.profiles)
      .set({ equippedSkinId: "rocket" })
      .where(eq(s.profiles.userId, "u1"));
    const refund = { type: "refund.succeeded", data: { payment_id: "pay_1", refund_id: "r1" } };
    expect(await handlePaymentEvent(db, "evt_2", refund)).toBe("revoked");
    expect(await owned()).toEqual([]);
    const [profile] = await db.select().from(s.profiles).where(eq(s.profiles.userId, "u1"));
    expect(profile!.equippedSkinId).toBe("hatchback");
  });

  it("ignores events for orders it doesn't know", async () => {
    const stray = { ...paid, data: { payment_id: "x", metadata: { orderId: "nope" } } };
    expect(await handlePaymentEvent(db, "evt_3", stray)).toBe("unknown-order");
    expect(await handlePaymentEvent(db, "evt_4", { type: "payout.created", data: {} })).toBe(
      "ignored",
    );
  });
});
