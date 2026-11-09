"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT_ID = "ca-pub-7776844434912624";

interface AdSenseProps {
  adSlot: string;
  className?: string;
}

export function AdSense({ adSlot, className = "" }: AdSenseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLModElement>(null);
  const attemptedRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    const ad = adRef.current;
    if (!container || !ad || !adSlot) return;

    let cancelled = false;
    const initialize = () => {
      if (cancelled || attemptedRef.current) return;
      if (container.getClientRects().length === 0) return;
      if (container.getBoundingClientRect().width <= 0) return;
      const style = window.getComputedStyle(container);
      if (style.display === "none" || style.visibility === "hidden") return;
      if (ad.getAttribute("data-adsbygoogle-status") === "done") {
        attemptedRef.current = true;
        return;
      }
      attemptedRef.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        attemptedRef.current = false;
        console.error("Convia AdSense initialization error:", error);
      }
    };

    const observer = new ResizeObserver(initialize);
    observer.observe(container);
    const frame = requestAnimationFrame(initialize);
    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [adSlot]);

  if (!adSlot) return null;

  return (
    <div ref={containerRef} className={`convia-ad-container w-full min-w-0 ${className}`}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: 90 }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
