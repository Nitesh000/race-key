import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import { AdSlot } from "@/features/ads/ad-slot";
import { getAd } from "@/features/ads/queries";

export default async function Home() {
  const ad = await getAd("home-sidebar");
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 lg:flex-row lg:items-start">
      <div className="flex-1">
        <h1 className="max-w-2xl text-5xl font-bold tracking-tight">
          Race your friends on passages from real books.
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">
          Free typing races, live progress, emoji taunts and skins you earn by playing.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/race" className={buttonClass("primary", "lg")}>
            Start a race
          </Link>
          <Link href="/race/private" className={buttonClass("secondary", "lg")}>
            Race a friend
          </Link>
          <Link href="/practice" className={buttonClass("ghost", "lg")}>
            Practice
          </Link>
        </div>
      </div>
      <AdSlot ad={ad} className="shrink-0" />
    </main>
  );
}
