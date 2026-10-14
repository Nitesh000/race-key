import { getPassage } from "@race-key/passages";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClass } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { SourceCard } from "@/features/passages/source-card";
import { LeaderboardTable } from "@/features/leaderboard/leaderboard-table";
import { getPassageBest } from "@/features/leaderboard/queries";
import { toClientPassage } from "@/features/passages/types";
import { hasDb } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getPassage((await params).id);
  return { title: p ? `${p.book.title} passage` : "Passage" };
}

export default async function PassagePage({ params }: Props) {
  const passage = getPassage((await params).id);
  if (!passage) notFound();
  const client = toClientPassage(passage);
  const best = hasDb() ? await getPassageBest(passage.id) : [];
  return (
    <main className="py-10 px-4 mx-auto space-y-6 max-w-3xl">
      <Card>
        <CardTitle>Passage</CardTitle>
        <div className="space-y-4 font-serif text-lg leading-relaxed">
          {passage.contextBefore && <p className="text-muted">{passage.contextBefore}</p>}
          <p className="py-2 px-4 rounded-lg border-l-4 border-accent bg-surface-2">
            {passage.text}
          </p>
          {passage.contextAfter && <p className="text-muted">{passage.contextAfter}</p>}
        </div>
        <div className="flex gap-2 mt-5">
          <Link href={`/practice?p=${passage.id}`} className={buttonClass()}>
            Practice this passage
          </Link>
        </div>
      </Card>
      <SourceCard passage={client} showDetailsLink={false} />
      <Card>
        <CardTitle>Best on this passage</CardTitle>
        <LeaderboardTable rows={best} empty="Nobody has raced this passage yet." />
      </Card>
      <Card>
        <CardTitle>Source record</CardTitle>
        <dl className="grid gap-y-1 gap-x-6 text-sm grid-cols-[auto_1fr]">
          <dt className="text-muted">Type</dt>
          <dd className="capitalize">
            {passage.type}
            {passage.speaker && ` (${passage.speaker})`}
          </dd>
          <dt className="text-muted">Paragraph</dt>
          <dd>{passage.paragraphNumber}</dd>
          <dt className="text-muted">Character offset</dt>
          <dd>{passage.offset.toLocaleString()}</dd>
          <dt className="text-muted">Difficulty</dt>
          <dd>{passage.difficulty} / 10</dd>
          <dt className="text-muted">Edition</dt>
          <dd>{passage.book.edition}</dd>
          <dt className="text-muted">Released</dt>
          <dd>
            {passage.book.releaseDate}
            {passage.book.updatedDate && ` (updated ${passage.book.updatedDate})`}
          </dd>
          <dt className="text-muted">Language</dt>
          <dd>{passage.book.originalLanguage}</dd>
          <dt className="text-muted">Licence</dt>
          <dd>Public domain</dd>
          <dt className="text-muted">Checksum</dt>
          <dd className="font-mono">{passage.checksum}</dd>
          <dt className="text-muted">Imported</dt>
          <dd>
            {passage.importedAt.slice(0, 10)} by script v{passage.scriptVersion}
          </dd>
        </dl>
      </Card>
    </main>
  );
}
