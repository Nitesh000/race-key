export type Bubble = { key: number; emoji: string };

export const BUBBLE_MS = 1500;

export class TauntStore {
  private bubbles = new Map<string, Bubble>();
  private snapshot: ReadonlyMap<string, Bubble> = new Map();
  private listeners = new Set<() => void>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private counter = 0;

  show(from: string, emoji: string) {
    this.bubbles.set(from, { key: ++this.counter, emoji });
    clearTimeout(this.timers.get(from));
    this.timers.set(
      from,
      setTimeout(() => {
        this.bubbles.delete(from);
        this.emit();
      }, BUBBLE_MS),
    );
    this.emit();
  }

  get = () => this.snapshot;

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  private emit() {
    this.snapshot = new Map(this.bubbles);
    this.listeners.forEach((l) => l());
  }
}
