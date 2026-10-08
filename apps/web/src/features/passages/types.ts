import type { PassageWithSource } from "@race-key/passages";

export type ClientPassage = {
  id: string;
  text: string;
  type: string;
  difficulty: number;
  chapterNumber: number | null;
  chapterTitle: string | null;
  book: { id: string; title: string; year: number; url: string; translator: string | null };
  author: { name: string; birthYear: number | null; deathYear: number | null };
};

export function toClientPassage(p: PassageWithSource): ClientPassage {
  return {
    id: p.id,
    text: p.text,
    type: p.type,
    difficulty: p.difficulty,
    chapterNumber: p.chapterNumber,
    chapterTitle: p.chapterTitle,
    book: {
      id: p.book.id,
      title: p.book.title,
      year: p.book.publicationYear,
      url: p.book.sourceUrl,
      translator: p.book.translator,
    },
    author: { name: p.author.name, birthYear: p.author.birthYear, deathYear: p.author.deathYear },
  };
}
