import { defaultThemeId, modePreferences, themes, type ModePreference } from "@race-key/themes";

export const THEME_COOKIE = "rk-theme";
export const MODE_COOKIE = "rk-mode";

export function parseTheme(value: string | undefined) {
  return themes.some((t) => t.id === value) ? value! : defaultThemeId;
}

export function parseMode(value: string | undefined): ModePreference {
  return (modePreferences as readonly string[]).includes(value ?? "")
    ? (value as ModePreference)
    : "system";
}

export function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
}
