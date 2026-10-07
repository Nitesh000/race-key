import Link from "next/link";
import { buttonClass } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="max-w-2xl text-5xl font-bold tracking-tight">
        Race your friends on passages from real books.
      </h1>
      <p className="mt-4 max-w-xl text-lg text-muted">
        Free typing races, live progress, emoji taunts and skins you earn by playing.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/race" className={buttonClass("primary", "lg")}>
          Start a race
        </Link>
        <Link href="/practice" className={buttonClass("secondary", "lg")}>
          Practice
        </Link>
      </div>
    </main>
  );
}
