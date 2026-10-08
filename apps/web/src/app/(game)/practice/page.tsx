import { getPassage, randomPassage } from "@race-key/passages";
import type { Metadata } from "next";
import { PracticeSession } from "@/features/practice/practice-session";
import { toClientPassage } from "@/features/passages/types";

export const metadata: Metadata = { title: "Practice" };

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<{ p?: string }>;
}) {
  const { p } = await searchParams;
  const passage = (p && getPassage(p)) || randomPassage();
  return (
    <main>
      <PracticeSession initial={toClientPassage(passage)} />
    </main>
  );
}
