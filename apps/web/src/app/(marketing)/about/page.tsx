import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 px-4 py-12 leading-relaxed">
      <h1 className="text-4xl font-bold">About race-key</h1>
      <p>
        race-key is a free typing race game. Every passage is a real paragraph from a public-domain
        book on{" "}
        <a href="https://www.gutenberg.org" className="text-accent hover:underline">
          Project Gutenberg
        </a>
        , kept exactly as the author wrote it, with its full source so you can find it in the
        original.
      </p>
      <p>
        Race strangers matched to your speed, challenge friends, earn coins and skins, and taunt
        each other with emojis. When nobody else is online, bots fill the empty seats.
      </p>
      <p>
        Emoji graphics are{" "}
        <a href="https://github.com/jdecked/twemoji" className="text-accent hover:underline">
          Twemoji
        </a>
        , licensed under CC-BY 4.0. Want to reach our players?{" "}
        <Link href="/advertise" className="text-accent hover:underline">
          Advertise with us
        </Link>
        .
      </p>
    </main>
  );
}
