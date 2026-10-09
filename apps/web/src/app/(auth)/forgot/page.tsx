import type { Metadata } from "next";
import { AuthUnavailable } from "@/features/auth/auth-unavailable";
import { ForgotForm } from "@/features/auth/forgot-form";
import { authEnabled } from "@/lib/auth";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPage() {
  return authEnabled() ? <ForgotForm /> : <AuthUnavailable />;
}
