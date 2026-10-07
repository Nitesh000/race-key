import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkContrast } from "../contrast";
import { themeCss } from "../css";
import { defaultThemeId, themes } from "../index";
import { themeSchema } from "../tokens";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "generated");

let failed = false;
const ids = new Set<string>();

for (const theme of themes) {
  const parsed = themeSchema.safeParse(theme);
  if (!parsed.success) {
    failed = true;
    console.error(`theme "${theme.id}" is invalid:\n${parsed.error.message}`);
  }
  if (ids.has(theme.id)) {
    failed = true;
    console.error(`duplicate theme id "${theme.id}"`);
  }
  ids.add(theme.id);
  for (const f of checkContrast(theme)) {
    failed = true;
    console.error(
      `contrast: ${f.theme}/${f.mode} ${f.fg} on ${f.bg} is ${f.ratio.toFixed(2)}, needs ${f.min}`,
    );
  }
}

if (failed) process.exit(1);

await mkdir(join(out, "themes"), { recursive: true });

const all: string[] = [];
for (const theme of themes) {
  const css = themeCss(theme, theme.id === defaultThemeId);
  all.push(css);
  await writeFile(join(out, "themes", `${theme.id}.css`), css + "\n");
}

await writeFile(join(out, "themes.css"), all.join("\n\n") + "\n");
console.log(`built ${themes.length} themes`);
