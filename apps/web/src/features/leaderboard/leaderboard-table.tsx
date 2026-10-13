import Link from "next/link";
import { Racer } from "@/features/skins/racer";
import type { LeaderboardRow } from "./queries";

export function LeaderboardTable({ rows, empty }: { rows: LeaderboardRow[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-xs tracking-wide text-muted uppercase">
          <th className="w-10 py-2 font-medium">#</th>
          <th className="py-2 font-medium">Player</th>
          <th className="py-2 text-right font-medium">Best wpm</th>
          <th className="py-2 text-right font-medium">Accuracy</th>
          <th className="hidden py-2 text-right font-medium sm:table-cell">Races</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((r, i) => (
          <tr key={r.username}>
            <td className="py-2 font-mono text-muted">{i + 1}</td>
            <td className="py-2">
              <Link
                href={`/profile/${r.username}`}
                className="inline-flex items-center gap-2 hover:underline"
              >
                <span className="h-4">
                  <Racer skin={r.skin} />
                </span>
                {r.username}
                <span className="text-xs text-muted">
                  Lv {r.level}
                  {r.guest && " · guest"}
                </span>
              </Link>
            </td>
            <td className="py-2 text-right font-mono font-semibold tabular-nums">
              {Math.round(r.wpm)}
            </td>
            <td className="py-2 text-right font-mono text-muted tabular-nums">
              {(r.accuracy * 100).toFixed(1)}%
            </td>
            <td className="hidden py-2 text-right font-mono text-muted tabular-nums sm:table-cell">
              {r.races}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
