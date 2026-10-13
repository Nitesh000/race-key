"use client";

import {
  LOADOUT_SIZE,
  achievements,
  caretStyles,
  emojis,
  isUnlocked,
  lanePatterns,
  lockReason,
  ownsSkin,
  racerCategories,
  skins,
  type Skin,
} from "@race-key/shared";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { updateSettings, type CaretStyle, type LanePattern } from "@/features/settings/store";
import { Racer } from "@/features/skins/racer";
import { Emoji } from "@/features/taunts/emoji";
import { ThemePicker } from "@/features/themes/theme-picker";
import { cn } from "@/lib/cn";
import {
  buySkin,
  buyTheme,
  equipSkin,
  saveLoadout,
  selectTheme,
  type ActionResult,
} from "./actions";
import { PremiumButton } from "@/features/payments/premium-button";
import type { LockerData } from "./queries";

type Tab = "racers" | "carets" | "tracks" | "themes" | "emoji" | "achievements";

const tabs: { value: Tab; label: string }[] = [
  { value: "racers", label: "Racers" },
  { value: "carets", label: "Carets" },
  { value: "tracks", label: "Tracks" },
  { value: "themes", label: "Themes" },
  { value: "emoji", label: "Taunts" },
  { value: "achievements", label: "Achievements" },
];

