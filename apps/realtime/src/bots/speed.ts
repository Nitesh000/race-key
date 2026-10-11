import { randInt, type Rng } from "@race-key/shared";

export const MIN_BOT_WPM = 15;
export const MAX_BOT_WPM = 160;
export const NEW_PLAYER_WPM = 40;

export function roomBaseline(humanWpms: number[]) {
  const known = humanWpms.filter((w) => w > 0);
  if (known.length === 0) return NEW_PLAYER_WPM;
  return known.reduce((a, b) => a + b, 0) / known.length;
}

export function botTargetWpm(baseline: number, rng: Rng) {
  const target = baseline + randInt(rng, -10, 10);
  return Math.max(MIN_BOT_WPM, Math.min(MAX_BOT_WPM, target));
}
