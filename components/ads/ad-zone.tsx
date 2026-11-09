"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import type { AdZone, PublicAdUnit } from "@/lib/ads-types";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

function ManagedAdUnit({ unit }: { unit: PublicAdUnit }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const pushedRef = useRef(false);
  const [deviceAllowed, setDeviceAllowed] = useState(unit.device === "all");

  useEffect(() => {
    if (unit.device === "all") {
      setDeviceAllowed(true);
      return;
    }
    const query = unit.device === "desktop" ? "(min-width: 768px)" : "(max-width: 767px)";
    const media = window.matchMedia(query);
    const update = () => setDeviceAllowed(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [unit.device]);

  useEffect(() => {
    if (!deviceAllowed) return;
    const container = containerRef.current;
    const ins = insRef.current;
    if (!container || !ins) return;

    let active = true;
    const tryPush = () => {
      if (!active || pushedRef.current) return;
      if (!ins.isConnected || container.getClientRects().length === 0) return;
      if (container.getBoundingClientRect().width <= 0) return;
      if (ins.getAttribute("data-adsbygoogle-status") === "done") {
        pushedRef.current = true;
        return;
      }
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
        pushedRef.current = true;
      } catch (error) {
        pushedRef.current = true;
        console.error("Convia AdSense unit failed:", unit.slot_id, error);
      }
    };

    const observer = new ResizeObserver(tryPush);
    observer.observe(container);
    const frame = window.requestAnimationFrame(tryPush);

    return () => {
      active = false;
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [deviceAllowed, unit.id, unit.slot_id]);

  if (!deviceAllowed) return null;

  const fixed = Boolean(unit.width_px && unit.height_px);
  const adStyle: CSSProperties = fixed
    ? { display: "inline-block", width: `${unit.width_px}px`, height: `${unit.height_px}px`, maxWidth: "100%" }
    : {
        display: "block",
        width: "100%",
        minHeight: unit.ad_format === "autorelaxed" ? 180 : 100,
        ...(unit.ad_layout === "in-article" ? { textAlign: "center" as const } : {}),
      };

  return (
    <div ref={containerRef} className="convia-managed-ad-unit" data-ad-name={unit.name}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={adStyle}
        data-ad-client={unit.publisher_id}
        data-ad-slot={unit.slot_id}
        data-ad-format={unit.ad_format || undefined}
        data-full-width-responsive={unit.full_width_responsive ? "true" : "false"}
        data-ad-layout={unit.ad_layout || undefined}
        data-ad-layout-key={unit.ad_layout_key || undefined}
      />
    </div>
  );
}

export function AdZone({ zone, className = "" }: { zone: AdZone; className?: string }) {
  const pathname = usePathname() || "/";
  const [units, setUnits] = useState<PublicAdUnit[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    setUnits([]);
    const query = new URLSearchParams({ zone, pathname });

    fetch(`/api/ads/config?${query.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return { ads: [] as PublicAdUnit[] };
        return response.json() as Promise<{ ads?: PublicAdUnit[] }>;
      })
      .then((payload) => setUnits(Array.isArray(payload.ads) ? payload.ads : []))
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") {
          console.warn("Convia Ad Manager config could not be loaded.", error);
        }
      });

    return () => controller.abort();
  }, [pathname, zone]);

  if (!units.length) return null;

  return (
    <div className={`convia-ad-zone convia-ad-zone-${zone} ${className}`} aria-label="Advertisement">
      {units.map((unit) => <ManagedAdUnit key={`${pathname}:${unit.id}`} unit={unit} />)}
    </div>
  );
}
