import { z } from "zod";

export const tokens = [
  "bg",
  "surface",
  "surface-2",
  "border",
  "text",
  "text-muted",
  "text-correct",
  "text-wrong",
  "text-wrong-bg",
  "text-untyped",
  "caret",
  "accent",
  "accent-contrast",
  "track-bg",
  "lane",
  "lane-you",
  "racer-tint",
  "racer-outline",
  "focus-ring",
  "success",
  "warning",
  "danger",
] as const;

export type Token = (typeof tokens)[number];

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "colors must be #rrggbb");

export const paletteSchema = z
  .object(Object.fromEntries(tokens.map((t) => [t, hex])) as Record<Token, typeof hex>)
  .strict();

export type Palette = z.infer<typeof paletteSchema>;

export const priceTypes = ["free", "coins", "level", "achievement", "premium"] as const;
export type PriceType = (typeof priceTypes)[number];

export const themeSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  priceType: z.enum(priceTypes),
  price: z.number().int().nonnegative().optional(),
  swatch: z.array(hex).min(3).max(5),
  light: paletteSchema,
  dark: paletteSchema,
});

export type Theme = z.infer<typeof themeSchema>;

export const modes = ["light", "dark"] as const;
export type Mode = (typeof modes)[number];

export const modePreferences = ["system", "light", "dark"] as const;
export type ModePreference = (typeof modePreferences)[number];

export function defineTheme(theme: Theme): Theme {
  return theme;
}
