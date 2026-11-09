"use client";

import { useEffect, useRef } from "react";

/**
 * Convia AdSense unit renderer.
 * The global adsbygoogle.js script must be loaded once in app/layout.tsx.
 */

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export type ConviaAdUnitName =
  | "multiplex"
  | "leaderboard"
  | "inArticle"
  | "responsive";

const PUBLISHER_ID = "ca-pub-7776844434912624";

const AD_UNITS: Record<
  ConviaAdUnitName,
  {
    slot: string;
    label: string;
    wrapperClass: string;
    insClass: string;
    format?: string;
    layout?: string;
    fullWidthResponsive?: boolean;
    width?: number;
    height?: number;
  }
> = {
  multiplex: {
    slot: "5509141619",
    label: "Multiplex advertisement",
    wrapperClass: "convia-ad-wrap convia-ad-multiplex",
    insClass: "adsbygoogle",
    format: "autorelaxed",
  },
  leaderboard: {
    slot: "2354911961",
    label: "728 by 90 banner advertisement",
    wrapperClass: "convia-ad-wrap convia-ad-leaderboard",
    insClass: "adsbygoogle",
    width: 728,
    height: 90,
  },
  inArticle: {
    slot: "7311509571",
    label: "In-article advertisement",
    wrapperClass: "convia-ad-wrap convia-ad-inarticle",
    insClass: "adsbygoogle",
    format: "fluid",
    layout: "in-article",
  },
  responsive: {
    slot: "2443937103",
    label: "Responsive display advertisement",
    wrapperClass: "convia-ad-wrap convia-ad-responsive",
    insClass: "adsbygoogle",
    format: "auto",
    fullWidthResponsive: true,
  },
};

interface AdSenseUnitProps {
  unit: ConviaAdUnitName;
  /** Optional extra class for the outer wrapper. */
  className?: string;
}

export function AdSenseUnit({ unit, className = "" }: AdSenseUnitProps) {
  const config = AD_UNITS[unit];
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const insRef = useRef<HTMLElement | null>(null);
  const pushedRef = useRef(false);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const ins = insRef.current;
    if (!wrapper || !ins) return;

    let disposed = false;
    let frameId = 0;

    const tryPushAd = () => {
      if (disposed || pushedRef.current) return;

      // The 728x90 unit is hidden on narrow screens. Do not push while hidden.
      if (wrapper.getClientRects().length === 0) return;

      const rect = wrapper.getBoundingClientRect();
      if (rect.width < 120 || rect.height < 1) return;

      const style = window.getComputedStyle(wrapper);
      if (style.display === "none" || style.visibility === "hidden") return;

      // Google marks an initialized <ins> with this attribute.
      if (ins.getAttribute("data-adsbygoogle-status") === "done") {
        pushedRef.current = true;
        return;
      }

      // Mark before push so React Strict Mode / ResizeObserver cannot push twice.
      pushedRef.current = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (error) {
        // Do not repeatedly push the same DOM element after an AdSense error.
        console.error(`Convia AdSense (${unit}) initialization failed:`, error);
      }
    };

    frameId = window.requestAnimationFrame(tryPushAd);

    let resizeObserver: ResizeObserver | undefined;
    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(tryPushAd);
      resizeObserver.observe(wrapper);
    } else {
      window.addEventListener("resize", tryPushAd);
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", tryPushAd);
    };
  }, [unit]);

  const insStyle: React.CSSProperties =
    unit === "leaderboard"
      ? { display: "inline-block", width: "728px", height: "90px" }
      : unit === "inArticle"
        ? { display: "block", textAlign: "center" }
        : { display: "block" };

  return (
    <section
      ref={wrapperRef}
      className={`${config.wrapperClass} ${className}`.trim()}
      aria-label={config.label}
      data-convia-ad-unit={unit}
    >
      <p className="convia-ad-label">Advertisement</p>
      <ins
        ref={insRef}
        className={config.insClass}
        style={insStyle}
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={config.slot}
        {...(config.format ? { "data-ad-format": config.format } : {})}
        {...(config.layout ? { "data-ad-layout": config.layout } : {})}
        {...(config.fullWidthResponsive
          ? { "data-full-width-responsive": "true" }
          : {})}
      />
    </section>
  );
}
