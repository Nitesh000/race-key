import { pick, racerCategories, randFloat, randInt, skins, type Rng } from "@race-key/shared";

const botSkins = skins
  .filter((s) => racerCategories.includes(s.category) && s.priceType !== "premium")
  .map((s) => s.id);

export function botSkin(rng: Rng) {
  return pick(rng, botSkins);
}

export const WAIT_MIN_MS = 12_000;
export const WAIT_MAX_MS = 13_000;
export const FIRST_BOT_MS = 1_500;
export const LAST_BOT_GAP_MS = 500;

export function autoStartDelay(rng: Rng) {
  return randInt(rng, WAIT_MIN_MS, WAIT_MAX_MS);
}

export function botJoinTimes(createdAt: number, autoStartAt: number, seats: number, rng: Rng) {
  const from = createdAt + FIRST_BOT_MS;
  const to = autoStartAt - LAST_BOT_GAP_MS;
  return Array.from({ length: seats }, () => Math.round(randFloat(rng, from, to))).sort(
    (a, b) => a - b,
  );
}

export function botLevel(humanLevels: number[], rng: Rng) {
  const avg = humanLevels.length ? humanLevels.reduce((a, b) => a + b, 0) / humanLevels.length : 1;
  return Math.max(1, Math.round(avg) + randInt(rng, -2, 2));
}
