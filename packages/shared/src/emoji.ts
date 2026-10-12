export type EmojiUnlock =
  | { type: "free" }
  | { type: "level"; level: number }
  | { type: "achievement"; achievement: string };

export type Emoji = { char: string; name: string; unlock: EmojiUnlock };

const free = { type: "free" } as const;
const level = (n: number) => ({ type: "level", level: n }) as const;
const achievement = (id: string) => ({ type: "achievement", achievement: id }) as const;

export const emojis: Emoji[] = [
  { char: "👋", name: "wave", unlock: free },
  { char: "😂", name: "laugh", unlock: free },
  { char: "🔥", name: "fire", unlock: free },
  { char: "😎", name: "cool", unlock: free },
  { char: "🐢", name: "turtle", unlock: free },
  { char: "🚀", name: "rocket", unlock: free },
  { char: "😭", name: "crying", unlock: free },
  { char: "👀", name: "eyes", unlock: free },
  { char: "🏁", name: "flag", unlock: free },
  { char: "👍", name: "thumbs up", unlock: free },
  { char: "🙏", name: "please", unlock: free },
  { char: "😅", name: "sweat", unlock: free },
  { char: "🤝", name: "handshake", unlock: free },
  { char: "💨", name: "dash", unlock: free },
  { char: "🎉", name: "party", unlock: free },
  { char: "😤", name: "huff", unlock: free },
  { char: "🤔", name: "thinking", unlock: level(3) },
  { char: "🥱", name: "yawn", unlock: level(5) },
  { char: "🐌", name: "snail", unlock: level(5) },
  { char: "⚡", name: "lightning", unlock: level(8) },
  { char: "🫡", name: "salute", unlock: level(10) },
  { char: "🤯", name: "mind blown", unlock: level(12) },
  { char: "👑", name: "crown", unlock: level(15) },
  { char: "🦥", name: "sloth", unlock: level(20) },
  { char: "🐆", name: "cheetah", unlock: achievement("wpm-100") },
  { char: "🎯", name: "bullseye", unlock: achievement("perfect-accuracy") },
  { char: "🏆", name: "trophy", unlock: achievement("races-50") },
  { char: "💎", name: "gem", unlock: achievement("streak-5") },
  { char: "📚", name: "books", unlock: achievement("books-10") },
  { char: "🌅", name: "sunrise", unlock: achievement("first-race") },
];

export const defaultLoadout = ["👋", "😂", "🔥", "😎", "🐢", "🚀", "😭", "👀", "🏁"];

export const LOADOUT_SIZE = 9;

export function emojiInfo(char: string) {
  return emojis.find((e) => e.char === char);
}

export function twemojiId(char: string) {
  const points = Array.from(char).map((c) => c.codePointAt(0)!);
  const keep = points.includes(0x200d) ? points : points.filter((p) => p !== 0xfe0f);
  return keep.map((p) => p.toString(16)).join("-");
}

export function isUnlocked(
  e: Emoji,
  opts: { level: number; achievements: Set<string>; owned: Set<string> },
) {
  if (opts.owned.has(e.char)) return true;
  if (e.unlock.type === "free") return true;
  if (e.unlock.type === "level") return opts.level >= e.unlock.level;
  return opts.achievements.has(e.unlock.achievement);
}
