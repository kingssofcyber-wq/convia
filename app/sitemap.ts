import type { MetadataRoute } from "next";

const SITE_URL = "https://convia.saanwariyasethfashion.com";

// Only include public pages that currently have useful, available content.
// Coming Soon pages, login and signup are intentionally excluded.
const publicPaths = [
  "/",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/pdf/merge",
  "/pdf/split",
  "/pdf/organize",
  "/pdf/extract",
  "/pdf/compress",
  "/pdf/watermark",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return publicPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/pdf/") ? 0.8 : 0.5,
  }));
}
