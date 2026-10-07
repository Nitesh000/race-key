"use client";

import type { ModePreference } from "@race-key/themes";
import { createContext, use, useCallback, useMemo, useState } from "react";
import { MODE_COOKIE, THEME_COOKIE, writeCookie } from "./cookies";

type ThemeState = {
  theme: string;
  mode: ModePreference;
  setTheme: (id: string) => void;
  setMode: (mode: ModePreference) => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({
  initialTheme,
  initialMode,
  onChange,
  children,
}: {
  initialTheme: string;
  initialMode: ModePreference;
  onChange?: (theme: string, mode: ModePreference) => void;
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState(initialTheme);
  const [mode, setModeState] = useState(initialMode);

  const setTheme = useCallback(
    (id: string) => {
      setThemeState(id);
      document.documentElement.dataset.theme = id;
      writeCookie(THEME_COOKIE, id);
      onChange?.(id, mode);
    },
    [mode, onChange],
  );

  const setMode = useCallback(
    (next: ModePreference) => {
      setModeState(next);
      document.documentElement.dataset.mode = next;
      writeCookie(MODE_COOKIE, next);
      onChange?.(theme, next);
    },
    [theme, onChange],
  );

  const value = useMemo(
    () => ({ theme, mode, setTheme, setMode }),
    [theme, mode, setTheme, setMode],
  );
  return <ThemeContext value={value}>{children}</ThemeContext>;
}

export function useTheme() {
  const ctx = use(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
