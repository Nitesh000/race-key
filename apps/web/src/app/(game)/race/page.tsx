import type { Metadata } from "next";
import { NewRoom } from "@/features/race/new-room";
import { SessionGate } from "@/features/race/race-entry";
import { authEnabled } from "@/lib/auth";

export const metadata: Metadata = { title: "Race" };

export default function RacePage() {
  return (
    <main>
      <SessionGate authEnabled={authEnabled()}>
        <NewRoom />
      </SessionGate>
    </main>
  );
}
