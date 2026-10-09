import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";
import { AuthUnavailable } from "@/features/auth/auth-unavailable";
import { authEnabled, socialProviders } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  if (!authEnabled()) return <AuthUnavailable />;
  return (
    <Suspense>
      <AuthForm mode="login" {...socialProviders()} />
    </Suspense>
  );
}
