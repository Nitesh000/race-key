import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { ClientPassage } from "./types";

export function chapterLabel(p: Pick<ClientPassage, "chapterNumber" | "chapterTitle">) {
  if (p.chapterTitle && /^(letter|stave|part|book)\b/i.test(p.chapterTitle)) return p.chapterTitle;
  if (p.chapterNumber && p.chapterTitle) return `Chapter ${p.chapterNumber}: ${p.chapterTitle}`;
  if (p.chapterNumber) return `Chapter ${p.chapterNumber}`;
  return p.chapterTitle;
}

function lifespan(a: ClientPassage["author"]) {
  if (!a.birthYear && !a.deathYear) return null;
  return `${a.birthYear ?? "?"}–${a.deathYear ?? ""}`;
}

export function SourceCard({
  passage,
  actions,
  showDetailsLink = true,
}: {
  passage: ClientPassage;
  actions?: React.ReactNode;
  showDetailsLink?: boolean;
}) {
  const chapter = chapterLabel(passage);
  const span = lifespan(passage.author);

  return (
    <Card className="flex flex-wrap gap-4 justify-between items-start">
      <div className="space-y-1">
        <p className="text-xs tracking-wide uppercase text-muted">From the book</p>
        <h3 className="text-lg font-semibold">
          <span className="italic">{passage.book.title}</span>{" "}
          <span className="font-normal text-muted">({passage.book.year})</span>
        </h3>
        <p className="text-sm">
          {passage.author.name}
          {span && <span className="text-muted"> · {span}</span>}
          {passage.book.translator && (
            <span className="text-muted"> · translated by {passage.book.translator}</span>
          )}
        </p>
        {chapter && <p className="text-sm text-muted">{chapter}</p>}
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {actions}
        {showDetailsLink ? (
          <Link href={`/passages/${passage.id}`} className="text-sm hover:underline text-accent">
            Passage details
          </Link>
        ) : null}
        <a
          href={passage.book.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm hover:underline text-accent"
        >
          Read the full book
        </a>
      </div>
    </Card>
  );
}
