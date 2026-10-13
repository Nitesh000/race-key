"use server";

import {
  coinLedger,
  emojiLoadouts,
  profiles,
  userAchievements,
  userEmojis,
  userSkins,
  userThemes,
} from "@race-key/db";
import { LOADOUT_SIZE, emojis, getSkin, isUnlocked, ownsSkin, type Skin } from "@race-key/shared";
import { getTheme, themes } from "@race-key/themes";
import { and, eq, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { THEME_COOKIE } from "@/features/themes/cookies";
import { getDb } from "@/lib/db";
import { getViewer, type Viewer } from "@/lib/session";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) throw new Error("not signed in");
  return viewer;
}

async function ownership(viewer: Viewer) {
  const db = getDb();
  const [owned, unlocked] = await Promise.all([
    db.select({ id: userSkins.skinId }).from(userSkins).where(eq(userSkins.userId, viewer.id)),
    db
      .select({ id: userAchievements.achievementId })
      .from(userAchievements)
      .where(eq(userAchievements.userId, viewer.id)),
  ]);
  return {
    owned: new Set(owned.map((o) => o.id)),
    level: viewer.profile.level,
    achievements: new Set(unlocked.map((a) => a.id)),
  };
}

async function spend(userId: string, price: number, reason: string) {
  const db = getDb();
  const [after] = await db
    .update(profiles)
    .set({ coins: sql`${profiles.coins} - ${price}` })
    .where(and(eq(profiles.userId, userId), gte(profiles.coins, price)))
    .returning({ coins: profiles.coins });
  if (!after) return false;
  await db.insert(coinLedger).values({ userId, delta: -price, balance: after.coins, reason });
  return true;
}

async function refund(userId: string, price: number, reason: string) {
  const db = getDb();
  const [after] = await db
    .update(profiles)
    .set({ coins: sql`${profiles.coins} + ${price}` })
    .where(eq(profiles.userId, userId))
    .returning({ coins: profiles.coins });
  await db.insert(coinLedger).values({ userId, delta: price, balance: after!.coins, reason });
}

const id = z.string().min(1).max(40);

export async function buySkin(skinId: string): Promise<ActionResult> {
  const viewer = await requireViewer();
  const skin = getSkin(id.parse(skinId));
  if (!skin || skin.priceType !== "coins")
    return { ok: false, error: "That item can't be bought with coins." };
  if (ownsSkin(skin, await ownership(viewer))) return { ok: false, error: "You already own it." };
  if (!(await spend(viewer.id, skin.price, `buy:${skin.id}`))) {
    return { ok: false, error: "Not enough coins." };
  }
  const inserted = await getDb()
    .insert(userSkins)
    .values({ userId: viewer.id, skinId: skin.id, source: "coins" })
    .onConflictDoNothing()
    .returning();
  if (inserted.length === 0) await refund(viewer.id, skin.price, `refund:${skin.id}`);
  revalidatePath("/", "layout");
  return { ok: true };
}

const slot: Record<string, keyof typeof profiles.$inferInsert> = {
  car: "equippedSkinId",
  animal: "equippedSkinId",
  vehicle: "equippedSkinId",
  caret: "equippedCaretId",
  track: "equippedTrackId",
};

export async function equipSkin(skinId: string): Promise<ActionResult> {
  const viewer = await requireViewer();
  const skin: Skin | undefined = getSkin(id.parse(skinId));
  if (!skin) return { ok: false, error: "Unknown item." };
  if (!ownsSkin(skin, await ownership(viewer)))
    return { ok: false, error: "You don't own that yet." };
  await getDb()
    .update(profiles)
    .set({ [slot[skin.category]!]: skin.id })
    .where(eq(profiles.userId, viewer.id));
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function buyTheme(themeId: string): Promise<ActionResult> {
  const viewer = await requireViewer();
  const theme = themes.find((t) => t.id === id.parse(themeId));
  if (!theme || theme.priceType !== "coins")
    return { ok: false, error: "That theme can't be bought with coins." };
  const price = theme.price ?? 0;
  if (!(await spend(viewer.id, price, `buy:theme:${theme.id}`))) {
    return { ok: false, error: "Not enough coins." };
  }
  const inserted = await getDb()
    .insert(userThemes)
    .values({ userId: viewer.id, themeId: theme.id, source: "coins" })
    .onConflictDoNothing()
    .returning();
  if (inserted.length === 0) await refund(viewer.id, price, `refund:theme:${theme.id}`);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function selectTheme(themeId: string, mode: string): Promise<ActionResult> {
  const viewer = await requireViewer();
  const theme = getTheme(id.parse(themeId));
  const owned = await getDb()
    .select()
    .from(userThemes)
    .where(and(eq(userThemes.userId, viewer.id), eq(userThemes.themeId, theme.id)));
  const allowed =
    theme.priceType === "free" ||
    owned.length > 0 ||
    (theme.priceType === "level" && viewer.profile.level >= (theme.price ?? 0));
  if (!allowed) return { ok: false, error: "You haven't unlocked that theme." };
  await getDb()
    .update(profiles)
    .set({ themeId: theme.id, mode: z.enum(["system", "light", "dark"]).parse(mode) })
    .where(eq(profiles.userId, viewer.id));
  (await cookies()).set(THEME_COOKIE, theme.id, { path: "/", maxAge: 31536000, sameSite: "lax" });
  return { ok: true };
}

export async function saveLoadout(slots: string[]): Promise<ActionResult> {
  const viewer = await requireViewer();
  const parsed = z.array(z.string().max(16)).length(LOADOUT_SIZE).safeParse(slots);
  if (!parsed.success || new Set(parsed.data).size !== LOADOUT_SIZE) {
    return { ok: false, error: "Pick nine different emojis." };
  }
  const db = getDb();
  const [o, extra] = await Promise.all([
    ownership(viewer),
    db.select({ char: userEmojis.emoji }).from(userEmojis).where(eq(userEmojis.userId, viewer.id)),
  ]);
  const opts = {
    level: o.level,
    achievements: o.achievements,
    owned: new Set(extra.map((e) => e.char)),
  };
  for (const c of parsed.data) {
    const e = emojis.find((x) => x.char === c);
    if (!e || !isUnlocked(e, opts)) return { ok: false, error: `${c} is locked.` };
  }
  await db
    .insert(emojiLoadouts)
    .values({ userId: viewer.id, slots: parsed.data })
    .onConflictDoUpdate({
      target: emojiLoadouts.userId,
      set: { slots: parsed.data, updatedAt: new Date() },
    });
  revalidatePath("/locker");
  return { ok: true };
}
