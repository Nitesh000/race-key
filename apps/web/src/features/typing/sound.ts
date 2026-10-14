let ctx: AudioContext | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

export function unlockAudio() {
  audio();
}

function tone(a: AudioContext, at: number, freq: number, length: number, volume: number) {
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain).connect(a.destination);
  osc.start(at);
  osc.stop(at + length + 0.02);
  return osc;
}

export function click(wrong = false) {
  const a = audio();
  if (!a) return;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = wrong ? "square" : "triangle";
  osc.frequency.value = wrong ? 180 : 620 + Math.random() * 60;
  gain.gain.setValueAtTime(0.05, a.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.05);
  osc.connect(gain).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + 0.06);
}

export function countdownBeeps(msUntilGo: number) {
  const a = audio();
  if (!a) return () => {};
  const scheduled: OscillatorNode[] = [];
  for (const before of [3000, 2000, 1000, 0]) {
    const inMs = msUntilGo - before;
    if (inMs < -80) continue;
    const at = a.currentTime + Math.max(0, inMs) / 1000;
    scheduled.push(before === 0 ? tone(a, at, 988, 0.45, 0.22) : tone(a, at, 659, 0.14, 0.18));
  }
  return () => {
    for (const osc of scheduled) {
      try {
        osc.stop();
      } catch {
        continue;
      }
    }
  };
}
