import type { Metadata } from "next";
import { AuthUnavailable } from "@/features/auth/auth-unavailable";
import { getLocker } from "@/features/locker/queries";
import { LockerView } from "@/features/locker/locker-view";
import { SessionGate } from "@/features/race/race-entry";
import { authEnabled } from "@/lib/auth";
import { orders } from "@race-key/db";
import { getSkin } from "@race-key/shared";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { paymentsEnabled } from "@/lib/payments";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Locker" };

export default async function LockerPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  if (!authEnabled()) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <AuthUnavailable />
      </main>
    );
  }
  const viewer = await getViewer();
  const orderId = (await searchParams).order;
  const [order] =
    viewer && orderId
      ? await getDb()
          .select()
          .from(orders)
          .where(and(eq(orders.id, orderId), eq(orders.userId, viewer.id)))
      : [];
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Locker</h1>
      {viewer ? (
        <LockerView
          data={await getLocker(viewer)}
          payments={!paymentsEnabled() ? "off" : viewer.isGuest ? "guest" : "on"}
          order={
            order
              ? { status: order.status, item: getSkin(order.itemId)?.name ?? order.itemId }
              : null
          }
        />
      ) : (
        <SessionGate authEnabled>
          <p className="text-muted">Loading your locker…</p>
        </SessionGate>
      )}
    </main>
  );
}
