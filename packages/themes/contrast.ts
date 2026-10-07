import type { Palette, Theme } from "./tokens";

function channel(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

export function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

export const contrastRules: { fg: keyof Palette; bg: keyof Palette; min: number }[] = [
  { fg: "text", bg: "bg", min: 4.5 },
  { fg: "text-correct", bg: "bg", min: 4.5 },
  { fg: "text-wrong", bg: "bg", min: 4.5 },
  { fg: "text-wrong", bg: "text-wrong-bg", min: 4.5 },
  { fg: "caret", bg: "bg", min: 3 },
  { fg: "text", bg: "surface", min: 4.5 },
  { fg: "accent-contrast", bg: "accent", min: 4.5 },
];

export type ContrastFailure = {
  theme: string;
  mode: "light" | "dark";
  fg: string;
  bg: string;
  ratio: number;
  min: number;
};

export function checkContrast(theme: Theme): ContrastFailure[] {
  const failures: ContrastFailure[] = [];
  for (const mode of ["light", "dark"] as const) {
    const palette = theme[mode];
    for (const rule of contrastRules) {
      const ratio = contrast(palette[rule.fg], palette[rule.bg]);
      if (ratio < rule.min) {
        failures.push({ theme: theme.id, mode, fg: rule.fg, bg: rule.bg, ratio, min: rule.min });
      }
    }
  }
  return failures;
}
