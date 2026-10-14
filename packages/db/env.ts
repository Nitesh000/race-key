import { existsSync } from "node:fs";
import { resolve } from "node:path";

for (const file of [".env.local", ".env"]) {
  const path = resolve(process.cwd(), "../../apps/web", file);
  if (!process.env.DATABASE_URL && existsSync(path)) process.loadEnvFile(path);
}
