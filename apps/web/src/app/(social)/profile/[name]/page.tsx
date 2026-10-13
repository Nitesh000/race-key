import { levelProgress } from "@race-key/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { ChallengeButton } from "@/features/challenges/challenge-button";
import { FriendButton } from "@/features/friends/friend-button";
import { relationTo } from "@/features/friends/queries";
import { getProfileByName, getProfileSummary } from "@/features/profile/queries";
import { getViewer } from "@/lib/session";
import { hasDb } from "@/lib/db";

type Props = { params: Promise<{ name: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: decodeURIComponent((await params).name) };
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs tracking-wide text-muted uppercase">{label}</dt>
      <dd className="font-mono text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

export default async function ProfilePage({ params }: Props) {
  if (!hasDb()) notFound();
  const name = decodeURIComponent((await params).name);
  const row = await getProfileByName(name);
  if (!row) notFound();
  const { profile } = row;
  const summary = await getProfileSummary(profile.userId);
  const progress = levelProgress(profile.xp);
  const viewer = await getViewer();
  const relation = viewer ? await relationTo(viewer.id, profile.userId) : "none";

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <div className="flex items-center gap-4">
        <div className="grid size-16 place-items-center rounded-2xl bg-surface-2 text-xs text-muted">
          {profile.equippedSkinId}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{profile.username}</h1>
          <p className="text-muted">
            Level {profile.level}
            {row.isAnonymous && " · guest"} · joined {row.joined.toLocaleDateString("en")}
          </p>
          <div
            className="mt-2 h-2 w-56 overflow-hidden rounded-full bg-surface-2"
            role="progressbar"
            aria-label="Progress to next level"
            aria-valuenow={progress.into}
            aria-valuemax={progress.needed}
          >
            <div
              className="h-full bg-accent"
              style={{ width: `${(progress.into / progress.needed) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            {progress.into} / {progress.needed} xp to level {progress.level + 1}
          </p>
        </div>
        {viewer && relation !== "self" && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {!viewer.isGuest && (
              <FriendButton
                relation={relation}
                userId={profile.userId}
                username={profile.username}
              />
            )}
            <ChallengeButton to={profile.userId} />
          </div>
        )}
      </div>
      <Card>
        <div className="flex items-baseline justify-between">
          <CardTitle>Summary</CardTitle>
          <Link
            href={`/profile/${profile.username}/stats`}
            className="text-sm text-accent hover:underline"
          >
            Detailed stats →
          </Link>
        </div>
        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat label="Avg wpm (last 10)" value={Math.round(summary.last10)} />
          <Stat label="Avg wpm (all time)" value={Math.round(summary.avgWpm)} />
          <Stat label="Best wpm" value={Math.round(summary.bestWpm)} />
          <Stat label="Accuracy" value={`${(summary.accuracy * 100).toFixed(1)}%`} />
          <Stat label="Races" value={summary.races} />
          <Stat label="Wins" value={summary.wins} />
          <Stat label="Level" value={profile.level} />
          <Stat label="Best streak" value={profile.bestWinStreak} />
        </dl>
      </Card>
    </main>
  );
}
