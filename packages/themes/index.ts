import forest from "./themes/forest";
import mono from "./themes/mono";
import ocean from "./themes/ocean";
import paper from "./themes/paper";
import sunset from "./themes/sunset";
import type { Theme } from "./tokens";

export * from "./tokens";
export { checkContrast, contrast } from "./contrast";

export const themes: Theme[] = [paper, ocean, forest, sunset, mono];

export const defaultThemeId = "paper";

export function getTheme(id: string | undefined): Theme {
  return themes.find((t) => t.id === id) ?? paper;
}
