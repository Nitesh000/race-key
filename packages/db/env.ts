import { existsSync } from "node:fs";
import { resolve } from "node:path";

const webEnv = resolve(process.cwd(), "../../apps/web/.env");

if (!process.env.DATABASE_URL && existsSync(webEnv)) process.loadEnvFile(webEnv);
