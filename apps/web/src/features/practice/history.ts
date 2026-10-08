const KEY = "rk-recent";

export type RecentResult = { wpm: number; accuracy: number; at: number };

export function recentResults(): RecentResult[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as RecentResult[];
  } catch {
    return [];
  }
}

export function pushRecent(r: RecentResult) {
  const list = [r, ...recentResults()].slice(0, 50);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function averageWpm(n = 10): number | undefined {
  const list = recentResults().slice(0, n);
  if (!list.length) return undefined;
  return list.reduce((a, r) => a + r.wpm, 0) / list.length;
}
