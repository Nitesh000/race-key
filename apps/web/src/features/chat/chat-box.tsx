"use client";

import { MAX_CHAT_LENGTH, type ChatMessage } from "@race-key/shared";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export function ChatBox({
  messages,
  you,
  reported,
  onSend,
  onReport,
}: {
  messages: ChatMessage[];
  you: string | null;
  reported: Set<string>;
  onSend: (text: string) => void;
  onReport: (id: string) => void;
}) {
  const [text, setText] = useState("");
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted">Chat</h3>
      <ol
        ref={listRef}
        aria-live="polite"
        className="h-36 space-y-1 overflow-y-auto rounded-lg bg-surface-2 p-2 text-sm"
      >
        {messages.length === 0 && <li className="text-muted">Say hi to the other racers.</li>}
        {messages.map((m) => (
          <li key={m.id} className="group flex items-baseline gap-2">
            <span
              className={cn("shrink-0 font-medium", m.from === you ? "text-accent" : "text-text")}
            >
              {m.name}
            </span>
            <span className="min-w-0 break-words">{m.text}</span>
            {m.from !== you && (
              <button
                type="button"
                disabled={reported.has(m.id)}
                onClick={() => onReport(m.id)}
                className="ml-auto shrink-0 text-xs text-muted opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-100 pointer-coarse:opacity-100"
              >
                {reported.has(m.id) ? "Reported" : "Report"}
              </button>
            )}
          </li>
        ))}
      </ol>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          onSend(text);
          setText("");
        }}
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={MAX_CHAT_LENGTH}
          placeholder="Message"
          aria-label="Chat message"
          className="h-9"
        />
        <Button type="submit" size="sm" variant="secondary">
          Send
        </Button>
      </form>
    </div>
  );
}
