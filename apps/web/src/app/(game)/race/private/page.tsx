import type { Metadata } from "next";
import { FindRoom } from "@/features/race/find-room";
import { SessionGate } from "@/features/race/race-entry";
import { authEnabled } from "@/lib/auth";

export const metadata: Metadata = { title: "Race a friend" };

export default function PrivateRacePage() {
  return (
    <main>
      <SessionGate authEnabled={authEnabled()}>
        <FindRoom kind="private" />
      </SessionGate>
    </main>
  );
}
