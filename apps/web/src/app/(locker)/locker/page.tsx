import type { Metadata } from "next";
import { AuthUnavailable } from "@/features/auth/auth-unavailable";
import { getLocker } from "@/features/locker/queries";
import { LockerView } from "@/features/locker/locker-view";
import { SessionGate } from "@/features/race/race-entry";
import { authEnabled } from "@/lib/auth";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Locker" };

export default async function LockerPage() {
  if (!authEnabled()) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <AuthUnavailable />
      </main>
    );
  }
  const viewer = await getViewer();
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Locker</h1>
      {viewer ? (
        <LockerView
          data={await getLocker(viewer)}
          premium={<span className="text-center text-xs text-muted">Premium</span>}
        />
      ) : (
        <SessionGate authEnabled>
          <p className="text-muted">Loading your locker…</p>
        </SessionGate>
      )}
    </main>
  );
}
