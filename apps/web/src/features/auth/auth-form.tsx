"use client";

import { usernameSchema } from "@race-key/shared";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { SocialButtons } from "./social-buttons";

export function AuthForm({
  mode,
  google,
  github,
}: {
  mode: "login" | "signup";
  google: boolean;
  github: boolean;
}) {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    setPending(true);
    try {
      if (mode === "signup") {
        const username = String(form.get("username"));
        const valid = usernameSchema.safeParse(username);
        if (!valid.success) {
          setError(`Username: ${valid.error.issues[0]?.message}`);
          return;
        }
        const res = await authClient.signUp.email({ email, password, name: username });
        if (res.error) return setError(res.error.message ?? "Could not sign up");
      } else {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) return setError(res.error.message ?? "Could not sign in");
      }
      router.push(next);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="space-y-4">
      <h1 className="text-xl font-semibold">
        {mode === "login" ? "Sign in" : "Create an account"}
      </h1>
      <SocialButtons google={google} github={github} callbackURL={next} />
      <form onSubmit={onSubmit} className="space-y-3">
        {mode === "signup" && (
          <div className="space-y-1">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" required autoComplete="username" />
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {mode === "login" ? "Sign in" : "Sign up"}
        </Button>
      </form>
      <div className="flex justify-between text-sm">
        {mode === "login" ? (
          <>
            <Link href="/signup" className="text-accent hover:underline">
              Create an account
            </Link>
            <Link href="/forgot" className="text-muted hover:underline">
              Forgot password?
            </Link>
          </>
        ) : (
          <Link href="/login" className="text-accent hover:underline">
            Already have an account?
          </Link>
        )}
      </div>
      <p className="text-xs text-muted">
        Playing as a guest? Signing up keeps your races, coins and skins.
      </p>
    </Card>
  );
}
