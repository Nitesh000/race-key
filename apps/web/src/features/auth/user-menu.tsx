import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { getViewer } from "@/lib/session";
import { SignOutButton } from "./sign-out-button";

export async function UserMenu() {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <Link href="/login" className={buttonClass("secondary", "sm")}>
        Sign in
      </Link>
    );
  }
  const { profile } = viewer;
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="font-mono text-muted tabular-nums" title="Coins">
        ◎ {profile.coins}
      </span>
      <Link href={`/profile/${profile.username}`} className="font-medium hover:underline">
        {profile.username}
        <span className="ml-1 rounded bg-surface-2 px-1.5 py-0.5 text-xs text-muted">
          Lv {profile.level}
        </span>
      </Link>
      {viewer.isGuest ? (
        <Link href="/signup" className={buttonClass("primary", "sm")}>
          Save progress
        </Link>
      ) : (
        <SignOutButton />
      )}
    </div>
  );
}
