export type PriceType = "free" | "coins" | "level" | "achievement" | "premium";
export type SkinCategory = "car" | "animal" | "vehicle" | "caret" | "track";

export type Skin = {
  id: string;
  name: string;
  category: SkinCategory;
  priceType: PriceType;
  price: number;
  achievement?: string;
};

export const skins: Skin[] = [
  { id: "hatchback", name: "Hatchback", category: "car", priceType: "free", price: 0 },
  { id: "turtle", name: "Turtle", category: "animal", priceType: "free", price: 0 },
  { id: "bike", name: "Bicycle", category: "vehicle", priceType: "free", price: 0 },
  { id: "sedan", name: "Sedan", category: "car", priceType: "coins", price: 300 },
  { id: "pickup", name: "Pickup", category: "car", priceType: "coins", price: 500 },
  { id: "van", name: "Camper Van", category: "car", priceType: "level", price: 4 },
  { id: "racecar", name: "Race Car", category: "car", priceType: "level", price: 10 },
  { id: "rabbit", name: "Rabbit", category: "animal", priceType: "coins", price: 400 },
  {
    id: "snail",
    name: "Snail",
    category: "animal",
    priceType: "achievement",
    price: 0,
    achievement: "races-50",
  },
  { id: "horse", name: "Horse", category: "animal", priceType: "level", price: 7 },
  {
    id: "cheetah",
    name: "Cheetah",
    category: "animal",
    priceType: "achievement",
    price: 0,
    achievement: "wpm-100",
  },
  { id: "scooter", name: "Scooter", category: "vehicle", priceType: "coins", price: 250 },
  { id: "skateboard", name: "Skateboard", category: "vehicle", priceType: "coins", price: 350 },
  { id: "rocket", name: "Rocket", category: "vehicle", priceType: "premium", price: 199 },
  { id: "ufo", name: "Flying Saucer", category: "vehicle", priceType: "premium", price: 199 },
  { id: "dragon", name: "Dragon", category: "animal", priceType: "premium", price: 299 },
  { id: "caret-line", name: "Line", category: "caret", priceType: "free", price: 0 },
  { id: "caret-block", name: "Block", category: "caret", priceType: "free", price: 0 },
  { id: "caret-underline", name: "Underline", category: "caret", priceType: "free", price: 0 },
  { id: "caret-thick", name: "Thick Line", category: "caret", priceType: "coins", price: 150 },
  {
    id: "caret-glow",
    name: "Glow",
    category: "caret",
    priceType: "achievement",
    price: 0,
    achievement: "perfect-accuracy",
  },
  { id: "track-plain", name: "Plain", category: "track", priceType: "free", price: 0 },
  { id: "track-dashes", name: "Lane Dashes", category: "track", priceType: "coins", price: 200 },
  { id: "track-checker", name: "Checkered", category: "track", priceType: "level", price: 6 },
  {
    id: "track-stars",
    name: "Starry",
    category: "track",
    priceType: "achievement",
    price: 0,
    achievement: "streak-5",
  },
];

export const racerCategories: SkinCategory[] = ["car", "animal", "vehicle"];

export const defaultEquipped = { skin: "hatchback", caret: "caret-line", track: "track-plain" };

export function getSkin(id: string) {
  return skins.find((s) => s.id === id);
}

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  rewardCoins: number;
};

export const achievements: Achievement[] = [
  {
    id: "first-race",
    name: "Off the Line",
    description: "Finish your first race.",
    icon: "🌅",
    rewardCoins: 50,
  },
  {
    id: "races-50",
    name: "Regular",
    description: "Finish 50 races.",
    icon: "🏆",
    rewardCoins: 250,
  },
  {
    id: "wins-10",
    name: "Podium Habit",
    description: "Win 10 races.",
    icon: "🥇",
    rewardCoins: 200,
  },
  {
    id: "wpm-100",
    name: "Triple Digits",
    description: "Finish a race at 100 wpm or faster.",
    icon: "🐆",
    rewardCoins: 300,
  },
  {
    id: "perfect-accuracy",
    name: "Clean Run",
    description: "Finish a passage of 100+ characters with 100% accuracy.",
    icon: "🎯",
    rewardCoins: 150,
  },
  {
    id: "streak-5",
    name: "On a Roll",
    description: "Win 5 races in a row.",
    icon: "💎",
    rewardCoins: 300,
  },
  {
    id: "books-10",
    name: "Well Read",
    description: "Race passages from 10 different books.",
    icon: "📚",
    rewardCoins: 200,
  },
  {
    id: "level-10",
    name: "Seasoned",
    description: "Reach level 10.",
    icon: "⭐",
    rewardCoins: 250,
  },
];

export type AchievementContext = {
  finishedRaces: number;
  wins: number;
  winStreak: number;
  level: number;
  books: number;
  last: { finished: boolean; wpm: number; accuracy: number; chars: number } | null;
};

export function earnedAchievements(ctx: AchievementContext): string[] {
  const out: string[] = [];
  if (ctx.finishedRaces >= 1) out.push("first-race");
  if (ctx.finishedRaces >= 50) out.push("races-50");
  if (ctx.wins >= 10) out.push("wins-10");
  if (ctx.last?.finished && ctx.last.wpm >= 100) out.push("wpm-100");
  if (ctx.last?.finished && ctx.last.accuracy >= 1 && ctx.last.chars >= 100)
    out.push("perfect-accuracy");
  if (ctx.winStreak >= 5) out.push("streak-5");
  if (ctx.books >= 10) out.push("books-10");
  if (ctx.level >= 10) out.push("level-10");
  return out;
}

export function canUnlock(
  s: Skin,
  opts: { level: number; achievements: Set<string> },
): "owned-free" | "buy" | "level" | "achievement" | "premium" | "unlocked" {
  if (s.priceType === "free") return "owned-free";
  if (s.priceType === "coins") return "buy";
  if (s.priceType === "premium") return "premium";
  if (s.priceType === "level") return opts.level >= s.price ? "unlocked" : "level";
  return s.achievement && opts.achievements.has(s.achievement) ? "unlocked" : "achievement";
}
