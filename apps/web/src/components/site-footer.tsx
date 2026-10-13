import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-sm text-muted">
        <span>race-key · passages from Project Gutenberg · emoji by Twemoji (CC-BY 4.0)</span>
        <nav className="ml-auto flex gap-4">
          <Link href="/about" className="hover:text-text">
            About
          </Link>
          <Link href="/leaderboard" className="hover:text-text">
            Leaderboards
          </Link>
          <Link href="/advertise" className="hover:text-text">
            Advertise
          </Link>
        </nav>
      </div>
    </footer>
  );
}
