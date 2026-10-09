export function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export const realtimeUrl = process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:8787";
