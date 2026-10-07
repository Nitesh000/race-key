import type { Palette, Theme } from "./tokens";

function declarations(palette: Palette, mode: "light" | "dark", indent = "  ") {
  const lines = Object.entries(palette).map(([k, v]) => `${indent}--${k}: ${v};`);
  return [`${indent}color-scheme: ${mode};`, ...lines].join("\n");
}

export function themeCss(theme: Theme, isDefault = false) {
  const sel = (mode: string) => `[data-theme="${theme.id}"][data-mode="${mode}"]`;
  const lightSelectors = [sel("light"), sel("system")];
  if (isDefault) lightSelectors.unshift(":root");
  return [
    `${lightSelectors.join(",\n")} {\n${declarations(theme.light, "light")}\n}`,
    `${sel("dark")} {\n${declarations(theme.dark, "dark")}\n}`,
    `@media (prefers-color-scheme: dark) {\n  ${sel("system")}${isDefault ? `,\n  :root:not([data-mode])` : ""} {\n${declarations(theme.dark, "dark", "    ")}\n  }\n}`,
  ].join("\n\n");
}
