"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function ForgotForm() {
  const [sent, setSent] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    await authClient.requestPasswordReset({ email, redirectTo: "/reset" });
    setSent(true);
  }
  return (
    <Card className="space-y-4">
      <h1 className="text-xl font-semibold">Reset your password</h1>
      {sent ? (
        <p className="text-sm text-muted">
          If that email has an account, a reset link is on its way.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
      )}
    </Card>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const newPassword = String(new FormData(e.currentTarget).get("password"));
    const res = await authClient.resetPassword({ newPassword, token });
    setState(res.error ? "error" : "done");
  }
  return (
    <Card className="space-y-4">
      <h1 className="text-xl font-semibold">Choose a new password</h1>
      {state === "done" ? (
        <p className="text-sm text-success">
          Password changed. <a href="/login">Sign in</a>
        </p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="password">New password</Label>
            <Input id="password" name="password" type="password" minLength={8} required />
          </div>
          {state === "error" && (
            <p role="alert" className="text-sm text-danger">
              That link is invalid or has expired.
            </p>
          )}
          <Button type="submit" className="w-full">
            Save password
          </Button>
        </form>
      )}
    </Card>
  );
}
