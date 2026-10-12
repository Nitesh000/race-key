"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Emoji } from "./emoji";

export function EmojiTray({
  loadout,
  onTaunt,
}: {
  loadout: string[];
  onTaunt: (slot: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button
        variant="secondary"
        size="sm"
        aria-expanded={open}
        aria-label="Send a taunt"
        onClick={() => setOpen((o) => !o)}
      >
        <Emoji char={loadout[0] ?? "👋"} />
      </Button>
      {open && (
        <div className="absolute top-full right-0 z-10 mt-2 grid grid-cols-3 gap-1 rounded-xl border border-border bg-surface p-2 shadow-lg">
          {loadout.map((c, i) => (
            <button
              key={i}
              type="button"
              className="grid size-10 place-items-center rounded-lg text-xl hover:bg-surface-2"
              onClick={() => {
                onTaunt(i + 1);
                setOpen(false);
              }}
            >
              <Emoji char={c} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
