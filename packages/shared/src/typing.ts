const special: Record<string, string> = {
  "\u2018": "'",
  "\u2019": "'",
  "\u201a": "'",
  "\u201b": "'",
  "\u2032": "'",
  "\u201c": '"',
  "\u201d": '"',
  "\u201e": '"',
  "\u2033": '"',
  "\u2013": "-",
  "\u2014": "-",
  "\u2015": "-",
  "\u2010": "-",
  "\u2011": "-",
  "\u2026": ".",
  "\u00a0": " ",
  "\u2009": " ",
  "\u00e6": "a",
  "\u00c6": "A",
  "\u0153": "o",
  "\u0152": "O",
  "\u00df": "s",
  "\u00f8": "o",
  "\u00d8": "O",
};

const cache = new Map<string, string>();

export function plainKey(ch: string): string {
  const hit = cache.get(ch);
  if (hit !== undefined) return hit;
  const out =
    special[ch] ??
    (ch
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .charAt(0) ||
      ch);
  cache.set(ch, out);
  return out;
}

export function charMatches(expected: string, typed: string): boolean {
  return expected === typed || plainKey(expected) === typed;
}

export function wpm(chars: number, ms: number): number {
  if (ms <= 0) return 0;
  return chars / 5 / (ms / 60000);
}

export function accuracy(correct: number, errors: number): number {
  const total = correct + errors;
  return total === 0 ? 1 : correct / total;
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function consistency(samples: number[]): number | null {
  const xs = samples.slice(1).filter((x) => x > 0);
  if (xs.length < 3) return null;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
  return Math.max(0, Math.min(1, 1 - sd / mean));
}
