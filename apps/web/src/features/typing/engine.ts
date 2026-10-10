import { accuracy, charMatches, wpm } from "@race-key/shared";

export const MAX_STACKED_ERRORS = 8;

export type KeystrokeKind = "correct" | "wrong" | "backspace";

export type Keystroke = {
  kind: KeystrokeKind;
  key: string;
  pos: number;
  dt: number;
};

export type TypingStats = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  elapsed: number;
  progress: number;
  errors: number;
};

export class TypingEngine {
  readonly text: string;
  pos = 0;
  wrong: string[] = [];
  correctKeys = 0;
  errorKeys = 0;
  startedAt: number | null = null;
  finishedAt: number | null = null;
  lastAt: number | null = null;
  readonly log: Keystroke[] = [];
  readonly missed = new Set<number>();
  readonly samples: number[] = [];

  constructor(text: string) {
    this.text = text;
  }

  get done() {
    return this.finishedAt !== null;
  }

  get typedEnd() {
    return this.pos + this.wrong.length;
  }

  begin(at: number) {
    if (this.startedAt === null) {
      this.startedAt = at;
      this.lastAt = at;
    }
  }

  private stamp(now: number) {
    if (this.startedAt === null) this.startedAt = now;
    const dt = this.lastAt === null ? 0 : now - this.lastAt;
    this.lastAt = now;
    return dt;
  }

  type(key: string, now: number): KeystrokeKind | null {
    if (this.done) return null;
    if (this.wrong.length >= MAX_STACKED_ERRORS) return null;
    const dt = this.stamp(now);
    const expected = this.text[this.pos];
    if (this.wrong.length === 0 && expected !== undefined && charMatches(expected, key)) {
      this.log.push({ kind: "correct", key, pos: this.pos, dt });
      this.pos++;
      this.correctKeys++;
      if (this.pos === this.text.length) this.finishedAt = now;
      return "correct";
    }
    this.log.push({ kind: "wrong", key, pos: this.typedEnd, dt });
    if (this.wrong.length === 0) this.missed.add(this.pos);
    this.wrong.push(key);
    this.errorKeys++;
    return "wrong";
  }

  backspace(now: number): boolean {
    if (this.done || this.wrong.length === 0) return false;
    const dt = this.stamp(now);
    this.wrong.pop();
    this.log.push({ kind: "backspace", key: "\b", pos: this.typedEnd, dt });
    return true;
  }

  elapsed(now: number) {
    if (this.startedAt === null) return 0;
    return (this.finishedAt ?? now) - this.startedAt;
  }

  sample(now: number) {
    const v = wpm(this.pos, this.elapsed(now));
    this.samples.push(Math.round(v * 10) / 10);
    return v;
  }

  stats(now: number): TypingStats {
    const elapsed = this.elapsed(now);
    return {
      wpm: wpm(this.pos, elapsed),
      rawWpm: wpm(this.correctKeys + this.errorKeys, elapsed),
      accuracy: accuracy(this.correctKeys, this.errorKeys),
      elapsed,
      progress: this.text.length === 0 ? 1 : this.pos / this.text.length,
      errors: this.errorKeys,
    };
  }
}
