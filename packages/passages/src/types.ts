import { z } from "zod";

export const passageTypes = ["paragraph", "dialogue", "quote"] as const;

export const authorSchema = z.object({
  id: z.string(),
  name: z.string(),
  birthYear: z.number().int().nullable(),
  deathYear: z.number().int().nullable(),
});

export const bookSchema = z.object({
  id: z.string(),
  gutenbergId: z.number().int(),
  title: z.string(),
  authorId: z.string(),
  publicationYear: z.number().int(),
  originalLanguage: z.string(),
  translator: z.string().nullable(),
  edition: z.string(),
  sourceUrl: z.url(),
  releaseDate: z.string().nullable(),
  updatedDate: z.string().nullable(),
  licence: z.literal("public-domain"),
});

export const passageSchema = z.object({
  id: z.string(),
  bookId: z.string(),
  text: z.string().min(100).max(400),
  chapterNumber: z.number().int().nullable(),
  chapterTitle: z.string().nullable(),
  paragraphNumber: z.number().int(),
  offset: z.number().int().nonnegative(),
  type: z.enum(passageTypes),
  speaker: z.string().nullable(),
  difficulty: z.number().int().min(1).max(10),
  checksum: z.string().length(16),
  contextBefore: z.string(),
  contextAfter: z.string(),
  importedAt: z.string(),
  scriptVersion: z.string(),
});

export type Author = z.infer<typeof authorSchema>;
export type Book = z.infer<typeof bookSchema>;
export type Passage = z.infer<typeof passageSchema>;
export type PassageType = (typeof passageTypes)[number];
