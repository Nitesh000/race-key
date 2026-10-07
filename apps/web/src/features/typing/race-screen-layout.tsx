import { cn } from "@/lib/cn";

export function RaceScreenLayout({
  track,
  trackHeight,
  passage,
  stats,
  source,
  below,
}: {
  track?: React.ReactNode;
  trackHeight?: number;
  passage: React.ReactNode;
  stats?: React.ReactNode;
  source?: React.ReactNode;
  below?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6">
      {track !== undefined && (
        <div
          className={cn("relative overflow-hidden rounded-2xl bg-track")}
          style={{ height: trackHeight, contain: "layout paint" }}
        >
          {track}
        </div>
      )}
      <div className="flex min-h-10 items-center justify-between">{stats}</div>
      {passage}
      {source && <div className="text-sm text-muted">{source}</div>}
      {below}
    </div>
  );
}
