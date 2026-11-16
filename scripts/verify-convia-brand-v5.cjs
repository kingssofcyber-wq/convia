const fs = require("node:fs");
const path = require("node:path");
const root = process.cwd();
const required = [
  "components/brand/convia-logo.tsx",
  "components/layout/site-header.tsx",
  "components/layout/navbar.tsx",
  "components/layout/tool-header.tsx",
  "components/pdf/tool-page-header.tsx",
  "app/convia-brand-v5.css",
  "public/brand/convia-mark.png",
  "public/brand/convia-logo.svg",
  "public/brand/convia-social-card.png",
  "app/icon.svg",
  "app/favicon.ico",
  "app/apple-icon.png",
];
let failed = false;
for (const rel of required) {
  const ok = fs.existsSync(path.join(root, rel));
  console.log(`${ok ? "[OK]" : "[MISSING]"} ${rel}`);
  if (!ok) failed = true;
}
const headerPath = path.join(root, "components/layout/site-header.tsx");
const header = fs.existsSync(headerPath) ? fs.readFileSync(headerPath, "utf8") : "";
const links = (header.match(/href:\s*["']\/pdf\//g) || []).length;
console.log(`[INFO] PDF mega-menu route entries: ${links}`);
if (!header.includes("cv5-pdf-mega-menu") || !header.includes("ConviaLogo")) failed = true;
const layoutPath = path.join(root, "app/layout.tsx");
const layout = fs.existsSync(layoutPath) ? fs.readFileSync(layoutPath, "utf8") : "";
if (!layout.includes('import "./convia-brand-v5.css";')) {
  console.log("[MISSING] app/layout.tsx imports convia-brand-v5.css");
  failed = true;
} else console.log("[OK] app/layout.tsx imports convia-brand-v5.css");
if (!/<SiteHeader\s*\/?\s*>/.test(layout) && !/<Navbar\s*\/?\s*>/.test(layout)) {
  console.log("[WARNING] Root layout does not visibly mount SiteHeader or Navbar");
}
if (failed) process.exit(1);
console.log("[Convia Brand Refresh v5] Verification checks passed.");
