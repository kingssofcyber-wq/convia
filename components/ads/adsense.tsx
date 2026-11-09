
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

export function AdSense({
  adSlot,
  className = "",
}: AdSenseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);
  const failed = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    const ad = adRef.current;

    if (!container || !ad || !adSlot) return;

    let cancelled = false;

    const initializeAd = () => {
      if (cancelled || initialized.current || failed.current) {
        return;
      }

      // Container must be visible and have actual width.
      if (container.getClientRects().length === 0) return;

      const width = container.getBoundingClientRect().width;

      if (width <= 0) return;

      const computedStyle = window.getComputedStyle(container);

      if (
        computedStyle.display === "none" ||
        computedStyle.visibility === "hidden"
      ) {
        return;
      }

      // Prevent initializing an already-filled slot.
      if (
        ad.getAttribute("data-adsbygoogle-status") === "done"
      ) {
        initialized.current = true;
        return;
      }

      initialized.current = true;

      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        failed.current = true;
        console.error("Convia AdSense Error:", error);
      }
    };

    const observer = new ResizeObserver(initializeAd);

    observer.observe(container);

    const frame = requestAnimationFrame(initializeAd);

    return () => {
      cancelled = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [adSlot]);

  return (
    <div
      ref={containerRef}
      className={`convia-ad-container ${className}`}
    >
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: "block",
          width: "100%",
          minHeight: "100px",
        }}
        data-ad-client="ca-pub-7776844434912624"
        data-ad-slot="4116852365"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
