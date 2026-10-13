import { challenges, profiles } from "@race-key/db";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChallengeResponse } from "@/features/challenges/challenge-response";
import { CopyLink } from "@/features/challenges/copy-link";
import { SessionGate } from "@/features/race/race-entry";
import { authEnabled } from "@/lib/auth";
import { getDb, hasDb } from "@/lib/db";
import { getViewer } from "@/lib/session";

export const metadata: Metadata = { title: "Challenge" };

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  if (!hasDb()) notFound();
  const { id } = await params;
  const [row] = await getDb()
    .select({ challenge: challenges, from: profiles.username })
    .from(challenges)
    .innerJoin(profiles, eq(profiles.userId, challenges.fromUserId))
    .where(eq(challenges.id, id));
  if (!row) notFound();
  const { challenge, from } = row;
  const viewer = await getViewer();
  const mine = viewer?.id === challenge.fromUserId;
  const forSomeoneElse =
    !!challenge.toUserId && !!viewer && challenge.toUserId !== viewer.id && !mine;
  const open = challenge.status === "pending" && challenge.expiresAt.getTime() > Date.now();

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <Card className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">
          {mine ? "Your challenge" : `${from} challenged ${challenge.toUserId ? "you" : "anyone"}`}
        </h1>
        {mine ? (
          <>
            <p className="text-muted">
              Send this link to whoever you want to race. It works for{" "}
              {open ? "the next minute" : "no one now"}.
            </p>
            <CopyLink path={`/challenge/${challenge.id}`} />
            <Link href={`/race/${challenge.roomId}`} className={buttonClass()}>
              Go to the race room
            </Link>
          </>
        ) : forSomeoneElse ? (
          <p className="text-muted">This challenge was sent to someone else.</p>
        ) : !open ? (
          <p className="text-muted">
            This challenge {challenge.status === "pending" ? "expired" : `was ${challenge.status}`}.
          </p>
        ) : viewer ? (
          <ChallengeResponse id={challenge.id} expiresAt={challenge.expiresAt.getTime()} />
        ) : (
          <SessionGate authEnabled={authEnabled()}>
            <p className="text-muted">Getting you a seat…</p>
          </SessionGate>
        )}
      </Card>
    </main>
  );
}
