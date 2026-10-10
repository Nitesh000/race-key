import type { Metadata } from "next";
import { SessionGate } from "@/features/race/race-entry";
import { RaceRoomView } from "@/features/race/race-room-view";
import { authEnabled } from "@/lib/auth";
import { realtimeUrl } from "@/lib/env";

export const metadata: Metadata = { title: "Race" };

export default async function RaceRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return (
    <SessionGate authEnabled={authEnabled()}>
      <RaceRoomView host={realtimeUrl} roomId={roomId} />
    </SessionGate>
  );
}