export function LockerView({
  data,
  payments,
  order,
}: {
  data: LockerData;
  payments: "off" | "guest" | "on";
  order: { status: string; item: string } | null;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("racers");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const ownership = useMemo(
    () => ({
      owned: new Set(data.ownedSkins),
      level: data.level,
      achievements: new Set(Object.keys(data.achievements)),
    }),
    [data],
  );

  const run = (action: () => Promise<ActionResult>, after?: () => void) =>
    start(async () => {
      setError(null);
      const res = await action();
      if (!res.ok) return setError(res.error);
      after?.();
      router.refresh();
    });

  const equipped = new Set([data.equipped.skin, data.equipped.caret, data.equipped.track]);

  const item = (s: Skin, preview: React.ReactNode) => {
    const owned = ownsSkin(s, ownership);
    const isEquipped = equipped.has(s.id);
    return (
      <li
        key={s.id}
        className={cn(
          "flex flex-col gap-2 rounded-xl border bg-surface p-3",
          isEquipped ? "border-accent ring-2 ring-accent" : "border-border",
        )}
      >
        <div className="grid h-14 place-items-center rounded-lg bg-lane">{preview}</div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="font-medium">{s.name}</span>
          {!owned && <span className="text-xs text-muted">{lockReason(s)}</span>}
        </div>
        {isEquipped ? (
          <span className="text-center text-sm text-accent">Equipped</span>
        ) : owned ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              run(
                () => equipSkin(s.id),
                () => {
                  if (s.category === "caret") {
                    updateSettings({ caret: caretStyles[s.id] as CaretStyle });
                  }
                  if (s.category === "track") {
                    updateSettings({ lane: lanePatterns[s.id] as LanePattern });
                  }
                },
              )
            }
          >
            Equip
          </Button>
        ) : s.priceType === "coins" ? (
          <Button
            size="sm"
            disabled={pending || data.coins < s.price}
            onClick={() => run(() => buySkin(s.id))}
          >
            Buy for {s.price} coins
          </Button>
        ) : s.priceType === "premium" ? (
          <PremiumButton skinId={s.id} price={s.price} state={payments} />
        ) : (
          <span className="text-center text-xs text-muted">Locked</span>
        )}
      </li>
    );
  };

  const racers = skins.filter((s) => racerCategories.includes(s.category));
  const carets = skins.filter((s) => s.category === "caret");
  const tracks = skins.filter((s) => s.category === "track");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Locker section" value={tab} onChange={setTab} options={tabs} />
        <span className="font-mono text-sm text-muted">
          ◎ {data.coins} coins · level {data.level}
        </span>
      </div>
      {data.isGuest && (
        <p className="rounded-lg bg-surface-2 px-4 py-2 text-sm text-muted">
          You&apos;re playing as a guest. Sign up to keep your coins and skins on every device.
        </p>
      )}
      {order && (
        <p role="status" className="rounded-lg bg-surface-2 px-4 py-2 text-sm">
          {order.status === "paid"
            ? `Thanks! ${order.item} is in your locker.`
            : order.status === "pending"
              ? "Payment received. Your skin appears here in a moment, refresh if it doesn't."
              : "That payment didn't go through. You weren't charged."}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      {tab === "racers" && (
        <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {racers.map((s) => item(s, <Racer skin={s.id} you className="h-10" />))}
        </ul>
      )}
      {tab === "carets" && (
        <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {carets.map((s) =>
            item(
              s,
              <span className="relative font-mono text-xl">
                ab
                <span
                  className={cn(
                    "caret static inline-block align-middle",
                    `caret-${caretStyles[s.id]}`,
                  )}
                  style={{
                    height: caretStyles[s.id] === "underline" ? 2 : "1.2em",
                    width: caretStyles[s.id] === "block" ? "0.6em" : undefined,
                    animation: "none",
                    transition: "none",
                  }}
                />
              </span>,
            ),
          )}
        </ul>
      )}
      {tab === "tracks" && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tracks.map((s) =>
            item(
              s,
              <div
                className={cn(
                  "h-5 w-4/5 rounded-full bg-lane-you",
                  lanePatterns[s.id] !== "plain" && `lane-${lanePatterns[s.id]}`,
                )}
              />,
            ),
          )}
        </ul>
      )}
      {tab === "themes" && (
        <Card>
          <ThemePicker
            owned={new Set(data.ownedThemes)}
            level={data.level}
            onPick={(theme, mode) => run(() => selectTheme(theme, mode))}
            onBuy={(theme) => run(() => buyTheme(theme))}
          />
        </Card>
      )}
      {tab === "emoji" && (
        <LoadoutEditor
          data={data}
          pending={pending}
          onSave={(slots) => run(() => saveLoadout(slots))}
        />
      )}
      {tab === "achievements" && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {achievements.map((a) => {
            const at = data.achievements[a.id];
            return (
              <li
                key={a.id}
                className={cn(
                  "flex items-center gap-3 rounded-xl border border-border bg-surface p-3",
                  !at && "opacity-60",
                )}
              >
                <Emoji char={a.icon} className={cn("size-8", !at && "grayscale")} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{a.name}</p>
                  <p className="text-sm text-muted">{a.description}</p>
                </div>
                <span className="text-right text-xs text-muted">
                  {at ? new Date(at).toLocaleDateString("en") : `+${a.rewardCoins} coins`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function LoadoutEditor({
  data,
  pending,
  onSave,
}: {
  data: LockerData;
  pending: boolean;
  onSave: (slots: string[]) => void;
}) {
  const [slots, setSlots] = useState(data.loadout.slice(0, LOADOUT_SIZE));
  const [active, setActive] = useState(0);
  const opts = {
    level: data.level,
    achievements: new Set(Object.keys(data.achievements)),
    owned: new Set(data.ownedEmojis),
  };
  const changed = slots.join() !== data.loadout.join();

  const assign = (char: string) => {
    setSlots((current) => {
      const next = [...current];
      const existing = next.indexOf(char);
      if (existing >= 0) next[existing] = next[active]!;
      next[active] = char;
      return next;
    });
    setActive((a) => (a + 1) % LOADOUT_SIZE);
  };

  return (
    <Card className="space-y-5">
      <div>
        <CardTitle>Your taunts</CardTitle>
        <p className="text-sm text-muted">
          Hold Tab and press 1 to 9 during a race. Pick a slot, then an emoji.
        </p>
      </div>
      <ol className="grid grid-cols-9 gap-2">
        {slots.map((c, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              aria-label={`Slot ${i + 1}`}
              className={cn(
                "flex w-full flex-col items-center gap-1 rounded-lg border p-2",
                active === i ? "border-accent ring-2 ring-accent" : "border-border",
              )}
            >
              <Emoji char={c} className="size-7" />
              <span className="font-mono text-xs text-muted">{i + 1}</span>
            </button>
          </li>
        ))}
      </ol>
      <ul className="grid grid-cols-6 gap-2 sm:grid-cols-10">
        {emojis.map((e) => {
          const unlocked = isUnlocked(e, opts);
          const reason =
            e.unlock.type === "level"
              ? `Level ${e.unlock.level}`
              : e.unlock.type === "achievement"
                ? (achievements.find(
                    (a) => a.id === (e.unlock as { achievement: string }).achievement,
                  )?.name ?? "Achievement")
                : "";
          return (
            <li key={e.char}>
              <button
                type="button"
                disabled={!unlocked}
                onClick={() => assign(e.char)}
                title={unlocked ? e.name : `${e.name}: unlock with ${reason}`}
                className={cn(
                  "grid w-full place-items-center rounded-lg p-2 hover:bg-surface-2 disabled:opacity-35",
                  slots.includes(e.char) && "bg-surface-2",
                )}
              >
                <Emoji char={e.char} className={cn("size-7", !unlocked && "grayscale")} />
              </button>
            </li>
          );
        })}
      </ul>
      <Button disabled={!changed || pending} onClick={() => onSave(slots)}>
        Save taunts
      </Button>
    </Card>
  );
}
