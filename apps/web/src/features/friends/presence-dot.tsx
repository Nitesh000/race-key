import type { PresenceStatus } from "@race-key/shared";
import { cn } from "@/lib/cn";

const labels: Record<PresenceStatus, string> = {
  online: "Online",
  racing: "In a race",
  offline: "Offline",
};

export function PresenceDot({ status }: { status: PresenceStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted">
      <span
        aria-hidden
        className={cn(
          "size-2 rounded-full",
          status === "online" && "bg-success",
          status === "racing" && "bg-warning",
          status === "offline" && "bg-border",
        )}
      />
      {labels[status]}
    </span>
  );
}
