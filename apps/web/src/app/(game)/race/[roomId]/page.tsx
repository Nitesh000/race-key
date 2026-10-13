import type { Metadata } from "next";
import { AdSlot } from "@/features/ads/ad-slot";
import { getAd } from "@/features/ads/queries";
import { SessionGate } from "@/features/race/race-entry";
import { RaceRoomView } from "@/features/race/race-room-view";
import { authEnabled } from "@/lib/auth";
import { realtimeUrl } from "@/lib/env";

export const metadata: Metadata = { title: "Race" };

export default async function RaceRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  const [lobby, results] = await Promise.all([getAd("lobby"), getAd("results")]);
  return (
    <SessionGate authEnabled={authEnabled()}>
      <RaceRoomView
        host={realtimeUrl}
        roomId={roomId}
        ads={{ lobby: <AdSlot ad={lobby} />, results: <AdSlot ad={results} /> }}
      />
    </SessionGate>
  );
}
