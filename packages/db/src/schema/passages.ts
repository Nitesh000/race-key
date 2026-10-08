import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { passageType, reportStatus } from "./enums";

export const authors = pgTable("authors", {
  id: text().primaryKey(),
  name: text().notNull(),
  birthYear: smallint(),
  deathYear: smallint(),
});

export const books = pgTable("books", {
  id: text().primaryKey(),
  gutenbergId: integer().notNull().unique(),
  title: text().notNull(),
  authorId: text()
    .notNull()
    .references(() => authors.id),
  publicationYear: smallint().notNull(),
  originalLanguage: text().notNull(),
  translator: text(),
  edition: text().notNull(),
  sourceUrl: text().notNull(),
  releaseDate: text(),
  updatedDate: text(),
  licence: text().notNull().default("public-domain"),
});

export const passages = pgTable(
  "passages",
  {
    id: text().primaryKey(),
    bookId: text()
      .notNull()
      .references(() => books.id),
    text: text().notNull(),
    chapterNumber: integer(),
    chapterTitle: text(),
    paragraphNumber: integer().notNull(),
    offset: integer().notNull(),
    type: passageType().notNull(),
    speaker: text(),
    difficulty: smallint().notNull(),
    checksum: text().notNull().unique(),
    contextBefore: text().notNull().default(""),
    contextAfter: text().notNull().default(""),
    hidden: boolean().notNull().default(false),
    importedAt: timestamp({ withTimezone: true }).notNull(),
    scriptVersion: text().notNull(),
  },
  (t) => [index().on(t.bookId), index().on(t.difficulty)],
);

export const passageReports = pgTable(
  "passage_reports",
  {
    id: serial().primaryKey(),
    passageId: text()
      .notNull()
      .references(() => passages.id, { onDelete: "cascade" }),
    userId: text().references(() => users.id, { onDelete: "set null" }),
    reason: text().notNull(),
    note: text(),
    status: reportStatus().notNull().default("open"),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.passageId), index().on(t.status)],
);

export const favouritePassages = pgTable(
  "favourite_passages",
  {
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    passageId: text()
      .notNull()
      .references(() => passages.id, { onDelete: "cascade" }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.passageId] })],
);
