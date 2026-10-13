"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-surface-2 p-2 text-left">
      <code className="min-w-0 flex-1 truncate px-2 text-sm">{path}</code>
      <Button
        size="sm"
        variant="secondary"
        onClick={async () => {
          await navigator.clipboard.writeText(new URL(path, window.location.origin).toString());
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "Copied" : "Copy link"}
      </Button>
    </div>
  );
}
