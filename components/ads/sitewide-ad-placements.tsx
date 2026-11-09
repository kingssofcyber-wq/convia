"use client";

import { usePathname } from "next/navigation";
import { AdSenseUnit } from "@/components/ads/adsense-unit";

type Position = "top" | "bottom";

// Keep advertisements away from auth, empty placeholder, and coming-soon pages.
// Add a route here when it is a genuine content page and ready for ads.
const NO_ADS_ROUTES = new Set([
  "/login",
  "/signup",
  "/404",
  "/not-found",
  "/pdf/page-numbers",
  "/pdf/ocr",
  "/pdf/repair",
  "/pdf/jpg-to-pdf",
  "/pdf/word-to-pdf",
  "/pdf/excel-to-pdf",
  "/pdf/ppt-to-pdf",
  "/pdf/html-to-pdf",
  "/pdf/pdf-to-word",
  "/pdf/pdf-to-excel",
  "/pdf/pdf-to-jpg",
  "/pdf/pdf-to-ppt",
  "/pdf/pdf-to-pdfa",
  "/pdf/edit",
  "/pdf/annotate",
  "/pdf/rotate",
  "/pdf/fill-sign",
  "/pdf/protect",
  "/pdf/unlock",
  "/pdf/sign",
  "/pdf/chat",
  "/pdf/summarize",
  "/pdf/translate",
]);

interface SitewideAdPlacementsProps {
  position: Position;
}

/**
 * Add once above <main> with position="top" and once after </main>
 * with position="bottom" in the root app/layout.tsx.
 */
export function SitewideAdPlacements({
  position,
}: SitewideAdPlacementsProps) {
  const pathname = usePathname() || "/";

  if (
    NO_ADS_ROUTES.has(pathname) ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/") ||
    pathname.includes("/coming-soon")
  ) {
    return null;
  }

  if (position === "top") {
    return (
      <div key={`${pathname}-top-ads`} className="convia-top-ads">
        <AdSenseUnit unit="leaderboard" />
      </div>
    );
  }

  return (
    <div key={`${pathname}-bottom-ads`} className="convia-bottom-ads">
      <AdSenseUnit unit="responsive" />
      <AdSenseUnit unit="inArticle" />
      <AdSenseUnit unit="multiplex" />
    </div>
  );
}
