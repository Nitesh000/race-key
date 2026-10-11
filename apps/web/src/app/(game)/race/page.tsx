import type { Metadata } from "next";
import { FindRoom } from "@/features/race/find-room";
import { SessionGate } from "@/features/race/race-entry";
import { authEnabled } from "@/lib/auth";

export const metadata: Metadata = { title: "Race" };

export default function RacePage() {
  return (
    <main>
      <SessionGate authEnabled={authEnabled()}>
        <FindRoom kind="public" />
      </SessionGate>
    </main>
  );
}
