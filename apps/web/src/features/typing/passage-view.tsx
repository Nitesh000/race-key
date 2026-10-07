"use client";

import { memo } from "react";
import { cn } from "@/lib/cn";
import type { CaretStyle } from "@/features/settings/store";

type Props = {
  text: string;
  fontFamily: string;
  fontSize: number;
  caret: CaretStyle;
  focused: boolean;
  containerRef: React.Ref<HTMLDivElement>;
  caretRef: React.Ref<HTMLDivElement>;
  onClick?: () => void;
  missed?: Set<number>;
};

export const PassageView = memo(function PassageView({
  text,
  fontFamily,
  fontSize,
  caret,
  focused,
  containerRef,
  caretRef,
  onClick,
  missed,
}: Props) {
  return (
    <div
      className={cn("passage relative cursor-text select-none", !focused && "passage-blurred")}
      style={{ fontFamily, fontSize, lineHeight: 1.6 }}
      onClick={onClick}
    >
      <div ref={containerRef} className="whitespace-pre-wrap break-words">
        {Array.from(text).map((ch, i) => (
          <span key={i} data-s={missed?.has(i) ? "m" : undefined}>
            {ch}
          </span>
        ))}
      </div>
      <div ref={caretRef} aria-hidden className={cn("caret", `caret-${caret}`)} />
    </div>
  );
});
