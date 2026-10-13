"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { startCheckout } from "./actions";

export function PremiumButton({
  skinId,
  price,
  state,
}: {
  skinId: string;
  price: number;
  state: "off" | "guest" | "on";
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (state === "off") return <span className="text-center text-xs text-muted">Coming soon</span>;
  if (state === "guest") {
    return (
      <Link href="/signup?next=/locker" className={buttonClass("secondary", "sm")}>
        Sign up to buy
      </Link>
    );
  }
  return (
    <>
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await startCheckout(skinId);
            if (res.ok) window.location.assign(res.url);
            else setError(res.error);
          })
        }
      >
        Buy for ${(price / 100).toFixed(2)}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </>
  );
}
