import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthUnavailable } from "@/features/auth/auth-unavailable";
import { FriendsView } from "@/features/friends/friends-view";
import { getFriends } from "@/features/friends/queries";
import { authEnabled } from "@/lib/auth";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Friends" };

export default async function FriendsPage() {
  if (!authEnabled()) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <AuthUnavailable />
      </main>
    );
  }
  const viewer = await getViewer();
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold">Friends</h1>
      {!viewer || viewer.isGuest ? (
        <Card className="space-y-3">
          <p>Make an account to add friends, see who&apos;s online and challenge them.</p>
          <Link href="/signup?next=/friends" className={buttonClass()}>
            Sign up
          </Link>
        </Card>
      ) : (
        <FriendsView {...await getFriends(viewer.id)} />
      )}
    </main>
  );
}
