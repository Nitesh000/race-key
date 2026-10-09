import { z } from "zod";
import { pick, randInt, type Rng } from "./random";

const adjectives = [
  "swift",
  "quiet",
  "brave",
  "lucky",
  "sleepy",
  "fuzzy",
  "clever",
  "cosmic",
  "rapid",
  "silent",
  "golden",
  "tiny",
  "mighty",
  "bold",
  "calm",
  "wild",
  "frosty",
  "sunny",
  "rusty",
  "witty",
  "nimble",
  "dizzy",
  "lazy",
  "jolly",
  "shy",
  "noble",
  "sneaky",
  "zesty",
  "crispy",
  "spicy",
  "electric",
  "lunar",
  "solar",
  "misty",
  "stormy",
  "velvet",
  "neon",
  "pixel",
  "turbo",
  "atomic",
  "humble",
  "eager",
  "fancy",
  "gentle",
  "happy",
  "icy",
  "keen",
  "mellow",
  "plucky",
  "royal",
];

const nouns = [
  "otter",
  "falcon",
  "panda",
  "fox",
  "tiger",
  "badger",
  "koala",
  "lynx",
  "raven",
  "gecko",
  "walrus",
  "comet",
  "rocket",
  "pixel",
  "cactus",
  "maple",
  "pebble",
  "thunder",
  "nova",
  "ember",
  "moose",
  "heron",
  "beetle",
  "squid",
  "llama",
  "yak",
  "orca",
  "puffin",
  "mango",
  "noodle",
  "waffle",
  "biscuit",
  "pepper",
  "quill",
  "typist",
  "keys",
  "lemur",
  "wombat",
  "narwhal",
  "sparrow",
  "kestrel",
  "marmot",
  "newt",
  "ferret",
  "bison",
  "coyote",
  "dingo",
  "jaguar",
  "manta",
  "tapir",
];

const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);

const patterns: ((rng: Rng) => string)[] = [
  (r) => `${cap(pick(r, adjectives))}${cap(pick(r, nouns))}`,
  (r) => `${pick(r, adjectives)}_${pick(r, nouns)}`,
  (r) => `${pick(r, adjectives)}${pick(r, nouns)}${randInt(r, 1, 99)}`,
  (r) => `${cap(pick(r, nouns))}${randInt(r, 100, 9999)}`,
  (r) => `${pick(r, nouns)}.${pick(r, adjectives)}`,
  (r) => `${cap(pick(r, adjectives))}${cap(pick(r, nouns))}${randInt(r, 1, 9)}`,
  (r) => `the${cap(pick(r, adjectives))}${cap(pick(r, nouns))}`,
  (r) => `${pick(r, nouns)}${pick(r, nouns)}`,
];

export const usernameSchema = z
  .string()
  .min(3, "at least 3 characters")
  .max(20, "at most 20 characters")
  .regex(/^[a-zA-Z0-9_.-]+$/, "letters, numbers, dot, dash and underscore only");

export function randomName(rng: Rng = Math.random): string {
  for (;;) {
    const name = pick(rng, patterns)(rng);
    if (usernameSchema.safeParse(name).success) return name;
  }
}

export function uniqueNames(count: number, taken: Iterable<string>, rng: Rng = Math.random) {
  const used = new Set([...taken].map((n) => n.toLowerCase()));
  const out: string[] = [];
  while (out.length < count) {
    const name = randomName(rng);
    if (used.has(name.toLowerCase())) continue;
    used.add(name.toLowerCase());
    out.push(name);
  }
  return out;
}
