export function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export const realtimeUrl = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:8787";

export function siteUrl(): string | undefined {
  const explicit = env("BETTER_AUTH_URL");
  if (explicit) return explicit;
  const host =
    process.env.VERCEL_ENV === "production"
      ? env("VERCEL_PROJECT_PRODUCTION_URL")
      : (env("VERCEL_BRANCH_URL") ?? env("VERCEL_URL"));
  return host ? `https://${host}` : undefined;
}
