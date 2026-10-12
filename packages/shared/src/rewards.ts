export const DAILY_BONUS = { coins: 50, xp: 100 };

const placeCoins = [20, 12, 8, 4, 2];

export function botMultiplier(realOpponents: number, botOpponents: number) {
  const total = realOpponents + botOpponents;
  if (total === 0) return 0.25;
  return 0.25 + 0.75 * (realOpponents / total);
}

export type RaceReward = { coins: number; xp: number; multiplier: number };

export function raceReward(r: {
  finished: boolean;
  flagged: boolean;
  wpm: number;
  accuracy: number;
  chars: number;
  placement: number;
  realOpponents: number;
  botOpponents: number;
  winStreak: number;
}): RaceReward {
  const multiplier = botMultiplier(r.realOpponents, r.botOpponents);
  if (r.flagged) return { coins: 0, xp: 0, multiplier };
  if (!r.finished) {
    return { coins: 0, xp: Math.round((r.chars / 10) * multiplier), multiplier };
  }
  const acc = Math.max(0, Math.min(1, r.accuracy));
  const hasOpponents = r.realOpponents + r.botOpponents > 0;
  const place = hasOpponents ? (placeCoins[r.placement - 1] ?? 0) : 0;
  const streak = r.placement === 1 && r.winStreak >= 3 ? Math.min(50, 5 * r.winStreak) : 0;
  const coins = (10 + r.wpm * 0.3 * acc ** 2 + place + streak) * multiplier;
  const xp = ((r.chars / 5) * acc + place * 2) * multiplier;
  return { coins: Math.round(coins), xp: Math.round(xp), multiplier };
}

export function xpForLevel(level: number) {
  return 50 * level * (level - 1);
}

export function levelForXp(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function levelProgress(xp: number) {
  const level = levelForXp(xp);
  const from = xpForLevel(level);
  const to = xpForLevel(level + 1);
  return { level, into: xp - from, needed: to - from };
}
