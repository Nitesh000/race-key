import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "race-key",
  description: "Typing races on passages from real books.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
