import { cn } from "@/lib/cn";
import { AdsenseUnit } from "./adsense-unit";
import type { ActiveAd } from "./queries";

export function AdSlot({ ad, className }: { ad: ActiveAd | null; className?: string }) {
  if (!ad) return null;
  return (
    <aside
      aria-label="Advertisement"
      className={cn("mx-auto max-w-full overflow-hidden", className)}
      style={{ width: ad.width }}
    >
      <p className="mb-1 text-[10px] tracking-wide text-muted uppercase">
        Ad{ad.kind === "house" && ad.advertiser ? ` · ${ad.advertiser}` : ""}
      </p>
      <div
        className="w-full overflow-hidden rounded-lg bg-surface-2"
        style={{ aspectRatio: `${ad.width} / ${ad.height}` }}
      >
        {ad.kind === "adsense" ? (
          <AdsenseUnit client={ad.client} slot={ad.slot} />
        ) : (
          <a href={`/api/ads/click/${ad.id}`} rel="sponsored noopener" target="_blank">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.image}
              alt={ad.alt}
              width={ad.width}
              height={ad.height}
              className="size-full object-cover"
            />
          </a>
        )}
      </div>
    </aside>
  );
}
