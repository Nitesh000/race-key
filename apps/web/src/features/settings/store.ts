"use client";

import { useSyncExternalStore } from "react";

export type TypingFont = "jetbrains" | "plex" | "inter" | "literata";
export type CaretStyle = "line" | "block" | "underline";
export type TrackDisplay = "full" | "minimal" | "hidden";

export type Settings = {
  font: TypingFont;
  fontSize: number;
  caret: CaretStyle;
  sound: boolean;
  reducedMotion: boolean;
  track: TrackDisplay;
  muteTaunts: boolean;
};

export const defaultSettings: Settings = {
  font: "jetbrains",
  fontSize: 22,
  caret: "line",
  sound: false,
  reducedMotion: false,
  track: "full",
  muteTaunts: false,
};

export const fontFamilies: Record<TypingFont, { label: string; css: string }> = {
  jetbrains: { label: "JetBrains Mono", css: "var(--font-jetbrains), ui-monospace, monospace" },
  plex: { label: "IBM Plex Mono", css: "var(--font-plex), ui-monospace, monospace" },
  inter: { label: "Inter", css: "var(--font-inter), ui-sans-serif, sans-serif" },
  literata: { label: "Literata", css: "var(--font-literata), ui-serif, serif" },
};

const KEY = "rk-settings";
const listeners = new Set<() => void>();
let cache: Settings | null = null;

function read(): Settings {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
  } catch {
    cache = defaultSettings;
  }
  return cache!;
}

export function updateSettings(patch: Partial<Settings>) {
  cache = { ...read(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(cache));
  applySettings(cache);
  listeners.forEach((l) => l());
}

export function applySettings(s: Settings) {
  const root = document.documentElement;
  root.dataset.motion = s.reducedMotion ? "reduced" : "normal";
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, read, () => defaultSettings);
}

export function getSettings() {
  return read();
}
