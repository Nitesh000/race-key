import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { emojis, twemojiId } from "@race-key/shared";
import { optimize } from "svgo";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "../../apps/web/public/assets");
const twemojiDir = dirname(createRequire(import.meta.url).resolve("@twemoji/svg/package.json"));

function svg(source: string) {
  return optimize(source, { multipass: true }).data;
}

await rm(out, { recursive: true, force: true });
await mkdir(join(out, "emoji"), { recursive: true });

for (const e of emojis) {
  const id = twemojiId(e.char);
  const source = await readFile(join(twemojiDir, `${id}.svg`), "utf8");
  await writeFile(join(out, "emoji", `${id}.svg`), svg(source));
}

console.log(`built ${emojis.length} emoji`);
