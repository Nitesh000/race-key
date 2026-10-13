import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { AdvertiseForm } from "@/features/ads/advertise-form";

export const metadata: Metadata = { title: "Advertise with us" };

export default function AdvertisePage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Advertise with us</h1>
        <p className="text-lg text-muted">
          race-key players are readers and fast typists. Ads show on the home page, in race lobbies
          and on results screens, never while someone is typing.
        </p>
      </div>
      <Card>
        <ul className="grid gap-2 text-sm sm:grid-cols-3">
          <li>
            <b>Home sidebar</b>
            <br />
            <span className="text-muted">300 × 250</span>
          </li>
          <li>
            <b>Race lobby</b>
            <br />
            <span className="text-muted">728 × 90</span>
          </li>
          <li>
            <b>Results screen</b>
            <br />
            <span className="text-muted">728 × 90</span>
          </li>
        </ul>
      </Card>
      <Card>
        <AdvertiseForm />
      </Card>
    </main>
  );
}
