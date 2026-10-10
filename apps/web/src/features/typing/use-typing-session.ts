"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSettings } from "@/features/settings/store";
import { TypingEngine, type KeystrokeKind, type TypingStats } from "./engine";
import { click } from "./sound";

export type SessionStatus = "idle" | "running" | "done";

type Options = {
  text: string;
  enabled?: boolean;
  onKeystroke?: (engine: TypingEngine, kind: KeystrokeKind) => void;
  onFinish?: (engine: TypingEngine) => void;
  interceptKey?: (e: KeyboardEvent) => boolean;
};

const emptyStats: TypingStats = {
  wpm: 0,
  rawWpm: 0,
  accuracy: 1,
  elapsed: 0,
  progress: 0,
  errors: 0,
};

export function useTypingSession({
  text,
  enabled = true,
  onKeystroke,
  onFinish,
  interceptKey,
}: Options) {
  const engineRef = useRef(new TypingEngine(text));
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLDivElement>(null);
  const paintedEnd = useRef(0);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [stats, setStats] = useState<TypingStats>(emptyStats);
  const [focused, setFocused] = useState(false);

  const callbacks = useRef({ onKeystroke, onFinish, interceptKey });
  useEffect(() => {
    callbacks.current = { onKeystroke, onFinish, interceptKey };
  });

  const moveCaret = useCallback(() => {
    const container = containerRef.current;
    const caret = caretRef.current;
    if (!container || !caret) return;
    const e = engineRef.current;
    const spans = container.children;
    const idx = Math.min(e.typedEnd, text.length);
    const target = (spans[idx] ?? spans[idx - 1]) as HTMLElement | undefined;
    if (!target) return;
    const atEnd = idx >= spans.length;
    const x = target.offsetLeft + (atEnd ? target.offsetWidth : 0);
    const y = target.offsetTop;
    caret.style.height = `${target.offsetHeight}px`;
    if (caret.classList.contains("caret-block")) caret.style.width = `${target.offsetWidth || 8}px`;
    const dy = caret.classList.contains("caret-underline") ? target.offsetHeight - 2 : 0;
    caret.style.transform = `translate(${x}px, ${y + dy}px)`;
  }, [text]);

  const paint = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const e = engineRef.current;
    const spans = container.children;
    const end = Math.max(paintedEnd.current, e.typedEnd);
    const from = Math.max(0, Math.min(paintedEnd.current, e.pos) - 1);
    for (let i = from; i <= end && i < spans.length; i++) {
      const el = spans[i] as HTMLElement;
      const s = i < e.pos ? "c" : i < e.typedEnd ? "w" : "";
      if ((el.dataset.s ?? "") !== s) {
        if (s) el.dataset.s = s;
        else delete el.dataset.s;
      }
    }
    paintedEnd.current = e.typedEnd;
    moveCaret();
  }, [moveCaret]);

  const reset = useCallback(() => {
    engineRef.current = new TypingEngine(text);
    paintedEnd.current = text.length;
    paint();
    paintedEnd.current = 0;
    setStatus("idle");
    setStats(emptyStats);
  }, [text, paint]);

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    const onResize = () => moveCaret();
    window.addEventListener("resize", onResize);
    document.fonts?.ready.then(moveCaret);
    return () => window.removeEventListener("resize", onResize);
  }, [moveCaret]);

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => {
      const e = engineRef.current;
      const now = performance.now();
      e.sample(now);
      setStats(e.stats(now));
    }, 1000);
    return () => clearInterval(id);
  }, [status]);

  const focus = useCallback(() => inputRef.current?.focus({ preventScroll: true }), []);

  const start = useCallback((at: number) => {
    engineRef.current.begin(at);
    setStatus("running");
  }, []);

  const finish = useCallback(() => {
    const e = engineRef.current;
    const now = e.finishedAt ?? performance.now();
    e.sample(now);
    setStats(e.stats(now));
    setStatus("done");
    callbacks.current.onFinish?.(e);
  }, []);

  const onKeyDown = useCallback(
    (ev: React.KeyboardEvent<HTMLInputElement>) => {
      const native = ev.nativeEvent;
      if (callbacks.current.interceptKey?.(native)) {
        ev.preventDefault();
        return;
      }
      if (ev.key === "Escape") {
        inputRef.current?.blur();
        return;
      }
      if (!enabled) return;
      const e = engineRef.current;
      if (e.done) return;
      if (ev.ctrlKey || ev.metaKey || ev.altKey) {
        if (ev.key === "Backspace") ev.preventDefault();
        return;
      }
      const now = performance.now();
      let kind: KeystrokeKind | null = null;
      if (ev.key === "Backspace") {
        ev.preventDefault();
        if (e.backspace(now)) kind = "backspace";
      } else if (ev.key.length === 1) {
        ev.preventDefault();
        kind = e.type(ev.key, now);
      } else {
        return;
      }
      if (!kind) return;
      if (status === "idle") setStatus("running");
      caretRef.current?.setAttribute("data-typing", "true");
      paint();
      if (getSettings().sound && kind !== "backspace") click(kind === "wrong");
      callbacks.current.onKeystroke?.(e, kind);
      if (e.done) finish();
    },
    [enabled, paint, status, finish],
  );

  const inputProps = {
    ref: inputRef,
    onKeyDown,
    onFocus: () => setFocused(true),
    onBlur: () => {
      setFocused(false);
      caretRef.current?.removeAttribute("data-typing");
    },
    onPaste: (e: React.ClipboardEvent) => e.preventDefault(),
    onDrop: (e: React.DragEvent) => e.preventDefault(),
    onChange: () => {},
    value: "",
    autoComplete: "off",
    autoCorrect: "off",
    autoCapitalize: "off",
    spellCheck: false,
    "aria-label": "Type the passage",
    className: "absolute inset-0 h-full w-full cursor-text opacity-0 text-[16px]",
  } as const;

  return {
    engine: engineRef,
    containerRef,
    caretRef,
    inputProps,
    status,
    stats,
    focused,
    focus,
    reset,
    start,
  };
}
