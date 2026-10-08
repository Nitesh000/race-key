export function MistakesView({ text, missed }: { text: string; missed: Set<number> }) {
  if (missed.size === 0) return <p className="text-sm text-success">No mistakes. Clean run.</p>;
  return (
    <p className="font-mono text-sm leading-relaxed text-muted">
      {Array.from(text).map((ch, i) =>
        missed.has(i) ? (
          <mark key={i} className="rounded-sm bg-wrong-bg text-wrong">
            {ch === " " ? "·" : ch}
          </mark>
        ) : (
          <span key={i}>{ch}</span>
        ),
      )}
    </p>
  );
}
