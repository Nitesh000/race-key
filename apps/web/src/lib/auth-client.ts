"use client";

import { anonymousClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  plugins: [anonymousClient()],
});

export async function ensureSession(): Promise<{ created: boolean }> {
  const { data } = await authClient.getSession();
  if (data) return { created: false };
  const res = await authClient.signIn.anonymous();
  if (res.error) throw new Error(res.error.message ?? "could not start a guest session");
  return { created: true };
}
