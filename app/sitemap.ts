import type { MetadataRoute } from "next";
import { PDF_TOOLS } from "@/lib/tools";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://convia.saanwariyasethfashion.com").replace(/\/$/, "");
  const routes = ["/", "/about", "/contact", "/privacy", "/terms", ...PDF_TOOLS.filter((tool) => tool.status === "available").map((tool) => `/pdf/${tool.slug}`)];
  return routes.map((route) => ({ url: `${base}${route}`, lastModified: new Date(), changeFrequency: route === "/" ? "weekly" : "monthly", priority: route === "/" ? 1 : route.startsWith("/pdf/") ? 0.75 : 0.5 }));
}
