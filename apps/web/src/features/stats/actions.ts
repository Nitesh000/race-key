"use server";

import { profiles } from "@race-key/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "@/lib/db";
import { getViewer } from "@/lib/session";

export async function setStatsPrivate(value: boolean) {
  const viewer = await getViewer();
  if (!viewer) return;
  await getDb().update(profiles).set({ statsPrivate: value }).where(eq(profiles.userId, viewer.id));
  revalidatePath(`/profile/${viewer.profile.username}/stats`);
}
