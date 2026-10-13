"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdsenseUnit({ client, slot }: { client: string; slot: string }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch (e) {
      console.warn("adsense did not load", e);
    }
  }, []);
  return (
    <>
      <Script
        id="adsense"
        strategy="afterInteractive"
        crossOrigin="anonymous"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`}
      />
      <ins
        className="adsbygoogle block size-full"
        data-ad-client={client}
        data-ad-slot={slot}
        data-full-width-responsive="false"
      />
    </>
  );
}
