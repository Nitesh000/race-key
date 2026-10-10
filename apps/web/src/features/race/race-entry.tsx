"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ensureSession } from "@/lib/auth-client";

export function SessionGate({
  authEnabled,
  children,
}: {
  authEnabled: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "refreshing" | "ready">(
    authEnabled ? "checking" : "ready",
  );
  const [refreshing, startRefresh] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authEnabled) return;
    ensureSession()
      .then(({ created }) => {
        if (!created) return setState("ready");
        setState("refreshing");
        startRefresh(() => router.refresh());
      })
      .catch((e: Error) => setError(e.message));
  }, [authEnabled, router]);

  useEffect(() => {
    if (state === "refreshing" && !refreshing) setState("ready");
  }, [state, refreshing]);

  if (error) return <p className="py-24 text-center text-danger">{error}</p>;
  if (state !== "ready") return <p className="py-24 text-center text-muted">Getting you a seat…</p>;
  return children;
}
