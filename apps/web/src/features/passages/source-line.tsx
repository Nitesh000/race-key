import type { ClientPassage } from "./types";

export function SourceLine({ passage }: { passage: ClientPassage }) {
  return (
    <p>
      <span className="italic">{passage.book.title}</span> by {passage.author.name}
    </p>
  );
}
