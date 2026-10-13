import Link from "next/link";
import { Suspense } from "react";
import { UserMenu } from "@/features/auth/user-menu";

const links = [
  { href: "/race", label: "Race" },
  { href: "/practice", label: "Practice" },
  { href: "/locker", label: "Locker" },
  { href: "/friends", label: "Friends" },
  { href: "/leaderboard", label: "Leaders" },
  { href: "/settings", label: "Settings" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="font-mono text-lg font-bold tracking-tight">
          race<span className="text-accent">-</span>key
        </Link>
        <nav className="order-last -mx-4 flex w-[calc(100%+2rem)] gap-4 overflow-x-auto px-4 text-sm whitespace-nowrap md:order-none md:mx-0 md:w-auto md:px-0">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted hover:text-text">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Suspense>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}
