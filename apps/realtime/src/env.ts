import { DEV_SECRET } from "@race-key/shared";

export type Secrets = {
  REALTIME_SHARED_SECRET?: string;
  DATABASE_URL?: string;
};

export function sharedSecret(env: Env & Secrets) {
  if (env.REALTIME_SHARED_SECRET) return env.REALTIME_SHARED_SECRET;
  return (env.ENVIRONMENT as string) === "development" ? DEV_SECRET : null;
}

export function readPlayer(req: Request): unknown {
  try {
    return JSON.parse(decodeURIComponent(req.headers.get("x-rk-player") ?? "null"));
  } catch {
    return null;
  }
}
