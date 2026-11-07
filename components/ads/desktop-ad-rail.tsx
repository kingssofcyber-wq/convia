
"use client";

import { useEffect, useState } from "react";
import { AdSense } from "@/components/ads/adsense";

interface DesktopAdRailProps {
  side: "left" | "right";
  adSlot?: string;
}

export function DesktopAdRail({
  side,
  adSlot = "",
}: DesktopAdRailProps) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1280px)");

    const updateScreen = () => {
      setIsDesktop(media.matches);
    };

    updateScreen();

    media.addEventListener("change", updateScreen);

    return () => {
      media.removeEventListener("change", updateScreen);
    };
  }, []);

  // Do not mount ad units on mobile or tablet.
  if (!isDesktop) return null;

  return (
    <aside
      aria-label={`${side} advertisement`}
      className="w-[160px] min-w-[160px] max-w-[160px]"
    >
      <div className="w-[160px] max-w-full pt-8">
        <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Advertisement
        </p>

        {adSlot ? (
          <AdSense
            adSlot={adSlot}
            className="w-full"
          />
        ) : (
          <div className="flex min-h-[600px] w-full items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 p-3 text-center">
            <div>
              <p className="text-xs font-semibold text-muted-foreground">
                SIDE AD SPACE
              </p>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Add your AdSense slot ID here
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
