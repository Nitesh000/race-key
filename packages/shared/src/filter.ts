const words = [
  "fuck",
  "fucker",
  "fucking",
  "motherfucker",
  "shit",
  "bullshit",
  "bitch",
  "bastard",
  "asshole",
  "dick",
  "dickhead",
  "cunt",
  "cock",
  "pussy",
  "whore",
  "slut",
  "wanker",
  "twat",
  "prick",
  "retard",
  "faggot",
  "fag",
  "nigger",
  "nigga",
  "kys",
  "rape",
  "rapist",
  "nazi",
];

const leet: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
  "!": "i",
};

function squash(word: string) {
  return word
    .toLowerCase()
    .replace(/[013457@$!]/g, (c) => leet[c]!)
    .replace(/[^a-z]/g, "")
    .replace(/(.)\1+/g, "$1");
}

const banned = new Set(words.map(squash));
const stems = ["fuck", "shit", "bitch", "cunt", "nigg", "fagg", "retard", "wank", "whore", "slut"];

export const MAX_CHAT_LENGTH = 200;

export function filterChat(text: string): string {
  const trimmed = text.replace(/\s+/g, " ").trim().slice(0, MAX_CHAT_LENGTH);
  return trimmed.replace(/\S+/g, (token) => {
    const s = squash(token);
    if (!s) return token;
    if (banned.has(s) || stems.some((w) => s.startsWith(w))) return "*".repeat(token.length);
    return token;
  });
}
