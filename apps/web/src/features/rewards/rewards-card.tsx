"use client";

import { achievements, type RewardSummary } from "@race-key/shared";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Emoji } from "@/features/taunts/emoji";

export function RewardsCard({ rewards }: { rewards: RewardSummary }) {
  const router = useRouter();
  useEffect(() => router.refresh(), [router, rewards]);

  const unlocked = rewards.achievements
    .map((id) => achievements.find((a) => a.id === id))
    .filter((a) => !!a);

  return (
    <div className="space-y-3 rounded-xl bg-surface-2 p-4" aria-live="polite">
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono tabular-nums">
        <span>
          <span className="text-xl font-semibold text-text">+{rewards.coins}</span>{" "}
          <span className="text-muted">coins</span>
        </span>
        <span>
          <span className="text-xl font-semibold text-text">+{rewards.xp}</span>{" "}
          <span className="text-muted">xp</span>
        </span>
        {rewards.leveledUp && (
          <span className="font-sans font-semibold text-success">
            Level up! You are level {rewards.level}
          </span>
        )}
      </div>
      <ul className="space-y-1 text-sm text-muted">
        {rewards.daily && <li>Includes the first-race-of-the-day bonus.</li>}
        {rewards.multiplier < 1 && (
          <li>
            Races with bots pay {Math.round(rewards.multiplier * 100)}%. Race real players for full
            rewards.
          </li>
        )}
      </ul>
      {unlocked.length > 0 && (
        <ul className="space-y-1">
          {unlocked.map((a) => (
            <li key={a.id} className="flex items-center gap-2 text-sm">
              <Emoji char={a.icon} />
              <span className="font-medium">Achievement: {a.name}</span>
              <span className="text-muted">+{a.rewardCoins} coins</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
