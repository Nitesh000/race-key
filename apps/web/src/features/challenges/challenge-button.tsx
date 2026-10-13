"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createChallenge } from "./actions";

export function ChallengeButton({
  to,
  label = "Challenge",
  variant = "primary",
}: {
  to: string | null;
  label?: string;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <Button
        size="sm"
        variant={variant}
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await createChallenge(to);
            if (!res.ok) return setError(res.error);
            router.push(to ? `/race/${res.roomId}` : `/challenge/${res.id}`);
          })
        }
      >
        {label}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </span>
  );
}
