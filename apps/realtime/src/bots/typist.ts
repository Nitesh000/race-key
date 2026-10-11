import { gaussian, randFloat, wpm, type Rng } from "@race-key/shared";

export type TypistPlan = {
  times: number[];
  errors: number;
  keystrokes: number;
  durationMs: number;
};

const punctuation = /[.,;:!?'"“”‘’()—–-]/;

function wordLengthAt(text: string, i: number) {
  let start = i;
  while (start > 0 && text[start - 1] !== " ") start--;
  let end = i;
  while (end < text.length && text[end] !== " ") end++;
  return end - start;
}

export function planTypist(text: string, targetWpm: number, rng: Rng): TypistPlan {
  const base = 60000 / (targetWpm * 5);
  const errorRate = randFloat(rng, 0.01, 0.04);
  const raw: number[] = [];
  let t = 0;
  let errors = 0;
  let burst = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    let d = base * Math.max(0.4, Math.min(2.2, gaussian(rng, 1, 0.25)));
    if (ch !== ch.toLowerCase()) d *= 1.25;
    if (punctuation.test(ch)) d *= 1.3;
    if (ch !== " " && wordLengthAt(text, i) >= 8) d *= 1.15;

    if (burst > 0) {
      d *= 0.7;
      burst--;
    } else if (rng() < 0.05) {
      burst = Math.floor(randFloat(rng, 3, 9));
    }
    if (ch === " " && rng() < 0.015) d += randFloat(rng, 300, 900);

    if (ch !== " " && rng() < errorRate) {
      errors++;
      d += base + randFloat(rng, 150, 400) + base * 0.8;
    }
    t += d;
    raw.push(t);
  }

  const scale = text.length === 0 ? 1 : wpm(text.length, t) / targetWpm;
  const times = raw.map((x) => x * scale);
  return {
    times,
    errors,
    keystrokes: text.length + errors * 2,
    durationMs: times.at(-1) ?? 0,
  };
}

export function positionAt(plan: TypistPlan, elapsed: number) {
  let lo = 0;
  let hi = plan.times.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (plan.times[mid]! <= elapsed) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export function sampleSpeeds(plan: TypistPlan, until = plan.durationMs) {
  const out: number[] = [];
  for (let s = 1000; s < until + 1000; s += 1000) {
    const at = Math.min(s, until);
    out.push(Math.round(wpm(positionAt(plan, at), at) * 10) / 10);
  }
  return out;
}
