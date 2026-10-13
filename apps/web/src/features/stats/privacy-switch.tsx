"use client";

import { useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { setStatsPrivate } from "./actions";

export function PrivacySwitch({ value }: { value: boolean }) {
  const [, start] = useTransition();
  return (
    <label className="flex items-center gap-3 text-sm text-muted">
      Hide my detailed stats from others
      <Switch
        label="Hide my detailed stats"
        checked={value}
        onChange={(v) => start(() => setStatsPrivate(v))}
      />
    </label>
  );
}
