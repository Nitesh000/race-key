import Link from "next/link";

const links = [
  { href: "/race", label: "Race" },
  { href: "/practice", label: "Practice" },
  { href: "/settings", label: "Settings" },
];

export function SiteHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="font-mono text-lg font-bold tracking-tight">
          race<span className="text-accent">-</span>key
        </Link>
        <nav className="flex gap-4 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-muted hover:text-text">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">{right}</div>
      </div>
    </header>
  );
}
