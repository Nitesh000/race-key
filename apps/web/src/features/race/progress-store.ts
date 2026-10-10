import type { TickEntry } from "@race-key/shared";

export type Progress = { pos: number; wpm: number };

export class ProgressStore {
  private map = new Map<string, Progress>();
  private listeners = new Set<() => void>();

  get(id: string): Progress {
    return this.map.get(id) ?? { pos: 0, wpm: 0 };
  }

  apply(entries: TickEntry[], except?: string) {
    for (const [id, pos, wpm] of entries) {
      if (id === except) continue;
      this.map.set(id, { pos, wpm });
    }
    this.emit();
  }

  set(id: string, value: Progress) {
    this.map.set(id, value);
    this.emit();
  }

  clear() {
    this.map.clear();
    this.emit();
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emit() {
    this.listeners.forEach((l) => l());
  }
}
