"use client";

import { Card, CardTitle } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { ThemePicker } from "@/features/themes/theme-picker";
import {
  fontFamilies,
  updateSettings,
  useSettings,
  type CaretStyle,
  type TrackDisplay,
  type TypingFont,
} from "./store";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <span>{label}</span>
      {children}
    </div>
  );
}

export function SettingsForm() {
  const s = useSettings();
  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Theme</CardTitle>
        <ThemePicker />
      </Card>
      <Card>
        <CardTitle>Typing</CardTitle>
        <div className="divide-y divide-border">
          <Row label="Font">
            <select
              value={s.font}
              onChange={(e) => updateSettings({ font: e.target.value as TypingFont })}
              className="h-9 rounded-lg border border-border bg-surface px-2"
            >
              {Object.entries(fontFamilies).map(([id, f]) => (
                <option key={id} value={id}>
                  {f.label}
                </option>
              ))}
            </select>
          </Row>
          <Row label={`Font size (${s.fontSize}px)`}>
            <input
              type="range"
              min={16}
              max={36}
              value={s.fontSize}
              onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
              className="accent-[var(--accent)]"
            />
          </Row>
          <Row label="Caret">
            <Segmented<CaretStyle>
              label="Caret style"
              value={s.caret}
              onChange={(caret) => updateSettings({ caret })}
              options={[
                { value: "line" as const, label: "Line" },
                { value: "block" as const, label: "Block" },
                { value: "underline" as const, label: "Underline" },
                ...(s.caret === "thick" ? [{ value: "thick" as const, label: "Thick" }] : []),
                ...(s.caret === "glow" ? [{ value: "glow" as const, label: "Glow" }] : []),
              ]}
            />
          </Row>
          <Row label="Race track">
            <Segmented<TrackDisplay>
              label="Race track display"
              value={s.track}
              onChange={(track) => updateSettings({ track })}
              options={[
                { value: "full", label: "Full" },
                { value: "minimal", label: "Minimal" },
                { value: "hidden", label: "Hidden" },
              ]}
            />
          </Row>
          <Row label="Key sounds">
            <Switch
              label="Key sounds"
              checked={s.sound}
              onChange={(sound) => updateSettings({ sound })}
            />
          </Row>
          <Row label="Countdown sound">
            <Switch
              label="Countdown sound"
              checked={s.countdownSound}
              onChange={(countdownSound) => updateSettings({ countdownSound })}
            />
          </Row>
          <Row label="Reduced motion">
            <Switch
              label="Reduced motion"
              checked={s.reducedMotion}
              onChange={(reducedMotion) => updateSettings({ reducedMotion })}
            />
          </Row>
          <Row label="Mute taunts">
            <Switch
              label="Mute taunts"
              checked={s.muteTaunts}
              onChange={(muteTaunts) => updateSettings({ muteTaunts })}
            />
          </Row>
        </div>
      </Card>
    </div>
  );
}
