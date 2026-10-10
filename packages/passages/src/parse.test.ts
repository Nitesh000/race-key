import { describe, expect, it } from "vitest";
import {
  chunk,
  classify,
  extract,
  matchHeading,
  parseHeader,
  parseNumeral,
  rankDifficulty,
  sentences,
} from "./parse";
import { passages } from "./index";
import { passageSchema } from "./types";

const long = (n: number) => "Word ".repeat(n).trim() + ".";

const book = [
  "Title: A Test Book",
  "Translator: Somebody Else",
  "Release date: March 1, 2001 [eBook #9]",
  "Most recently updated: May 2, 2024",
  "",
  "*** START OF THE PROJECT GUTENBERG EBOOK A TEST BOOK ***",
  "",
  "CHAPTER I.",
  "",
  "The Beginning",
  "",
  "It was a _bright_ cold day in April, and the clocks were striking thirteen. Winston",
  "Smith, his chin nuzzled into his breast, slipped quickly through the glass doors.",
  "",
  "Too short.",
  "",
  "“I shall go,” said Elizabeth, “and you will stay here with the others until the",
  "carriage comes back for all of us tomorrow morning at the usual hour.”",
  "",
  "CHAPTER II",
  "",
  "[Illustration]",
  "",
  "A second chapter begins here, and it carries on for long enough to be a passage.",
  "It has two lines and nothing else to say about anything at all really.",
  "",
  "*** END OF THE PROJECT GUTENBERG EBOOK A TEST BOOK ***",
  "license text that should be ignored entirely because it sits after the end marker",
].join("\r\n");

describe("parseHeader", () => {
  it("reads title, translator and dates", () => {
    expect(parseHeader(book)).toEqual({
      title: "A Test Book",
      translator: "Somebody Else",
      releaseDate: "March 1, 2001",
      updatedDate: "May 2, 2024",
    });
  });
});

describe("headings", () => {
  it("parses numerals", () => {
    expect(parseNumeral("XIV")).toBe(14);
    expect(parseNumeral("12")).toBe(12);
    expect(parseNumeral("Three")).toBe(3);
  });

  it("matches chapter lines", () => {
    expect(matchHeading("CHAPTER IV. The Storm")).toEqual({ number: 4, title: "The Storm" });
    expect(matchHeading("II. THE RED-HEADED LEAGUE")).toEqual({
      number: 2,
      title: "The Red-Headed League",
    });
    expect(matchHeading("Letter 3")).toEqual({ number: 3, title: "Letter 3" });
    expect(matchHeading("It was a dark and stormy night.")).toBeNull();
  });
});

describe("sentences and chunk", () => {
  it("does not split on titles like Mr.", () => {
    expect(sentences("Mr. Darcy came. He left again! Then what?")).toEqual([
      "Mr. Darcy came.",
      "He left again!",
      "Then what?",
    ]);
  });

  it("keeps passages between 100 and 400 chars and cuts only at sentence ends", () => {
    expect(chunk("short")).toEqual([]);
    const s = long(30);
    const text = [s, s, s, s].join(" ");
    const pieces = chunk(text);
    expect(pieces.length).toBeGreaterThan(1);
    for (const p of pieces) {
      expect(p.text.length).toBeGreaterThanOrEqual(100);
      expect(p.text.length).toBeLessThanOrEqual(400);
      expect(p.text.endsWith(".")).toBe(true);
      expect(text.slice(p.start, p.start + p.text.length)).toBe(p.text);
    }
  });
});

describe("classify", () => {
  it("finds dialogue and the speaker", () => {
    expect(classify("“Yes,” said Holmes, “it is.”")).toEqual({
      type: "dialogue",
      speaker: "Holmes",
    });
    expect(classify("He walked on.")).toEqual({ type: "paragraph", speaker: null });
  });
});

describe("extract", () => {
  const out = extract(book);

  it("ignores text outside the gutenberg markers and short paragraphs", () => {
    expect(out.map((c) => c.text.slice(0, 12))).toEqual([
      "It was a bri",
      "“I shall go,",
      "A second cha",
    ]);
  });

  it("strips italics markup and records chapter and offset", () => {
    const [first] = out;
    expect(first!.text).toContain("a bright cold day");
    expect(first!.chapterNumber).toBe(1);
    expect(first!.chapterTitle).toBe("The Beginning");
    expect(first!.paragraphNumber).toBe(1);
    expect(book.slice(first!.offset, first!.offset + 8)).toBe("It was a");
  });

  it("skips illustration placeholders when looking for a chapter title", () => {
    expect(out[2]!.chapterNumber).toBe(2);
    expect(out[2]!.chapterTitle).toBeNull();
  });

  it("finds the speaker in dialogue", () => {
    expect(out[1]!.type).toBe("dialogue");
    expect(out[1]!.speaker).toBe("Elizabeth");
  });
});

describe("rankDifficulty", () => {
  it("spreads scores over 1 to 10", () => {
    const ranks = rankDifficulty(Array.from({ length: 100 }, (_, i) => i / 100));
    expect(ranks[0]).toBe(1);
    expect(ranks[99]).toBe(10);
  });
});

describe("imported data", () => {
  it("is valid and has unique ids and checksums", () => {
    const ids = new Set<string>();
    const sums = new Set<string>();
    for (const p of passages) {
      expect(passageSchema.safeParse(p).success).toBe(true);
      ids.add(p.id);
      sums.add(p.checksum);
    }
    expect(ids.size).toBe(passages.length);
    expect(sums.size).toBe(passages.length);
  });
});

describe("front matter", () => {
  it("skips prefaces before the first chapter", () => {
    const text = [
      "*** START OF THE PROJECT GUTENBERG EBOOK X ***",
      "",
      "PREFACE",
      "",
      "This preface was written by a later editor and talks about the author at some length, which is not what we want.",
      "",
      "CHAPTER I",
      "",
      "The real story starts here, with a sentence that is long enough to count as a passage for the race we run.",
      "",
      "CHAPTER II",
      "",
      "And the second chapter continues the real story with yet another sentence that is long enough to keep.",
      "",
      "*** END OF THE PROJECT GUTENBERG EBOOK X ***",
    ].join("\n");
    expect(extract(text).map((c) => c.chapterNumber)).toEqual([1, 2]);
  });
});

describe("race data", async () => {
  const { pickRacePassage, racePassage } = await import("./race");

  it("matches the full passage data", () => {
    for (const p of passages.slice(0, 200)) {
      expect(racePassage(p.id)?.text).toBe(p.text);
    }
  });

  it("picks within the difficulty band for a speed", () => {
    const byId = new Map(passages.map((p) => [p.id, p]));
    for (let i = 0; i < 50; i++) {
      const p = pickRacePassage({ wpm: 30 });
      expect(byId.get(p.id)!.difficulty).toBeLessThanOrEqual(4);
      expect(p.title.length).toBeGreaterThan(0);
    }
  });
});
