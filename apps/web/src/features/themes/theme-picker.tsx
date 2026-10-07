"use client";

import { modePreferences, themes, type ModePreference } from "@race-key/themes";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/cn";
import { useTheme } from "./theme-provider";

function RacePreview({ themeId, mode }: { themeId: string; mode: "light" | "dark" }) {
  return (
    <div
      data-theme={themeId}
      data-mode={mode}
      className="rounded-lg bg-bg p-2 text-[10px] text-text"
    >
      <div className="mb-1.5 space-y-0.5 rounded bg-track p-1">
        <div className="h-1.5 w-full rounded-full bg-lane">
          <div className="h-1.5 w-2/3 rounded-full bg-racer" />
        </div>
        <div className="h-1.5 w-full rounded-full bg-lane-you">
          <div className="h-1.5 w-1/2 rounded-full bg-accent" />
        </div>
      </div>
      <p className="font-mono leading-tight">
        <span className="text-correct">It was the </span>
        <span className="bg-wrong-bg text-wrong">v</span>
        <span className="border-l border-caret text-untyped">est of times</span>
      </p>
    </div>
  );
}

const modeLabels: Record<ModePreference, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

export function ThemePicker({ owned }: { owned?: Set<string> }) {
  const { theme, mode, setTheme, setMode } = useTheme();
  return (
    <div className="space-y-4">
      <Segmented
        label="Color mode"
        value={mode}
        onChange={setMode}
        options={modePreferences.map((m) => ({ value: m, label: modeLabels[m] }))}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((t) => {
          const locked = t.priceType !== "free" && owned && !owned.has(t.id);
          return (
            <button
              key={t.id}
              type="button"
              disabled={locked}
              onClick={() => setTheme(t.id)}
              aria-pressed={theme === t.id}
              className={cn(
                "rounded-xl border bg-surface p-3 text-left transition-colors disabled:opacity-60",
                theme === t.id
                  ? "border-accent ring-2 ring-accent"
                  : "border-border hover:border-muted",
              )}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{t.name}</span>
                <span className="text-xs text-muted">
                  {unlockLabel(t.priceType, t.price, locked)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <RacePreview themeId={t.id} mode="light" />
                <RacePreview themeId={t.id} mode="dark" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function unlockLabel(type: string, price: number | undefined, locked: boolean | undefined) {
  if (type === "free") return "Free";
  if (!locked) return "Owned";
  if (type === "level") return `Level ${price}`;
  if (type === "coins") return `${price} coins`;
  if (type === "premium") return "Premium";
  return "Achievement";
}
