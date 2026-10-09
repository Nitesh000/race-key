import type { Metadata } from "next";
import { ResetForm } from "@/features/auth/forgot-form";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token)
    return <p className="text-center text-muted">This reset link is missing its token.</p>;
  return <ResetForm token={token} />;
}
