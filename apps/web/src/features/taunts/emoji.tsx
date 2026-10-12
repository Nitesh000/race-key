import { twemojiId } from "@race-key/shared";
import { cn } from "@/lib/cn";

export function Emoji({ char, className }: { char: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/assets/emoji/${twemojiId(char)}.svg`}
      alt={char}
      draggable={false}
      className={cn("inline-block size-[1.2em] select-none", className)}
    />
  );
}
