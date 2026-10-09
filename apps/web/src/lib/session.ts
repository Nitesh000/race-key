import "server-only";
import { profiles } from "@race-key/db";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { cache } from "react";
import { authEnabled, getAuth } from "./auth";
import { getDb } from "./db";

export const getSession = cache(async () => {
  if (!authEnabled()) return null;
  try {
    return await getAuth().api.getSession({ headers: await headers() });
  } catch (e) {
    console.error("session lookup failed", e);
    return null;
  }
});

export const getViewer = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  const [profile] = await getDb()
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id));
  if (!profile) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    isGuest: !!(session.user as { isAnonymous?: boolean | null }).isAnonymous,
    profile,
  };
});

export type Viewer = NonNullable<Awaited<ReturnType<typeof getViewer>>>;
