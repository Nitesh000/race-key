"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { acceptFriend, sendFriendRequest } from "./actions";
import type { FriendRelation } from "./queries";

export function FriendButton({
  relation,
  userId,
  username,
}: {
  relation: FriendRelation;
  userId: string;
  username: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (relation === "self" || relation === "friends") return null;
  if (relation === "outgoing") return <span className="text-sm text-muted">Request sent</span>;
  const run = () =>
    start(async () => {
      const res =
        relation === "incoming" ? await acceptFriend(userId) : await sendFriendRequest(username);
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  return (
    <span className="inline-flex items-center gap-2">
      <Button size="sm" variant="secondary" disabled={pending} onClick={run}>
        {relation === "incoming" ? "Accept friend request" : "Add friend"}
      </Button>
      {error && <span className="text-xs text-danger">{error}</span>}
    </span>
  );
}
