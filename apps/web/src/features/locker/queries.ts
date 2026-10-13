import "server-only";
import { emojiLoadouts, userAchievements, userEmojis, userSkins, userThemes } from "@race-key/db";
import { defaultLoadout } from "@race-key/shared";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import type { Viewer } from "@/lib/session";

export async function getLocker(viewer: Viewer) {
  const db = getDb();
  const id = viewer.id;
  const [skins, themes, achievements, emojis, [loadout]] = await Promise.all([
    db.select({ id: userSkins.skinId }).from(userSkins).where(eq(userSkins.userId, id)),
    db.select({ id: userThemes.themeId }).from(userThemes).where(eq(userThemes.userId, id)),
    db
      .select({ id: userAchievements.achievementId, at: userAchievements.unlockedAt })
      .from(userAchievements)
      .where(eq(userAchievements.userId, id)),
    db.select({ char: userEmojis.emoji }).from(userEmojis).where(eq(userEmojis.userId, id)),
    db.select().from(emojiLoadouts).where(eq(emojiLoadouts.userId, id)),
  ]);
  return {
    coins: viewer.profile.coins,
    level: viewer.profile.level,
    equipped: {
      skin: viewer.profile.equippedSkinId,
      caret: viewer.profile.equippedCaretId,
      track: viewer.profile.equippedTrackId,
      theme: viewer.profile.themeId,
    },
    ownedSkins: skins.map((s) => s.id),
    ownedThemes: themes.map((t) => t.id),
    ownedEmojis: emojis.map((e) => e.char),
    achievements: Object.fromEntries(achievements.map((a) => [a.id, a.at.toISOString()])),
    loadout: loadout?.slots ?? defaultLoadout,
    isGuest: viewer.isGuest,
  };
}

export type LockerData = Awaited<ReturnType<typeof getLocker>>;
