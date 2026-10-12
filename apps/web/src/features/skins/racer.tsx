import skinArt from "@race-key/assets/skins.json";
import { cn } from "@/lib/cn";

const art = skinArt as Record<string, string>;

export function Racer({
  skin,
  you,
  className,
}: {
  skin: string;
  you?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 24"
      aria-hidden
      className={cn("racer-art h-full w-auto overflow-visible", className)}
      style={
        {
          "--skin-body": you ? "var(--accent)" : "var(--racer-tint)",
          "--skin-detail": "var(--surface)",
        } as React.CSSProperties
      }
      dangerouslySetInnerHTML={{ __html: art[skin] ?? art.hatchback! }}
    />
  );
}
