import type { AdRouteScope } from "@/lib/ads-types";

const BLOCKED_PREFIXES = ["/admin", "/api", "/login", "/signup", "/auth"];

export function normalizePath(pathname: string): string {
  const clean = (pathname || "/").split("?")[0].split("#")[0];
  if (!clean.startsWith("/") || clean.includes("..")) return "/";
  if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
  return clean;
}

export function isEligiblePublicPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return !BLOCKED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function routeMatches(scope: AdRouteScope, configuredPath: string | null, pathname: string): boolean {
  const current = normalizePath(pathname);
  if (!isEligiblePublicPath(current)) return false;
  if (scope === "all") return true;
  if (scope === "home") return current === "/";
  if (scope === "pdf") return current === "/pdf" || current.startsWith("/pdf/");
  if (scope === "exact") return Boolean(configuredPath && current === normalizePath(configuredPath));
  return false;
}
