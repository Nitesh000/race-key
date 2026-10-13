"use client";

import type { PresenceStatus } from "@race-key/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChallengeButton } from "@/features/challenges/challenge-button";
import { acceptFriend, removeFriend, sendFriendRequest, type FriendResult } from "./actions";
import { PresenceDot } from "./presence-dot";

type Person = { id: string; username: string; level: number; bestWpm: number };

export function FriendsView({
  friends,
  incoming,
  outgoing,
}: {
  friends: (Person & { presence: PresenceStatus })[];
  incoming: Person[];
  outgoing: Person[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<FriendResult>, ok?: string) =>
    start(async () => {
      const res = await fn();
      setMessage(res.ok ? (ok ? { ok: true, text: ok } : null) : { ok: false, text: res.error });
      router.refresh();
    });

  const name_ = (p: Person) => (
    <Link href={`/profile/${p.username}`} className="font-medium hover:underline">
      {p.username}
    </Link>
  );

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <CardTitle>Add a friend</CardTitle>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            run(() => sendFriendRequest(name), `Request sent to ${name}.`);
            setName("");
          }}
        >
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Username"
            aria-label="Username"
          />
          <Button type="submit" disabled={pending}>
            Send request
          </Button>
        </form>
        {message && (
          <p role="status" className={message.ok ? "text-sm text-success" : "text-sm text-danger"}>
            {message.text}
          </p>
        )}
        <div className="flex items-center gap-3 border-t border-border pt-3 text-sm text-muted">
          <span>Or race anyone with a link:</span>
          <ChallengeButton to={null} label="Create challenge link" variant="secondary" />
        </div>
      </Card>

      {incoming.length > 0 && (
        <Card>
          <CardTitle>Requests</CardTitle>
          <ul className="divide-y divide-border">
            {incoming.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2">
                {name_(p)}
                <span className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => acceptFriend(p.id))}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => run(() => removeFriend(p.id))}
                  >
                    Decline
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardTitle>Friends</CardTitle>
        {friends.length === 0 ? (
          <p className="text-sm text-muted">No friends yet. Add someone by username above.</p>
        ) : (
          <ul className="divide-y divide-border">
            {friends.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 py-2">
                <span className="min-w-32">{name_(f)}</span>
                <PresenceDot status={f.presence} />
                <span className="text-xs text-muted">
                  Lv {f.level} · best {Math.round(f.bestWpm)} wpm
                </span>
                <span className="ml-auto flex gap-2">
                  {f.presence !== "racing" && <ChallengeButton to={f.id} />}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() => run(() => removeFriend(f.id))}
                  >
                    Remove
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {outgoing.length > 0 && (
        <Card>
          <CardTitle>Sent</CardTitle>
          <ul className="divide-y divide-border">
            {outgoing.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2">
                {name_(p)}
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => run(() => removeFriend(p.id))}
                >
                  Cancel
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
