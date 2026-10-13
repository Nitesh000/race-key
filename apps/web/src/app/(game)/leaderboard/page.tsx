import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { LeaderboardTable } from "@/features/leaderboard/leaderboard-table";
import { getLeaderboard, type Board } from "@/features/leaderboard/queries";
import { cn } from "@/lib/cn";
import { hasDb } from "@/lib/db";

export const metadata: Metadata = { title: "Leaderboards" };

const boards: { value: Board; label: string }[] = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "This week" },
  { value: "all", label: "All time" },
];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string }>;
}) {
  const requested = (await searchParams).board;
  const board: Board = requested === "daily" || requested === "all" ? requested : "weekly";
  const rows = hasDb() ? await getLeaderboard(board, 50) : [];
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold">Leaderboards</h1>
      <nav aria-label="Leaderboard period" className="inline-flex rounded-lg bg-surface-2 p-1">
        {boards.map((b) => (
          <Link
            key={b.value}
            href={`/leaderboard?board=${b.value}`}
            aria-current={board === b.value ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-1 text-sm",
              board === b.value ? "bg-surface text-text shadow-sm" : "text-muted hover:text-text",
            )}
          >
            {b.label}
          </Link>
        ))}
      </nav>
      <Card>
        <LeaderboardTable rows={rows} empty="No races yet in this period. Be the first." />
      </Card>
      <p className="text-xs text-muted">
        Each player&apos;s best finished race. Bots and races flagged by the anti-cheat checks never
        count. Updates every minute.
      </p>
    </main>
  );
}
