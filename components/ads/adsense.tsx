"use client";

import { useEffect } from "react";

// TypeScript के लिए (ताकि window.adsbygoogle पर एरर न आए)
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdSenseProps {
  adSlot: string;
  adFormat?: string;
  style?: React.CSSProperties;
}

export function AdSense({
  adSlot,
  adFormat = "auto",
  style = { display: "block" },
}: AdSenseProps) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className="w-full overflow-hidden my-6">
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client="ca-pub-7776844434912624" // यहाँ अपनी ca-pub ID डालें
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}