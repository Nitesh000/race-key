import { execFile } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import EmbeddedPostgres from "embedded-postgres";

const port = Number(process.env.LOCAL_DB_PORT ?? 5433);
const throwaway = process.env.LOCAL_DB_THROWAWAY === "1";
const root = fileURLToPath(new URL("..", import.meta.url));
const dir = throwaway ? await mkdtemp(join(tmpdir(), "race-key-db-")) : join(root, ".pgdata");

const run = promisify(execFile);

async function hydrateBinaries() {
  const fromWrapper = createRequire(createRequire(import.meta.url).resolve("embedded-postgres"));
  const pkg = `@embedded-postgres/${process.platform}-${process.arch}`;
  let dir = dirname(fromWrapper.resolve(pkg));
  while (!existsSync(join(dir, "scripts", "hydrate-symlinks.js"))) {
    if (dirname(dir) === dir) return;
    dir = dirname(dir);
  }
  await run(process.execPath, ["scripts/hydrate-symlinks.js"], { cwd: dir });
}

await hydrateBinaries();

const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user: "postgres",
  password: "postgres",
  port,
  persistent: !throwaway,
  onLog: () => {},
});

try {
  await pg.initialise();
} catch (e) {
  if (throwaway) throw e;
}
await pg.start();

const url = `postgres://postgres:postgres@localhost:${port}/postgres`;
const env = { ...process.env, DATABASE_URL: url };
for (const script of ["migrate", "seed"]) {
  const { stdout } = await run("pnpm", ["-s", script], { cwd: root, env });
  process.stdout.write(stdout);
}

const ready = createServer((_, res) => res.end("ready")).listen(port + 1);
console.log(`local database ready: DATABASE_URL=${url}`);

let stopping = false;
const stop = async () => {
  if (stopping) return;
  stopping = true;
  ready.close();
  await pg.stop();
  if (throwaway) await rm(dir, { recursive: true, force: true });
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
