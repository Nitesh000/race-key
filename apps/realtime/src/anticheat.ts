import { wpm, type FinishStats } from "@race-key/shared";

export const MAX_SUSTAINED_WPM = 250;
export const MAX_CHARS_PER_SECOND = 30;
export const PROGRESS_SLACK_CHARS = 15;
export const MIN_GAPS = 40;
export const MIN_GAP_VARIATION = 0.1;

export function maxPlausiblePos(elapsedMs: number) {
  return Math.floor(PROGRESS_SLACK_CHARS + (Math.max(0, elapsedMs) / 1000) * MAX_CHARS_PER_SECOND);
}

export function gapVariation(dts: number[]) {
  const gaps = dts.filter((d) => d > 0 && d < 2000);
  if (gaps.length < MIN_GAPS) return null;
  const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
  const sd = Math.sqrt(gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length);
  return sd / mean;
}

export function finishFlags(stats: FinishStats, chars: number, timeMs: number) {
  const flags: string[] = [];
  if (wpm(chars, timeMs) > MAX_SUSTAINED_WPM) flags.push("speed");
  const variation = stats.dts ? gapVariation(stats.dts) : null;
  if (variation !== null && variation < MIN_GAP_VARIATION) flags.push("timing");
  if (!stats.dts || stats.dts.length < chars * 0.9) flags.push("no-keystrokes");
  return flags;
}
