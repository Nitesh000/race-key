"use client";

import { fontFamilies, useSettings } from "@/features/settings/store";
import { PassageView } from "./passage-view";
import type { useTypingSession } from "./use-typing-session";

type Session = ReturnType<typeof useTypingSession>;

export function TypingArea({
  text,
  session,
  hint = "Click here or press any key to focus",
}: {
  text: string;
  session: Session;
  hint?: string;
}) {
  const settings = useSettings();
  return (
    <div className="relative rounded-2xl border border-border bg-surface px-6 py-5">
      <PassageView
        text={text}
        fontFamily={fontFamilies[settings.font].css}
        fontSize={settings.fontSize}
        caret={settings.caret}
        focused={session.focused}
        containerRef={session.containerRef}
        caretRef={session.caretRef}
        onClick={session.focus}
      />
      <input {...session.inputProps} />
      <p
        className="mt-3 h-5 text-sm text-muted"
        aria-live="polite"
        style={{ visibility: session.focused || session.status === "done" ? "hidden" : "visible" }}
      >
        {hint}
      </p>
    </div>
  );
}
