import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { emojis, racerCategories, skins, twemojiId } from "@race-key/shared";
import { optimize } from "svgo";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "../../apps/web/public/assets");
const generated = join(root, "generated");
const twemojiDir = dirname(createRequire(import.meta.url).resolve("@twemoji/svg/package.json"));

function svg(source: string) {
  return optimize(source, { multipass: true }).data;
}

function skinSvg(source: string) {
  return optimize(source, {
    multipass: true,
    plugins: [
      {
        name: "preset-default",
        params: { overrides: { collapseGroups: false, moveGroupAttrsToElems: false } },
      },
    ],
  }).data;
}

await rm(out, { recursive: true, force: true });
await mkdir(join(out, "emoji"), { recursive: true });

for (const e of emojis) {
  const id = twemojiId(e.char);
  const source = await readFile(join(twemojiDir, `${id}.svg`), "utf8");
  await writeFile(join(out, "emoji", `${id}.svg`), svg(source));
}

const racerIds = skins.filter((s) => racerCategories.includes(s.category)).map((s) => s.id);
const files = (await readdir(join(root, "skins"))).filter((f) => f.endsWith(".svg"));
const missing = racerIds.filter((id) => !files.includes(`${id}.svg`));
if (missing.length) throw new Error(`missing skin art: ${missing.join(", ")}`);

await mkdir(join(out, "skins"), { recursive: true });
await mkdir(generated, { recursive: true });
const inline: Record<string, string> = {};
for (const id of racerIds) {
  const optimized = skinSvg(await readFile(join(root, "skins", `${id}.svg`), "utf8"));
  if (!optimized.includes('viewBox="0 0 48 24"'))
    throw new Error(`${id}.svg must use viewBox 0 0 48 24`);
  await writeFile(join(out, "skins", `${id}.svg`), optimized);
  inline[id] = optimized.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
}
await writeFile(join(generated, "skins.json"), JSON.stringify(inline, null, 2) + "\n");

console.log(`built ${emojis.length} emoji and ${racerIds.length} skins`);
