"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function SocialButtons({
  google,
  github,
  callbackURL = "/",
}: {
  google: boolean;
  github: boolean;
  callbackURL?: string;
}) {
  if (!google && !github) return null;
  const signIn = (provider: "google" | "github") =>
    authClient.signIn.social({ provider, callbackURL });
  return (
    <div className="grid gap-2">
      {google && (
        <Button variant="secondary" type="button" onClick={() => signIn("google")}>
          Continue with Google
        </Button>
      )}
      {github && (
        <Button variant="secondary" type="button" onClick={() => signIn("github")}>
          Continue with GitHub
        </Button>
      )}
      <div className="my-2 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
